-- Remove duplicate workout-exercise pairs before adding uniqueness constraint.
WITH ranked AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "workoutDayId", "exerciseId"
            ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
        ) AS row_num
    FROM "WorkoutExercise"
),
duplicates AS (
    SELECT "id" FROM ranked WHERE row_num > 1
)
DELETE FROM "SetLog"
WHERE "workoutExerciseId" IN (SELECT "id" FROM duplicates);

WITH ranked AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "workoutDayId", "exerciseId"
            ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
        ) AS row_num
    FROM "WorkoutExercise"
)
DELETE FROM "WorkoutExercise"
WHERE "id" IN (
    SELECT "id" FROM ranked WHERE row_num > 1
);

-- Enforce one exercise entry per workout day.
CREATE UNIQUE INDEX "WorkoutExercise_workoutDayId_exerciseId_key"
ON "WorkoutExercise"("workoutDayId", "exerciseId");
