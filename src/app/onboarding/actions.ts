"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    // We assume `seed.ts` has already populated the global `Exercise` dictionary.

    // Helper to find or create an exercise
    const getEx = async (name: string, targetMuscle: string) => {
        return await prisma.exercise.upsert({
            where: { name },
            update: {},
            create: { name, targetMuscle }
        });
    }

    const today = new Date();
    // Dashboard queries strictly by UTC midnight
    const getNormalizedDate = (daysOffset: number = 0) => {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() + daysOffset);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    };

    const upsertWorkoutDayWithExercises = async (
        dayOffset: number,
        dayName: string,
        exercises: Array<{ name: string; sets: number; reps: string; muscle: string }>
    ) => {
        const workoutDay = await prisma.workoutDay.upsert({
            where: {
                date_userId: {
                    date: getNormalizedDate(dayOffset),
                    userId,
                },
            },
            update: { name: dayName },
            create: {
                userId,
                date: getNormalizedDate(dayOffset),
                name: dayName,
            },
        });

        let order = 1;
        for (const exData of exercises) {
            const ex = await getEx(exData.name, exData.muscle);
            const currentOrder = order++;
            const we = await prisma.workoutExercise.upsert({
                where: {
                    workoutDayId_exerciseId: {
                        workoutDayId: workoutDay.id,
                        exerciseId: ex.id,
                    },
                },
                update: {
                    sets: exData.sets,
                    reps: exData.reps,
                    order: currentOrder,
                },
                create: {
                    workoutDayId: workoutDay.id,
                    exerciseId: ex.id,
                    sets: exData.sets,
                    reps: exData.reps,
                    order: currentOrder,
                },
            });

            for (let i = 1; i <= exData.sets; i++) {
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

    // --- DAY 1: Push ---
    const d1Exercises = [
        { name: "Bench press", sets: 3, reps: "8-10", muscle: "Chest" },
        { name: "Incline dumbbell bench press", sets: 3, reps: "10-12", muscle: "Chest" },
        { name: "Seated dumbbell shoulder press", sets: 3, reps: "10-12", muscle: "Shoulders" },
        { name: "Dumbbell lateral raise", sets: 4, reps: "12-15", muscle: "Shoulders" },
        { name: "Triceps pushdown", sets: 3, reps: "10-12", muscle: "Triceps" },
        { name: "Overhead triceps extension", sets: 3, reps: "10-12", muscle: "Triceps" }
    ];
    await upsertWorkoutDayWithExercises(0, "Chest / Shoulders / Triceps", d1Exercises);

    // --- DAY 2: Pull ---
    const d2Exercises = [
        { name: "Pull-ups", sets: 3, reps: "Max", muscle: "Back" },
        { name: "Barbell bent-over row", sets: 3, reps: "8-10", muscle: "Back" },
        { name: "Lat pulldown", sets: 3, reps: "10-12", muscle: "Back" },
        { name: "Face pulls", sets: 3, reps: "12-15", muscle: "Shoulders" },
        { name: "Barbell bench press", sets: 3, reps: "10-12", muscle: "Biceps" }, // Using valid names where possible, user can edit
        { name: "Hammer Curls", sets: 3, reps: "10-12", muscle: "Biceps" }
    ];
    await upsertWorkoutDayWithExercises(2, "Back / Biceps", d2Exercises);

    // --- DAY 3: Legs ---
    const d3Exercises = [
        { name: "Squats", sets: 3, reps: "8-10", muscle: "Legs" },
        { name: "Leg press", sets: 3, reps: "10-12", muscle: "Legs" },
        { name: "Leg extensions", sets: 3, reps: "12-15", muscle: "Legs" },
        { name: "Leg curls", sets: 3, reps: "12-15", muscle: "Legs" },
        { name: "Calf raises", sets: 4, reps: "15-20", muscle: "Legs" }
    ];
    await upsertWorkoutDayWithExercises(4, "Legs", d3Exercises);
}
