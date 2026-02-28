const API_URL = 'https://api.anatolyfit.com/graphql';

// Using the same hardcoded tokens from the original extraction script
const HEADERS = {
  'Host': 'api.anatolyfit.com',
  'Authorization': 'Bearer ZXYUJWTWqwqpsILbPpSGwL-2FRCMMbgz',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Content-Type': 'application/json'
};

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
    method: 'POST', headers: HEADERS as Record<string, string>,
    body: JSON.stringify({ operationName: 'GetWorkoutCalendar', variables: { data: { startDate: new Date().toISOString().split('T')[0], daysBefore: 30, daysAfter: 0 } }, query: calQuery })
  });

  if (!calRes.ok) throw new Error("cal failed " + calRes.status);

  const calJson = await calRes.json();
  const days = calJson.data.getWorkoutCalendar.filter((d: any) => d.hasWorkout);

  if (days.length > 0) {
    const id = days[0].workoutDayId;
    const detailRes = await fetch(API_URL, {
      method: 'POST', headers: HEADERS as Record<string, string>,
      body: JSON.stringify({ operationName: 'GetWorkoutDayById', variables: { id }, query })
    });
    const detailJson = await detailRes.json();
    console.dir(detailJson.data.getWorkoutDayById.workoutPlanExercises[0].sets, { depth: null });
  } else {
    console.log("no workout days found in the last 30 days");
  }
}
main();
