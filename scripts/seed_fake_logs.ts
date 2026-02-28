import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Generating fake historical set logs...');

    // Get all exercises that have workout exercises
    const exercises = await prisma.exercise.findMany({
        include: {
            workoutExercises: {
                include: {
                    workoutDay: true,
                    setLogs: true,
                },
                orderBy: {
                    workoutDay: {
                        date: 'asc'
                    }
                }
            }
        }
    });

    let totalUpdated = 0;

    for (const ex of exercises) {
        // We want to simulate progressive overload.
        // Start with a base weight between 10kg and 50kg for this exercise.
        let currentWeight = Math.floor(Math.random() * 40) + 10;

        // We will progressively increase the weight by 2.5kg every few sessions
        let sessionCount = 0;

        for (const we of ex.workoutExercises) {
            sessionCount++;

            // Every 3 sessions, maybe increase weight by 2.5kg
            if (sessionCount % 3 === 0 && Math.random() > 0.5) {
                currentWeight += 2.5;
            }

            for (const log of we.setLogs) {
                // Random reps between 8 and 12, fading a bit on later sets
                const reps = Math.floor(Math.random() * 4) + 8 - Math.floor(log.setNumber * 0.5);

                await prisma.setLog.update({
                    where: { id: log.id },
                    data: {
                        isCompleted: true,
                        weight: currentWeight,
                        reps: Math.max(1, reps),
                    }
                });
                totalUpdated++;
            }
        }
        console.log(`Faked ${sessionCount} sessions for ${ex.name}`);
    }

    console.log(`Successfully generated fake logs for ${totalUpdated} sets!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
