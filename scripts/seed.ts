import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    const csvFilePath = 'base_training/workouts.csv';
    if (!fs.existsSync(csvFilePath)) {
        console.error(`CSV file not found at ${csvFilePath}`);
        return;
    }

    // Step 0: User Creation is now handled by NextAuth and Onboarding Flow!
    // We no longer pre-seed a user, as it breaks WebAuthn Passkey registration flows.
    // This script will now only serve to seed master tables, or act as a library for actions.ts.
    console.log(`Skipping hardcoded user creation to protect WebAuthn flows.`);

    const parser = fs.createReadStream(csvFilePath).pipe(parse({
        columns: true,
        skip_empty_lines: true
    }));

    // date -> array of rows
    const workoutsByDate: Record<string, any[]> = {};

    for await (const record of parser) {
        const { Date, Exercise, 'Sets x Reps': SetsReps, 'Muscular Group': TargetMuscle } = record;
        if (!workoutsByDate[Date]) {
            workoutsByDate[Date] = [];
        }
        workoutsByDate[Date].push({ Exercise, SetsReps, TargetMuscle });
    }

    console.log(`Found ${Object.keys(workoutsByDate).length} unique workout days.`);

    for (const [date, exercises] of Object.entries(workoutsByDate)) {
        for (const ex of exercises) {
            const exerciseName = ex.Exercise.trim();
            const targetMuscle = ex.TargetMuscle;

            await prisma.exercise.upsert({
                where: { name: exerciseName },
                update: {},
                create: {
                    name: exerciseName,
                    targetMuscle: targetMuscle,
                }
            });
        }
        console.log(`Seeded global exercises from ${date}.`);
    }

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
