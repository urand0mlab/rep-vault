import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_URL = process.env.ANATOLY_API_URL ?? 'https://api.anatolyfit.com/graphql';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${requireEnv('ANATOLY_BEARER_TOKEN')}`,
        'Content-Type': 'application/json',
        'User-Agent': process.env.ANATOLY_USER_AGENT ?? 'RepVaultImporter/1.0',
    };

    const cookie = process.env.ANATOLY_COOKIE;
    if (cookie) {
        headers.Cookie = cookie;
    }

    return headers;
}

type CalendarWorkoutDay = {
    date: string;
    workoutDayId: string;
    hasWorkout: boolean;
    workoutName: string;
    exerciseCount: number;
};

async function fetchGraphQL(operationName: string, query: string, variables = {}) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ operationName, variables, query })
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    if (json.errors) {
        console.error("GraphQL Errors:", json.errors);
        throw new Error("GraphQL Error");
    }
    return json.data;
}

// 1. Get Workout Calendar
async function getWorkoutCalendar(daysBefore: number, daysAfter: number) {
    const query = `
    query GetWorkoutCalendar($data: WorkoutCalendarInput!) {
      getWorkoutCalendar(data: $data) {
        date
        workoutDayId
        hasWorkout
        workoutName
        exerciseCount
      }
    }`;

    // Anatoly API ignores startDate if it's too far in the past.
    // Instead, we use today's date and calculate 'daysBefore' to go back in time.
    const todayStr = new Date().toISOString().split('T')[0];

    const variables = {
        data: {
            startDate: todayStr,
            daysBefore,
            daysAfter
        }
    };

    const data = await fetchGraphQL('GetWorkoutCalendar', query, variables);
    return data.getWorkoutCalendar as CalendarWorkoutDay[];
}

// 2. Get specific Workout Day details
async function getWorkoutDayById(id: string) {
    const query = `
    query GetWorkoutDayById($id: String!) {
      getWorkoutDayById(id: $id) {
        id
        title
        workoutPlanExercises {
          id
          exercise {
            name
            targets
          }
          sets {
            setNumber
            reps
            weight
          }
        }
      }
    }`;

    const data = await fetchGraphQL('GetWorkoutDayById', query, { id });
    return data.getWorkoutDayById;
}

async function main() {
    console.log('Fetching true logged history from Jan 1st 2026 to present...');

    const importUserEmail = requireEnv('ANATOLY_IMPORT_USER_EMAIL');
    const importUserName = process.env.ANATOLY_IMPORT_USER_NAME ?? importUserEmail.split('@')[0] ?? 'Imported User';

    // Ensure default user exists
    const defaultUser = await prisma.user.upsert({
        where: { email: importUserEmail },
        update: {},
        create: {
            name: importUserName,
            email: importUserEmail
        }
    });
    console.log(`Using default user: ${defaultUser.id} (${defaultUser.email})`);

    // Calculate days between Jan 1 2026 and Today
    const startDateStr = "2026-01-01";
    const startDate = new Date(startDateStr);
    const today = new Date();
    // Use an approximate difference + 1
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const daysBefore = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 5;

    const calendar = await getWorkoutCalendar(daysBefore, 14);

    // Filter active workouts spanning the actual dates
    const workoutDays = calendar.filter((day) => {
        // Only include if it has exercises and isn't a rest day
        return day.hasWorkout && day.exerciseCount > 0 && !day.workoutName.trim().toLowerCase().includes('rest day');
    });

    console.log(`Found ${workoutDays.length} true historic workout days to process.`);

    for (const day of workoutDays) {
        console.log(`Processing: ${day.date} - ${day.workoutName}`);

        const dayDetails = await getWorkoutDayById(day.workoutDayId);

        if (!dayDetails || !dayDetails.workoutPlanExercises) continue;

        // Upsert WorkoutDay into the local DB
        const dateObj = new Date(`${day.date}T00:00:00.000Z`);
        const workoutDay = await prisma.workoutDay.upsert({
            where: {
                date_userId: {
                    date: dateObj,
                    userId: defaultUser.id
                }
            },
            update: { name: day.workoutName },
            create: {
                date: dateObj,
                name: day.workoutName,
                userId: defaultUser.id
            }
        });

        let order = 0;
        for (const planExercise of dayDetails.workoutPlanExercises) {
            order++;
            const exerciseName = planExercise.exercise?.name || 'Unknown Exercise';
            const targetMuscle = planExercise.exercise?.targets?.[0] || 'General';

            const exercise = await prisma.exercise.upsert({
                where: { name: exerciseName },
                update: { targetMuscle },
                create: { name: exerciseName, targetMuscle }
            });

            // Count the sets for the "planned" definition
            const numSets = planExercise.sets.length;
            const repsStr = planExercise.sets.length > 0 ? planExercise.sets[0].reps : '0';

            const workoutExercise = await prisma.workoutExercise.upsert({
                where: {
                    workoutDayId_exerciseId: {
                        workoutDayId: workoutDay.id,
                        exerciseId: exercise.id,
                    },
                },
                update: { sets: numSets, reps: repsStr, order: order },
                create: {
                    workoutDayId: workoutDay.id,
                    exerciseId: exercise.id,
                    sets: numSets,
                    reps: repsStr,
                    order: order,
                },
            });

            // Now, we iterate over the actual sets and create setLogs if they were logged
            for (const set of planExercise.sets) {
                // Determine if it was logged: "weight" is not an empty string
                const isLogged = set.weight !== undefined && set.weight !== null && set.weight.trim() !== "";
                const parsedWeight = isLogged ? parseFloat(set.weight) : null;
                const parsedReps = set.reps ? parseInt(set.reps, 10) : 0;

                // Check if this setLog already exists
                const existingLog = await prisma.setLog.findFirst({
                    where: {
                        workoutExerciseId: workoutExercise.id,
                        setNumber: set.setNumber
                    }
                });

                if (existingLog) {
                    await prisma.setLog.update({
                        where: { id: existingLog.id },
                        data: {
                            weight: parsedWeight,
                            reps: parsedReps,
                            isCompleted: isLogged
                        }
                    });
                } else {
                    await prisma.setLog.create({
                        data: {
                            workoutExerciseId: workoutExercise.id,
                            setNumber: set.setNumber,
                            weight: parsedWeight,
                            reps: parsedReps,
                            isCompleted: isLogged
                        }
                    });
                }
            }
        }
    }

    console.log('Successfully imported API data into output database.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
