"use server";

import { auth } from "@/auth";
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

    revalidatePath("/");
    return { success: true };
}

// Internal reusable function to attach standard Anatoly definitions to a fresh user
async function setupBaseTrainingForUser(userId: string) {
    // Simplified default template for demonstration
    // Real App would pull from a master template table, but we recreate `seed.ts` behavior here

    // Day 1: Push
    const day1 = await prisma.workoutDay.create({
        data: {
            userId,
            date: new Date(), // Starting today
            name: "Chest / Shoulders / Triceps",
        }
    });

    const benchPress = await prisma.exercise.upsert({
        where: { name: "Bench Press" },
        update: {}, create: { name: "Bench Press", targetMuscle: "Chest" }
    });

    const d1_ex1 = await prisma.workoutExercise.create({
        data: {
            workoutDayId: day1.id,
            exerciseId: benchPress.id,
            sets: 3,
            reps: "8-10",
            order: 1
        }
    });

    // Seed the empty sets
    for (let i = 1; i <= 3; i++) {
        await prisma.setLog.create({
            data: { workoutExerciseId: d1_ex1.id, setNumber: i, isCompleted: false, reps: null, weight: null }
        });
    }

    // You can deeply copy the entire seed logic here if desired, abstracting it into a true "Template" cloner.
}
