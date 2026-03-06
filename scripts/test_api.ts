const API_URL = process.env.ANATOLY_API_URL ?? 'https://api.anatolyfit.com/graphql';
type CalendarResponse = {
  data: {
    getWorkoutCalendar: Array<{
      workoutDayId: string;
      hasWorkout: boolean;
    }>;
  };
};

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
    'User-Agent': process.env.ANATOLY_USER_AGENT ?? 'RepVaultImporter/1.0'
  };

  const cookie = process.env.ANATOLY_COOKIE;
  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

async function main() {
  const query = `
    query GetWorkoutDayById($id: String!) {
      getWorkoutDayById(id: $id) {
        id
        title
        workoutPlanExercises {
          id
          exercise { name }
          sets { setNumber reps weight }
        }
      }
    }`;

  // Hardcode an ID from a known day (e.g., today or yesterday)
  // We'll just fetch the calendar first to get an ID
  const calQuery = `query GetWorkoutCalendar($data: WorkoutCalendarInput!) { getWorkoutCalendar(data: $data) { workoutDayId hasWorkout } }`;
  const calRes = await fetch(API_URL, {
    method: 'POST', headers: getHeaders(),
    body: JSON.stringify({ operationName: 'GetWorkoutCalendar', variables: { data: { startDate: new Date().toISOString().split('T')[0], daysBefore: 30, daysAfter: 0 } }, query: calQuery })
  });

  if (!calRes.ok) throw new Error("cal failed " + calRes.status);

  const calJson = await calRes.json() as CalendarResponse;
  const days = calJson.data.getWorkoutCalendar.filter((d) => d.hasWorkout);

  if (days.length > 0) {
    const id = days[0].workoutDayId;
    const detailRes = await fetch(API_URL, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ operationName: 'GetWorkoutDayById', variables: { id }, query })
    });
    const detailJson = await detailRes.json();
    console.dir(detailJson.data.getWorkoutDayById.workoutPlanExercises[0].sets, { depth: null });
  } else {
    console.log("no workout days found in the last 30 days");
  }
}
main();
