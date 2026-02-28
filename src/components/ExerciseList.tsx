"use client";

import { useState } from "react";
import { updateSetLog } from "@/app/actions";
import { Check, Dumbbell, Minus, Plus } from "lucide-react";

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
                    <SetRow key={setLog.id} setLog={setLog} targetReps={data.reps} />
                ))}
            </div>
        </div>
    );
}

function SetRow({ setLog, targetReps }: { setLog: SetLog; targetReps: string | null }) {
    const [weight, setWeight] = useState(setLog.weight || 0);
    const [reps, setReps] = useState(setLog.reps !== null ? setLog.reps : (Number(targetReps) || 0));
    const [isCompleted, setIsCompleted] = useState(setLog.isCompleted);
    const [isPending, setIsPending] = useState(false);

    async function handleToggle() {
        setIsPending(true);
        const completed = !isCompleted;
        await updateSetLog(setLog.id, weight, reps, completed);
        setIsCompleted(completed);
        setIsPending(false);
    }

    const adjustWeight = (amount: number) => setWeight((prev) => Math.max(0, Number((prev + amount).toFixed(2))));
    const adjustReps = (amount: number) => setReps((prev) => Math.max(0, prev + amount));

    return (
        <div className={`flex items-center justify-between rounded-xl border p-1.5 sm:p-2 pl-2 sm:pl-3 w-full transition-colors ${isCompleted ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-muted/10'}`}>
            <span className="font-bold text-muted-foreground mr-1 sm:mr-2 w-4 text-center text-sm sm:text-base flex-shrink-0">{setLog.setNumber}</span>

            <div className="flex flex-1 justify-center gap-1 sm:gap-3 min-w-0">
                {/* Weight Stepper */}
                <div className={`flex items-center rounded-lg border shadow-sm h-11 sm:h-12 flex-1 max-w-[120px] transition-opacity ${isCompleted ? 'opacity-70 grayscale pointer-events-none' : 'bg-background'}`}>
                    <button onClick={() => adjustWeight(-2.5)} disabled={isCompleted || isPending} className="flex items-center justify-center bg-muted/30 hover:bg-muted w-8 sm:w-10 h-full transition-colors active:bg-muted/80 flex-shrink-0 rounded-l-lg">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </button>
                    <div className="flex flex-col items-center justify-center flex-1 border-x border-border/40 h-full overflow-hidden relative pb-1">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={weight || ''}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            className="w-full text-center text-base sm:text-lg font-bold bg-transparent outline-none focus:ring-0 leading-none p-0 m-0 mt-2 [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ WebkitAppearance: 'none', appearance: 'none' }}
                            disabled={isCompleted || isPending}
                        />
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-semibold tracking-wider leading-none mt-0.5">kg</span>
                    </div>
                    <button onClick={() => adjustWeight(2.5)} disabled={isCompleted || isPending} className="flex items-center justify-center bg-muted/30 hover:bg-muted w-8 sm:w-10 h-full transition-colors active:bg-muted/80 flex-shrink-0 rounded-r-lg">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Reps Stepper */}
                <div className={`flex items-center rounded-lg border shadow-sm h-11 sm:h-12 flex-1 max-w-[120px] transition-opacity ${isCompleted ? 'opacity-70 grayscale pointer-events-none' : 'bg-background'}`}>
                    <button onClick={() => adjustReps(-1)} disabled={isCompleted || isPending} className="flex items-center justify-center bg-muted/30 hover:bg-muted w-8 sm:w-10 h-full transition-colors active:bg-muted/80 flex-shrink-0 rounded-l-lg">
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </button>
                    <div className="flex flex-col items-center justify-center flex-1 border-x border-border/40 h-full overflow-hidden relative pb-1">
                        <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={reps || ''}
                            onChange={(e) => setReps(Number(e.target.value))}
                            className="w-full text-center text-base sm:text-lg font-bold bg-transparent outline-none focus:ring-0 leading-none p-0 m-0 mt-2 [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ WebkitAppearance: 'none', appearance: 'none' }}
                            disabled={isCompleted || isPending}
                        />
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-semibold tracking-wider leading-none mt-0.5">reps</span>
                    </div>
                    <button onClick={() => adjustReps(1)} disabled={isCompleted || isPending} className="flex items-center justify-center bg-muted/30 hover:bg-muted w-8 sm:w-10 h-full transition-colors active:bg-muted/80 flex-shrink-0 rounded-r-lg">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`flex flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-all active:scale-95 ml-1.5 ${isCompleted ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90' : 'border-2 border-dashed border-muted-foreground/30 bg-background hover:bg-muted'}`}
            >
                {isCompleted ? <Check className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" /> : <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-muted-foreground/40"></div>}
            </button>
        </div>
    );
}
