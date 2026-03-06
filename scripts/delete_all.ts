import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function assertSafeToRun() {
    const confirm = process.env.CONFIRM_DELETE_ALL;
    if (confirm !== 'YES_DELETE_ALL_DATA') {
        throw new Error(
            'Refusing to wipe database. Set CONFIRM_DELETE_ALL=YES_DELETE_ALL_DATA to run this script intentionally.'
        );
    }
}

async function main() {
    assertSafeToRun();
    console.log('Initiating complete database wipe...');

    // Delete everything in reverse dependency order
    const deletedLogs = await prisma.setLog.deleteMany();
    console.log(`Deleted ${deletedLogs.count} set logs.`);

    const deletedWorkoutExercises = await prisma.workoutExercise.deleteMany();
    console.log(`Deleted ${deletedWorkoutExercises.count} workout exercises.`);

    const deletedWorkoutDays = await prisma.workoutDay.deleteMany();
    console.log(`Deleted ${deletedWorkoutDays.count} workout days.`);

    const deletedExercises = await prisma.exercise.deleteMany();
    console.log(`Deleted ${deletedExercises.count} exercises.`);

    console.log('Database successfully wiped.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
