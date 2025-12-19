"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Send, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getNewYorkDate } from "@/lib/date-utils";
import { useUser } from "@/hooks/useUser";
import { useRiskGuard } from "@/hooks/useRiskGuard";
import { createTrade, uploadTradeImage } from "@/lib/queries";
import {
    type SessionType, type BiasType, type BiasDailyType, type FrameworkType,
    type ProfilingType, type EntryModelType, type ResultType, type MoodType,
    getAvailableEntryModels, PAIRS, BIAS_DAILY_OPTIONS, FRAMEWORKS, PROFILINGS, MOODS
} from "@/lib/types";

export default function JournalNewPage() {
    const router = useRouter();
    const { user } = useUser();
    const { isLocked, currentR } = useRiskGuard();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [tradeDate, setTradeDate] = useState(getNewYorkDate());
    const [session, setSession] = useState<SessionType>("London");
    const [pair, setPair] = useState("XAUUSD");
    const [bias, setBias] = useState<BiasType | "">("");
    const [biasDaily, setBiasDaily] = useState<BiasDailyType | "">("");
    const [framework, setFramework] = useState<FrameworkType | "">("");
    const [profiling, setProfiling] = useState<ProfilingType | "">("");
    const [entryModel, setEntryModel] = useState<EntryModelType | "">("");
    const [result, setResult] = useState<ResultType | "">("");
    const [rr, setRR] = useState("");
    const [mood, setMood] = useState<MoodType | "">("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const availableEntryModels = profiling ? getAvailableEntryModels(profiling as ProfilingType) : [];

    const handleProfilingChange = (value: ProfilingType) => {
        setProfiling(value);
        setEntryModel("");
    };

    const handleResultChange = (value: ResultType) => {
        setResult(value);
        if (value === "Lose") setRR("-1.0");
        else if (value === "BE") setRR("0");
        else setRR("");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError("Image must be less than 2MB");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const validateForm = (): boolean => {
        if (!bias) { setError("Please select daily bias"); return false; }
        if (!biasDaily) { setError("Please select bias daily type"); return false; }
        if (!framework) { setError("Please select framework"); return false; }
        if (!profiling) { setError("Please select profiling"); return false; }
        if (!entryModel) { setError("Please select entry model"); return false; }
        if (!result) { setError("Please select trade result"); return false; }
        if (!rr) { setError("Please enter R value"); return false; }
        if (!mood) { setError("Please select mental state"); return false; }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user) {
            setError("You must be logged in");
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Upload image if exists
            let imageUrl: string | undefined;
            if (imageFile) {
                const url = await uploadTradeImage(imageFile, user.id);
                if (url) imageUrl = url;
            }

            // Create trade
            const trade = await createTrade({
                user_id: user.id,
                trade_date: tradeDate,
                session,
                pair,
                bias: bias as BiasType,
                bias_daily: biasDaily as BiasDailyType,
                framework: framework as FrameworkType,
                profiling: profiling as ProfilingType,
                entry_model: entryModel as EntryModelType,
                result: result as ResultType,
                rr: parseFloat(rr),
                mood: mood as MoodType,
                description: description || undefined,
                image_url: imageUrl,
            });

            if (!trade) {
                setError("Failed to create trade. Please try again.");
                setIsSubmitting(false);
                return;
            }

            router.push("/journal");
            router.refresh();
        } catch (err) {
            setError("An unexpected error occurred");
            setIsSubmitting(false);
        }
    };

    if (isLocked) {
        return (
            <div className="max-w-2xl mx-auto p-8">
                <div className="text-center py-16 border border-rose-900/50 bg-rose-950/10 rounded-xl">
                    <Lock className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-rose-500 mb-2">Trading Locked</h2>
                    <p className="text-zinc-400 text-sm mb-4">
                        You have reached the daily -2R limit ({currentR.toFixed(1)}R).
                    </p>
                    <p className="text-zinc-500 text-xs">
                        Trading will be unlocked at New York midnight.
                    </p>
                    <Link href="/dashboard">
                        <Button variant="outline" className="mt-6 border-zinc-700">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/journal" className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Log New Trade</h1>
                    <p className="text-sm text-zinc-400">Fill in the details accurately. Focus on execution.</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Market Context */}
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                            Market Context
                        </h3>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Trade Date</Label>
                                <Input
                                    type="date"
                                    value={tradeDate}
                                    onChange={(e) => setTradeDate(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 text-white focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Session</Label>
                                <Select value={session} onValueChange={(v) => setSession(v as SessionType)}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="London">London Session</SelectItem>
                                        <SelectItem value="New York">New York Session</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Instrument</Label>
                                <Select value={pair} onValueChange={setPair}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white font-mono"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAIRS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Daily Bias</Label>
                                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-md border border-zinc-800">
                                    <button type="button" onClick={() => setBias("Bullish")} className={cn("text-center py-1.5 rounded text-xs font-medium transition-all", bias === "Bullish" ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:bg-zinc-900")}>Bullish</button>
                                    <button type="button" onClick={() => setBias("Bearish")} className={cn("text-center py-1.5 rounded text-xs font-medium transition-all", bias === "Bearish" ? "bg-rose-500/10 text-rose-500" : "text-zinc-500 hover:bg-zinc-900")}>Bearish</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Execution Logic */}
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                            Execution Logic
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Bias Daily Type</Label>
                                <Select value={biasDaily} onValueChange={(v) => setBiasDaily(v as BiasDailyType)}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Select type..." /></SelectTrigger>
                                    <SelectContent>
                                        {BIAS_DAILY_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Framework</Label>
                                <Select value={framework} onValueChange={(v) => setFramework(v as FrameworkType)}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Select framework..." /></SelectTrigger>
                                    <SelectContent>
                                        {FRAMEWORKS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Profiling</Label>
                                <Select value={profiling} onValueChange={handleProfilingChange}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Select profiling..." /></SelectTrigger>
                                    <SelectContent>
                                        {PROFILINGS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-400">Entry Model</Label>
                                <Select value={entryModel} onValueChange={(v) => setEntryModel(v as EntryModelType)} disabled={!profiling}>
                                    <SelectTrigger className={cn("bg-zinc-950 border-zinc-800 text-white", !profiling && "opacity-50")}>
                                        <SelectValue placeholder={profiling ? "Select model..." : "Select profiling first..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEntryModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Outcome */}
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                            Outcome
                        </h3>
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-zinc-400">Trade Result</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {(["Win", "Lose", "BE"] as const).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => handleResultChange(r)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-lg border transition-all",
                                            result === r
                                                ? r === "Win" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                                    : r === "Lose" ? "border-rose-500 bg-rose-500/10 text-rose-500"
                                                        : "border-amber-500 bg-amber-500/10 text-amber-500"
                                                : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-500"
                                        )}
                                    >
                                        <span className="text-2xl mb-1">{r === "Win" ? "✓" : r === "Lose" ? "✕" : "−"}</span>
                                        <span className="text-xs font-bold">{r === "BE" ? "BE / 0R" : r.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2">
                            <Label className="text-xs font-medium text-zinc-400">Risk Reward (R)</Label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-sm">R</span>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={rr}
                                    onChange={(e) => setRR(e.target.value)}
                                    placeholder="e.g. 2.5"
                                    className={cn(
                                        "pl-8 bg-zinc-950 border-zinc-800 font-mono",
                                        result === "Win" && "text-emerald-500",
                                        result === "Lose" && "text-rose-500"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-400">Mental State</Label>
                            <Select value={mood} onValueChange={(v) => setMood(v as MoodType)}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="How did you feel?" /></SelectTrigger>
                                <SelectContent>
                                    {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Chart Evidence */}
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Chart Evidence</h3>
                        <label className="w-full h-48 rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group relative overflow-hidden">
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-zinc-500 group-hover:text-indigo-400">
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span className="text-xs font-medium">Click or Drag Screenshot</span>
                                    <span className="text-[10px] text-zinc-600 mt-1">Max 2MB (WebP/JPG)</span>
                                </div>
                            )}
                        </label>
                        {imagePreview && (
                            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs text-zinc-500 hover:text-rose-400 mt-2">
                                Remove image
                            </button>
                        )}
                    </div>

                    {/* Trader's Note */}
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Trader&apos;s Note</h3>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-40 bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-indigo-500 resize-none"
                            placeholder="Describe your execution logic, emotions, or mistakes..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                            ) : (
                                <><Send className="h-4 w-4 mr-2" />Log Trade</>
                            )}
                        </Button>
                        <p className="text-[10px] text-zinc-500 text-center mt-3 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />Trade will be submitted for mentor review
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
