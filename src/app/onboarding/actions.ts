"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { readFile } from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export async function completeOnboarding(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }

    const userId = session.user.id;

    const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
    const chest = formData.get("chest") ? parseFloat(formData.get("chest") as string) : null;
    const leg = formData.get("leg") ? parseFloat(formData.get("leg") as string) : null;
    const arm = formData.get("arm") ? parseFloat(formData.get("arm") as string) : null;

    const lifestyle = formData.get("lifestyle") as string;
    const trainingSelection = formData.get("trainingSelection") as string;

    try {
        // 0. Verify the user actually exists in the database!
        // If the database was wiped but the browser JWT remains, this will catch the mismatch.
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            return { success: false, error: "Session invalid: Your user account was deleted from the database. Please clear your browser cookies and log in again." };
        }

        // Idempotency guard: if onboarding was already completed, do not execute setup again.
        if (userExists.onboardingCompleted) {
            await unstable_update({
                user: {
                    ...session.user,
                    onboardingCompleted: true,
                },
            });
            revalidatePath("/");
            return { success: true, alreadyCompleted: true };
        }

        // 1. Create or Update the UserProfile
        await prisma.userProfile.upsert({
            where: { userId },
            update: { height, weight, chest, leg, arm, lifestyle },
            create: { userId, height, weight, chest, leg, arm, lifestyle },
        });

        // 2. Load Base Training if selected
        if (trainingSelection === "base") {
            // This calls the logic we previously had in `seed.ts` but scoped entirely to this new user.
            await setupBaseTrainingForUser(userId);
        }

        // 3. Mark User Onboarding as Completed
        await prisma.user.update({
            where: { id: userId },
            data: { onboardingCompleted: true },
        });

        // Force NextAuth JWT cookie to sync with DB so Middleware lets them pass
        await unstable_update({
            user: {
                ...session.user,
                onboardingCompleted: true,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Onboarding Action Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected database error occurred.",
        };
    }
}

