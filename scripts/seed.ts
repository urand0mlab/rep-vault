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
        // Parse the date accurately (assuming YYYY-MM-DD from CSV)
        // Make sure we store it at normalized 00:00:00 UTC so querying by date is easy.
        const dateObj = new Date(`${date}T00:00:00.000Z`);

        // Let's deduce an overarching name for the day based on muscles
        const muscles = Array.from(new Set(exercises.map(e => e.TargetMuscle).filter(Boolean)));
        const dayName = muscles.join(' / ');

        const workoutDay = await prisma.workoutDay.upsert({
            where: { date: dateObj },
            update: {},
            create: {
                date: dateObj,
                name: dayName
            }
        });

        let order = 0;
        for (const ex of exercises) {
            order++;

            const exerciseName = ex.Exercise.trim();
            const targetMuscle = ex.TargetMuscle;

            const exerciseRecord = await prisma.exercise.upsert({
                where: { name: exerciseName },
                update: {},
                create: {
                    name: exerciseName,
                    targetMuscle: targetMuscle,
                }
            });

            // Parse Sets x Reps. Examples: "4x6", "3x", "1xMax", "3x8"
            const parts = ex.SetsReps.toLowerCase().split('x');
            const setsStr = parts[0]?.trim();
            const repsStr = parts.length > 1 ? parts[1]?.trim() : null;

            const sets = parseInt(setsStr) || 1;
            let finalReps = repsStr === "" ? null : repsStr;

            const workoutExercise = await prisma.workoutExercise.create({
                data: {
                    workoutDayId: workoutDay.id,
                    exerciseId: exerciseRecord.id,
                    sets: sets,
                    reps: finalReps,
                    order: order
                }
            });

            // Pre-populate empty set logs
            for (let i = 1; i <= sets; i++) {
                await prisma.setLog.create({
                    data: {
                        workoutExerciseId: workoutExercise.id,
                        setNumber: i,
                        reps: null,
                        weight: null,
                        isCompleted: false
                    }
                });
            }
        }
        console.log(`Seeded ${date} with ${exercises.length} exercises.`);
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
