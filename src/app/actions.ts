"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateSetLog(
    setId: string,
    weight: number | null,
    reps: number | null,
    isCompleted: boolean
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Verify the set belongs to the user by traversing the relation
    const targetSet = await prisma.setLog.findUnique({
        where: { id: setId },
        include: { workoutExercise: { include: { workoutDay: true } } }
    });

    if (!targetSet || targetSet.workoutExercise.workoutDay.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    await prisma.setLog.update({
        where: { id: setId },
        data: { weight, reps, isCompleted },
    });
    revalidatePath("/");
}
