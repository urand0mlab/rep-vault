"use client";

import { useState } from "react";
import { updateSetLog } from "@/app/actions";
import { Check, Dumbbell } from "lucide-react";

type SetLog = { id: string; setNumber: number; reps: number | null; weight: number | null; isCompleted: boolean };
type ExerciseProps = {
    id: string;
    sets: number;
    reps: string | null;
    exercise: { name: string; targetMuscle: string | null };
    setLogs: SetLog[];
};

export function ExerciseList({ exercises }: { exercises: ExerciseProps[] }) {
    return (
        <>
            {exercises.map((ex) => (
                <ExerciseCard key={ex.id} data={ex} />
            ))}
        </>
    );
}

function ExerciseCard({ data }: { data: ExerciseProps }) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 pb-3">
                <h3 className="font-semibold leading-none tracking-tight text-lg">{data.exercise.name}</h3>
                <p className="text-sm text-muted-foreground flex justify-between">
                    <span>{data.exercise.targetMuscle || 'General'}</span>
                    <span>Target: {data.sets}x{data.reps || 'Max'}</span>
                </p>
            </div>
            <div className="p-5 pt-0 grid gap-3">
                {data.setLogs.map((setLog) => (
                    <SetRow key={setLog.id} setLog={setLog} />
                ))}
            </div>
        </div>
    );
}

function SetRow({ setLog }: { setLog: SetLog }) {
    const [weight, setWeight] = useState(setLog.weight || 0);
    const [reps, setReps] = useState(setLog.reps || 0);
    const [isCompleted, setIsCompleted] = useState(setLog.isCompleted);
    const [isPending, setIsPending] = useState(false);

    async function handleToggle() {
        setIsPending(true);
        const completed = !isCompleted;
        await updateSetLog(setLog.id, weight, reps, completed);
        setIsCompleted(completed);
        setIsPending(false);
    }

    return (
        <div className={`flex items-center justify-between rounded-lg border p-3 pl-4 transition-colors ${isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
            <span className="w-6 font-bold text-muted-foreground">{setLog.setNumber}</span>

            <div className="flex gap-2">
                <div className="flex items-center rounded-md border bg-background px-2">
                    {/* We would typically use Shadcn UI Input here, but for simplicity of a quick responsive form, customized native inputs are best for mobile numbers */}
                    <input
                        type="number"
                        pattern="\\d*"
                        value={weight || ''}
                        onChange={e => setWeight(Number(e.target.value))}
                        placeholder="kg"
                        className="w-12 bg-transparent text-center text-sm outline-none"
                        disabled={isCompleted || isPending}
                    />
                    <span className="text-xs text-muted-foreground">kg</span>
                </div>

                <div className="flex items-center rounded-md border bg-background px-2">
                    <input
                        type="number"
                        pattern="\\d*"
                        value={reps || ''}
                        onChange={e => setReps(Number(e.target.value))}
                        placeholder="reps"
                        className="w-10 bg-transparent text-center text-sm outline-none"
                        disabled={isCompleted || isPending}
                    />
                    <span className="text-xs text-muted-foreground text-center pl-1">r</span>
                </div>
            </div>

            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 ${isCompleted ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' : 'border border-dashed bg-background hover:bg-muted'}`}
            >
                {isCompleted ? <Check className="h-5 w-5" /> : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></span>}
            </button>
        </div>
    );
}
