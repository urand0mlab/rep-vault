"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./actions";
import { Dumbbell, Ruler, Activity, ArrowRight, CheckCircle2, Loader2, Info } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [training, setTraining] = useState<"base" | null>(null);

    // Physical Attrs
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [chest, setChest] = useState("");
    const [leg, setLeg] = useState("");
    const [arm, setArm] = useState("");

    // Lifestyle
    const [lifestyle, setLifestyle] = useState<string>("");

    // BMI Calculation
    const hNum = parseFloat(height);
    const wNum = parseFloat(weight);
    const bmi = (hNum > 0 && wNum > 0) ? (wNum / Math.pow(hNum / 100, 2)).toFixed(1) : null;

    const handleNext = () => setStep(s => Math.min(s + 1, 3));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            if (training) formData.append("trainingSelection", training);
            if (height) formData.append("height", height);
            if (weight) formData.append("weight", weight);
            if (chest) formData.append("chest", chest);
            if (leg) formData.append("leg", leg);
            if (arm) formData.append("arm", arm);
            if (lifestyle) formData.append("lifestyle", lifestyle);

            await completeOnboarding(formData);
            router.push("/");
            router.refresh();
        } catch (e) {
            console.error("Failed to complete onboarding", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
            <div className="w-full max-w-md space-y-8">

                {/* Progress Timeline */}
                <div className="flex justify-between items-center px-6 mb-8 relative">
                    <div className="absolute left-10 right-10 top-1/2 h-0.5 -translate-y-1/2 bg-slate-800 -z-10"></div>
                    <div className="absolute left-10 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-500 -z-10 transition-all duration-500" style={{ width: `${(step - 1) * 40}%` }}></div>

                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= num ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                            {step > num ? <CheckCircle2 className="h-5 w-5" /> : num}
                        </div>
                    ))}
                </div>

                {/* Step 1: Training Selection */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight">Choose Your Path</h1>
                            <p className="mt-2 text-sm text-slate-400">Select your starting workout framework.</p>
                        </div>

                        <div className="grid gap-4">
                            <button
                                onClick={() => setTraining("base")}
                                className={`flex flex-col text-left p-6 rounded-xl border-2 transition-all ${training === "base" ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}
                            >
                                <Dumbbell className={`h-8 w-8 mb-4 ${training === "base" ? "text-emerald-500" : "text-slate-500"}`} />
                                <h3 className="text-lg font-bold">Base Training</h3>
                                <p className="text-sm text-slate-400 mt-1">Start with our optimized Push/Pull/Legs templates. Highly recommended for establishing a baseline.</p>
                            </button>

                            <button disabled className="flex flex-col text-left p-6 rounded-xl border-2 border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed relative overflow-hidden">
                                <div className="absolute top-4 right-4 bg-slate-800 text-xs font-bold px-2 py-1 rounded">Coming Soon</div>
                                <Activity className="h-8 w-8 mb-4 text-slate-600" />
                                <h3 className="text-lg font-bold text-slate-500">Build Your Own</h3>
                                <p className="text-sm text-slate-500 mt-1">Design a custom training block from scratch. Advanced users only.</p>
                            </button>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!training}
                            className="w-full h-12 flex items-center justify-center rounded-md bg-emerald-600 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                        >
                            Next Step <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Step 2: Physical Attributes */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight">Your Physiology</h1>
                            <p className="mt-2 text-sm text-slate-400">Track your baseline metrics.</p>
                        </div>

                        <div className="space-y-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-400">Height (cm)</label>
                                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md h-10 px-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="180" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-400">Weight (kg)</label>
                                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md h-10 px-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="75" />
                                </div>
                            </div>

                            {bmi && (
                                <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                                    <span className="text-3xl font-black text-emerald-400">{bmi}</span>
                                    <span className="text-xs text-emerald-500/80 font-medium uppercase tracking-wider mt-1">Estimated BMI</span>
                                    <div className="mt-3 flex items-start text-xs text-slate-400 max-w-xs text-center">
                                        <Info className="h-4 w-4 mr-1.5 shrink-0 text-slate-500" />
                                        <span>Calculated as <code className="text-slate-300">kg / (m²)</code>. BMI is a general indicator and does not account for muscle mass.</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 mt-4 border-t border-slate-800">
                                <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center"><Ruler className="h-4 w-4 mr-2 text-slate-500" /> Optional Measurements</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">Chest (cm)</label>
                                        <input type="number" value={chest} onChange={e => setChest(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md h-9 px-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">Arms (cm)</label>
                                        <input type="number" value={arm} onChange={e => setArm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md h-9 px-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">Legs (cm)</label>
                                        <input type="number" value={leg} onChange={e => setLeg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md h-9 px-2 text-sm text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleBack} className="w-1/3 h-12 rounded-md border border-slate-700 font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Back</button>
                            <button
                                onClick={handleNext}
                                disabled={!height || !weight} // Require basic metrics to proceed
                                className="w-2/3 h-12 flex items-center justify-center rounded-md bg-emerald-600 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                            >
                                Next Step <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Lifestyle */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight">Lifestyle</h1>
                            <p className="mt-2 text-sm text-slate-400">How active are you outside the gym?</p>
                        </div>

                        <div className="grid gap-3">
                            {[
                                { id: "sedentary", label: "Sedentary", desc: "Minimal movement, typically a desk job." },
                                { id: "somewhat_active", label: "Somewhat Active", desc: "Light exercise 1-3 times a week, mostly sitting." },
                                { id: "active", label: "Active", desc: "Moderate exercise 3-5 times a week, moving throughout the day." },
                                { id: "very_active", label: "Very Active", desc: "Hard daily exercise or a physical labor job." },
                            ].map((lvl) => (
                                <button
                                    key={lvl.id}
                                    onClick={() => setLifestyle(lvl.id)}
                                    className={`flex flex-col text-left p-4 rounded-xl border transition-all ${lifestyle === lvl.id ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}
                                >
                                    <h3 className={`text-base font-bold ${lifestyle === lvl.id ? "text-emerald-400" : "text-slate-200"}`}>{lvl.label}</h3>
                                    <p className="text-sm text-slate-400">{lvl.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={handleBack} disabled={isSubmitting} className="w-1/3 h-12 rounded-md border border-slate-700 font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Back</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!lifestyle || isSubmitting}
                                className="w-2/3 h-12 flex items-center justify-center rounded-md bg-emerald-600 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Finish Setup"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
