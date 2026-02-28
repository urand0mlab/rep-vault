import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function HistoryPage() {
    // Fetch all historic workouts that have at least one completed set
    // Order by date descending
    const pastWorkouts = await prisma.workoutDay.findMany({
        where: {
            exercises: {
                some: {
                    setLogs: {
                        some: {
                            isCompleted: true
                        }
                    }
                }
            }
        },
        orderBy: { date: 'desc' },
        include: {
            exercises: {
                include: {
                    setLogs: {
                        where: { isCompleted: true }
                    }
                }
            }
        }
    });

    return (
        <div className="flex flex-col gap-6 pb-12">
            <header>
                <h1 className="text-3xl font-extrabold tracking-tight">History</h1>
                <p className="text-muted-foreground mt-1">Your past workouts.</p>
            </header>

            {pastWorkouts.length === 0 ? (
                <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No completed workouts yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {pastWorkouts.map((workout) => {
                        // Calculate a quick summary: total volume or just number of exercises
                        let totalVolume = 0;
                        let totalSets = 0;
                        workout.exercises.forEach(we => {
                            we.setLogs.forEach(set => {
                                totalSets++;
                                if (set.reps && set.weight) {
                                    totalVolume += (set.reps * set.weight);
                                }
                            });
                        });

                        return (
                            <div
                                key={workout.id}
                                className="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm"
                            >
                                <div>
                                    <h3 className="font-semibold text-lg">{workout.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1.5 flex gap-3">
                                        <span className="bg-muted px-2 py-0.5 rounded-full">{workout.exercises.length} Exercises</span>
                                        <span className="bg-muted px-2 py-0.5 rounded-full">{totalSets} Sets</span>
                                        {totalVolume > 0 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{totalVolume.toLocaleString()} kg Vol</span>}
                                    </p>
                                </div>
                                {/* 
                  Since we don't have a detailed view route built yet, 
                  we'll just show an arrow indicating it's a finished card 
                */}
                                <div className="text-muted-foreground opacity-50 pl-2 border-l ml-2 h-full flex items-center">
                                    <CheckCircleIcon />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CheckCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle text-primary">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}
