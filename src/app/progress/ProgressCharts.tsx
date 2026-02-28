"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartData = {
    id: string;
    name: string;
    targetMuscle: string | null;
    data: { date: string; maxWeight: number; totalVolume: number }[];
};

export function ProgressCharts({ initialData }: { initialData: ChartData[] }) {
    const targetMuscles = Array.from(new Set(initialData.map(e => e.targetMuscle || 'General'))).sort();

    // We need selectedMuscle state
    const [selectedMuscle, setSelectedMuscle] = useState<string>(targetMuscles[0] || 'General');

    // Filter exercises by the selected muscle group
    const filteredExercises = initialData.filter(ex => (ex.targetMuscle || 'General') === selectedMuscle);

    // Ensure selectedExId is valid for the current muscle group
    const [selectedExId, setSelectedExId] = useState<string>(filteredExercises[0]?.id || "");
    const [metric, setMetric] = useState<"maxWeight" | "totalVolume">("maxWeight");

    // When muscle group changes, reset the selected exercise
    function handleMuscleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newMuscle = e.target.value;
        setSelectedMuscle(newMuscle);
        const newFiltered = initialData.filter(ex => (ex.targetMuscle || 'General') === newMuscle);
        if (newFiltered.length > 0) {
            setSelectedExId(newFiltered[0]!.id);
        } else {
            setSelectedExId("");
        }
    }

    const selectedExercise = initialData.find(ex => ex.id === selectedExId);
    const chartData = selectedExercise?.data || [];

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col space-y-3 rounded-xl border bg-card p-4 shadow-sm">

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold uppercase text-muted-foreground mr-2 border-b-0">Muscle Group</label>
                        <select
                            className="w-full mt-1.5 rounded-md border bg-background p-2 text-sm"
                            value={selectedMuscle}
                            onChange={handleMuscleChange}
                        >
                            {targetMuscles.map(muscle => (
                                <option key={muscle} value={muscle}>{muscle}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase text-muted-foreground mr-2 border-b-0">Exercise</label>
                        <select
                            className="w-full mt-1.5 rounded-md border bg-background p-2 text-sm"
                            value={selectedExId}
                            onChange={(e) => setSelectedExId(e.target.value)}
                            disabled={filteredExercises.length === 0}
                        >
                            {filteredExercises.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 text-sm pt-2">
                    <button
                        onClick={() => setMetric("maxWeight")}
                        className={`flex-1 rounded-md p-2 transition-colors ${metric === "maxWeight" ? "bg-primary text-primary-foreground font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                        Max Weight
                    </button>
                    <button
                        onClick={() => setMetric("totalVolume")}
                        className={`flex-1 rounded-md p-2 transition-colors ${metric === "totalVolume" ? "bg-primary text-primary-foreground font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                        Volume (Reps x Wt)
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="mb-4 font-semibold">{selectedExercise?.name} - {metric === "maxWeight" ? "Max Weight (kg)" : "Total Volume"}</h3>

                {chartData.length < 2 ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20">
                        <p className="text-sm text-muted-foreground">Not enough data to plot a trend.</p>
                    </div>
                ) : (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    tick={{ fontSize: 12 }}
                                    stroke="hsl(var(--muted-foreground))"
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    stroke="hsl(var(--muted-foreground))"
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                                    labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={metric}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorMetric)"
                                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
