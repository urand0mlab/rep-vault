import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ProgressCharts } from "./ProgressCharts";

export default async function ProgressPage() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    // Fetch all exercises that have at least one completed set log
    const exercisesWithData = await prisma.exercise.findMany({
        where: {
            workoutExercises: {
                some: {
                    workoutDay: {
                        userId: session.user.id,
                    },
                    setLogs: {
                        some: {
                            isCompleted: true,
                            weight: { not: null },
                            reps: { not: null }
                        }
                    }
                }
            }
        },
        include: {
            workoutExercises: {
                where: {
                    workoutDay: {
                        userId: session.user.id,
                    },
                },
                include: {
                    workoutDay: true,
                    setLogs: {
                        where: { isCompleted: true }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Transform data into a flat format for charts
    // { [exerciseId]: { id, name, data: [{ date, maxWeight, totalVolume }] } }
    const chartData = exercisesWithData.map(ex => {

        // Group by date
        const dateMap = new Map<string, { maxWeight: number, totalVolume: number }>();

        ex.workoutExercises.forEach(we => {
            const dateStr = new Date(we.workoutDay.date).toISOString().split('T')[0]!;
            let dayMaxWeight = 0;
            let dayVolume = 0;

            we.setLogs.forEach(log => {
                if (log.weight && log.reps) {
                    dayMaxWeight = Math.max(dayMaxWeight, log.weight);
                    dayVolume += (log.weight * log.reps);
                }
            });

            if (dayVolume > 0) {
                if (!dateMap.has(dateStr)) {
                    dateMap.set(dateStr, { maxWeight: dayMaxWeight, totalVolume: dayVolume });
                } else {
                    const current = dateMap.get(dateStr)!;
                    current.maxWeight = Math.max(current.maxWeight, dayMaxWeight);
                    current.totalVolume += dayVolume;
                }
            }
        });

        const dataPoints = Array.from(dateMap.entries())
            .map(([date, metrics]) => ({ date, ...metrics }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            id: ex.id,
            name: ex.name,
            targetMuscle: ex.targetMuscle,
            data: dataPoints
        };
    });

    return (
        <div className="flex flex-col gap-6 pb-12">
            <header>
                <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
                <p className="text-muted-foreground mt-1">Track your performance over time.</p>
            </header>

            {chartData.length === 0 ? (
                <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Complete some workouts to see charts here.</p>
                </div>
            ) : (
                <ProgressCharts initialData={chartData} />
            )}
        </div>
    );
}