// Internal reusable function to attach standard Anatoly definitions to a fresh user
async function setupBaseTrainingForUser(userId: string) {
    type BaseTrainingExercise = {
        name: string;
        sets: number;
        reps: string | null;
        muscle: string;
    };
    type CsvWorkoutRecord = {
        Date: string;
        Exercise: string;
        "Sets x Reps": string;
        "Muscular Group": string;
    };
    const toSafeSetCount = (value: unknown): number => {
        const asNumber = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(asNumber)) return 1;
        const truncated = Math.trunc(asNumber);
        if (truncated < 1) return 1;
        // Prevent pathological values from creating massive set rows.
        return Math.min(truncated, 50);
    };

    // Helper to find or create an exercise
    const getEx = async (name: string, targetMuscle: string) => {
        return await prisma.exercise.upsert({
            where: { name },
            update: {},
            create: { name, targetMuscle }
        });
    }

    const upsertWorkoutDayWithExercises = async (
        targetDate: Date,
        dayName: string,
        exercises: BaseTrainingExercise[]
    ) => {
        const workoutDay = await prisma.workoutDay.upsert({
            where: {
                date_userId: {
                    date: targetDate,
                    userId,
                },
            },
            update: { name: dayName },
            create: {
                userId,
                date: targetDate,
                name: dayName,
            },
        });

        let order = 1;
        for (const exData of exercises) {
            const ex = await getEx(exData.name, exData.muscle);
            const currentOrder = order++;
            const safeSetCount = toSafeSetCount(exData.sets);
            const we = await prisma.workoutExercise.upsert({
                where: {
                    workoutDayId_exerciseId: {
                        workoutDayId: workoutDay.id,
                        exerciseId: ex.id,
                    },
                },
                update: {
                    sets: safeSetCount,
                    reps: exData.reps,
                    order: currentOrder,
                },
                create: {
                    workoutDayId: workoutDay.id,
                    exerciseId: ex.id,
                    sets: safeSetCount,
                    reps: exData.reps,
                    order: currentOrder,
                },
            });

            await prisma.setLog.deleteMany({
                where: {
                    workoutExerciseId: we.id,
                    setNumber: { gt: safeSetCount },
                },
            });

            for (let i = 1; i <= safeSetCount; i++) {
                await prisma.setLog.upsert({
                    where: {
                        workoutExerciseId_setNumber: {
                            workoutExerciseId: we.id,
                            setNumber: i,
                        },
                    },
                    update: { isCompleted: false },
                    create: { workoutExerciseId: we.id, setNumber: i, isCompleted: false },
                });
            }
        }
    };

    const upsertRestDay = async (targetDate: Date) => {
        const restDay = await prisma.workoutDay.upsert({
            where: {
                date_userId: {
                    date: targetDate,
                    userId,
                },
            },
            update: { name: "Rest Day" },
            create: {
                userId,
                date: targetDate,
                name: "Rest Day",
            },
        });

        // Ensure rest days do not keep stale planned exercises from prior seeding attempts.
        await prisma.workoutExercise.deleteMany({
            where: { workoutDayId: restDay.id },
        });
    };

    const toUtcMidnight = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`);
    const toDateKey = (date: Date) =>
        `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

    const getWorkoutNameFromMuscles = (exercises: BaseTrainingExercise[]) => {
        const muscleVolume = new Map<string, number>();
        for (const ex of exercises) {
            const key = ex.muscle.trim();
            muscleVolume.set(key, (muscleVolume.get(key) ?? 0) + ex.sets);
        }
        const topMuscles = Array.from(muscleVolume.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([muscle]) => muscle);
        return topMuscles.length > 0 ? topMuscles.join(" / ") : "Base Training";
    };

    const parseSetsReps = (setsRepsRaw: string) => {
        const [setsRaw, ...repsRawParts] = setsRepsRaw.split("x");
        const parsedSets = Number.parseInt((setsRaw ?? "").trim(), 10);
        const sets = Number.isFinite(parsedSets) && parsedSets > 0 ? parsedSets : 1;
        const repsRaw = repsRawParts.join("x").trim();
        return {
            sets,
            reps: repsRaw.length > 0 ? repsRaw : null,
        };
    };

    const csvPath = path.join(process.cwd(), "base_training", "workouts.csv");
    const csvContent = await readFile(csvPath, "utf-8");
    const parsedRows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as CsvWorkoutRecord[];

    const groupedByDate = new Map<string, BaseTrainingExercise[]>();
    for (const row of parsedRows) {
        const dateKey = row.Date.trim();
        if (!dateKey) continue;

        const exerciseName = row.Exercise.trim();
        const targetMuscle = row["Muscular Group"].trim() || "General";
        const { sets, reps } = parseSetsReps(row["Sets x Reps"] ?? "");

        const existing = groupedByDate.get(dateKey) ?? [];
        const sameExercise = existing.find((ex) => ex.name === exerciseName);

        if (sameExercise) {
            sameExercise.sets += sets;
            if (sameExercise.reps !== reps) {
                sameExercise.reps = sameExercise.reps === null ? reps : reps === null ? sameExercise.reps : "Varied";
            }
        } else {
            existing.push({
                name: exerciseName,
                sets,
                reps,
                muscle: targetMuscle,
            });
        }

        groupedByDate.set(dateKey, existing);
    }

    const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => {
        return toUtcMidnight(a).getTime() - toUtcMidnight(b).getTime();
    });

    if (sortedDates.length === 0) return;

    const minDate = toUtcMidnight(sortedDates[0]!);
    const maxDate = toUtcMidnight(sortedDates[sortedDates.length - 1]!);

    for (
        let cursor = new Date(minDate);
        cursor.getTime() <= maxDate.getTime();
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1))
    ) {
        const dateKey = toDateKey(cursor);
        const dayExercises = groupedByDate.get(dateKey);

        if (!dayExercises || dayExercises.length === 0) {
            await upsertRestDay(new Date(cursor));
            continue;
        }

        const dayName = getWorkoutNameFromMuscles(dayExercises);
        await upsertWorkoutDayWithExercises(new Date(cursor), dayName, dayExercises);
    }
}
