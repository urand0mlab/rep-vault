import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const routines = [
    {
        name: 'Chest / Triceps',
        exercises: [
            { name: 'Bench press', targetMuscle: 'Chest', sets: 4, baseWeight: 60, reps: 8 },
            { name: 'Incline dumbbell press', targetMuscle: 'Chest', sets: 3, baseWeight: 20, reps: 10 },
            { name: 'Dips', targetMuscle: 'Triceps', sets: 3, baseWeight: 10, reps: 10 },
            { name: 'Rope triceps pushdowns', targetMuscle: 'Triceps', sets: 3, baseWeight: 15, reps: 12 },
        ]
    },
    {
        name: 'Back / Biceps',
        exercises: [
            { name: 'Pull-ups', targetMuscle: 'Back', sets: 4, baseWeight: 0, reps: 8 },
            { name: 'Bent-over barbell row (overhand grip)', targetMuscle: 'Back', sets: 3, baseWeight: 50, reps: 10 },
            { name: 'Lat Pulldowns', targetMuscle: 'Back', sets: 3, baseWeight: 45, reps: 10 },
            { name: 'Barbell curls', targetMuscle: 'Biceps', sets: 3, baseWeight: 30, reps: 10 },
        ]
    },
    {
        name: 'Legs / Shoulders',
        exercises: [
            { name: 'Low-bar squat', targetMuscle: 'Legs', sets: 4, baseWeight: 80, reps: 6 },
            { name: 'Leg press (Wide stance)', targetMuscle: 'Legs', sets: 3, baseWeight: 150, reps: 10 },
            { name: 'Standing overhead press', targetMuscle: 'Shoulders', sets: 3, baseWeight: 40, reps: 8 },
            { name: 'Seated dumbbell lateral raises', targetMuscle: 'Shoulders', sets: 3, baseWeight: 10, reps: 12 },
        ]
    }
];

async function main() {
    console.log('Generating 1 year of continuous historical workouts (2025-02-28 to 2026-02-27)...');

    // Ensure default user exists
    const defaultUser = await prisma.user.upsert({
        where: { email: 'cristiano.corrado@gmail.com' },
        update: {},
        create: {
            name: 'Cristiano',
            email: 'cristiano.corrado@gmail.com'
        }
    });
    console.log(`Using default user: ${defaultUser.id} (${defaultUser.email})`);

    const startDate = new Date('2025-02-28T00:00:00.000Z');
    const endDate = new Date('2026-02-27T00:00:00.000Z');

    let currentDate = new Date(startDate);
    let routinesCount = 0;

    // Ensure all routines' exercises exist, else create them
    const exerciseMap = new Map<string, string>();

    for (const routine of routines) {
        for (const ex of routine.exercises) {
            const record = await prisma.exercise.upsert({
                where: { name: ex.name },
                update: { targetMuscle: ex.targetMuscle },
                create: { name: ex.name, targetMuscle: ex.targetMuscle }
            });
            exerciseMap.set(ex.name, record.id);
        }
    }

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    while (currentDate <= endDate) {
        // Workout days: Mon, Wed, Fri
        const dayOfWeek = currentDate.getUTCDay();

        if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
            const routine = routines[routinesCount % routines.length];
            routinesCount++;

            const currentDayAbs = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            const progressFactor = currentDayAbs / totalDays; // 0.0 to 1.0

            // Create / upsert the workout day
            const workoutDay = await prisma.workoutDay.upsert({
                where: {
                    date_userId: {
                        date: new Date(currentDate),
                        userId: defaultUser.id,
                    }
                },
                update: { name: routine.name },
                create: {
                    date: new Date(currentDate),
                    name: routine.name,
                    userId: defaultUser.id
                }
            });

            let order = 1;
            for (const ex of routine.exercises) {
                // Linear progression over the year (+40% by the end)
                const simulatedWeight = Math.round(ex.baseWeight * (1 + (progressFactor * 0.4)));

                const workoutExercise = await prisma.workoutExercise.create({
                    data: {
                        workoutDayId: workoutDay.id,
                        exerciseId: exerciseMap.get(ex.name)!,
                        sets: ex.sets,
                        reps: ex.reps.toString(),
                        order: order++
                    }
                });

                for (let i = 1; i <= ex.sets; i++) {
                    const actualReps = Math.max(1, ex.reps + Math.floor(Math.random() * 3) - 1);

                    await prisma.setLog.create({
                        data: {
                            workoutExerciseId: workoutExercise.id,
                            setNumber: i,
                            weight: simulatedWeight,
                            reps: actualReps,
                            isCompleted: true
                        }
                    });
                }
            }
        }

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log(`Successfully generated ${routinesCount} past workout sessions!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
