"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSetLog(
    setId: string,
    weight: number | null,
    reps: number | null,
    isCompleted: boolean
) {
    await prisma.setLog.update({
        where: { id: setId },
        data: { weight, reps, isCompleted },
    });
    revalidatePath("/");
}
