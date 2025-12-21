"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Send, AlertCircle, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PairSelector } from "@/components/trade/PairSelector";
import { cn } from "@/lib/utils";
import { getNewYorkDate } from "@/lib/date-utils";
import { useUser } from "@/hooks/useUser";
import { createTrade, uploadTradeImage } from "@/lib/queries";
import { compressImageToFile } from "@/lib/imageCompression";
import { PROFILING_OPTIONS, type ResultType } from "@/lib/types";

export default function JournalNewPage() {
    const router = useRouter();
    const { user } = useUser();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [compressionStatus, setCompressionStatus] = useState<string | null>(null);

    // Simplified form state
    const [tradeDate, setTradeDate] = useState(getNewYorkDate());
    const [pair, setPair] = useState("");
    const [result, setResult] = useState<ResultType | "">("");
    const [rr, setRR] = useState("");
    const [profiling, setProfiling] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleResultChange = (value: ResultType) => {
        setResult(value);
        if (value === "Lose") setRR("-1.0");
        else setRR("");
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if image needs compression
        const sizeMB = file.size / (1024 * 1024);

        try {
            let finalFile = file;

            if (sizeMB > 0.5) {
                setCompressionStatus(`Compressing image (${sizeMB.toFixed(1)}MB)...`);
                finalFile = await compressImageToFile(file, { maxSizeKB: 512 });
                const newSizeMB = finalFile.size / (1024 * 1024);
                setCompressionStatus(`Compressed: ${sizeMB.toFixed(1)}MB → ${newSizeMB.toFixed(2)}MB`);
                setTimeout(() => setCompressionStatus(null), 3000);
            }

            setImageFile(finalFile);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(finalFile);
        } catch (err) {
            setError("Failed to process image");
        }
    };

    const validateForm = (): boolean => {
        if (!pair) { setError("Please select trading pair"); return false; }
        if (!result) { setError("Please select trade result"); return false; }
        if (!rr) { setError("Please enter R value"); return false; }
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
            let screenshotUrl: string | undefined;
            if (imageFile) {
                const url = await uploadTradeImage(imageFile, user.id);
                if (url) screenshotUrl = url;
            }

            // Create trade
            const trade = await createTrade({
                user_id: user.id,
                trade_date: tradeDate,
                pair,
                result: result as ResultType,
                rr: parseFloat(rr),
                profiling: profiling || undefined,
                description: description || undefined,
                screenshot_url: screenshotUrl,
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

    return (
        <div className="max-w-4xl mx-auto p-8 page-transition">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/journal" className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Log New Trade</h1>
                    <p className="text-sm text-muted-foreground">Record your trade with accuracy and discipline.</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Trade Details */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Basic Info */}
                    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                            Trade Details
                        </h3>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Trade Date</Label>
                                <Input
                                    type="date"
                                    value={tradeDate}
                                    onChange={(e) => setTradeDate(e.target.value)}
                                    className="bg-background border-border text-foreground focus:border-primary"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Instrument</Label>
                                <PairSelector value={pair} onChange={setPair} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Profiling (Optional)</Label>
                            <Select value={profiling} onValueChange={setProfiling}>
                                <SelectTrigger className="bg-background border-border text-foreground">
                                    <SelectValue placeholder="Select profiling..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROFILING_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Outcome */}
                    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                            Outcome
                        </h3>

                        {/* Result Selection */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground">Trade Result</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleResultChange("Win")}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                                        result === "Win"
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <span className="text-4xl mb-2">✓</span>
                                    <span className="text-sm font-bold">WIN</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleResultChange("Lose")}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                                        result === "Lose"
                                            ? "border-rose-500 bg-rose-500/10 text-rose-500"
                                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <span className="text-4xl mb-2">✗</span>
                                    <span className="text-sm font-bold">LOSE</span>
                                </button>
                            </div>
                        </div>

                        {/* R Value */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Risk Reward (R)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-mono text-sm">R</span>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={rr}
                                    onChange={(e) => setRR(e.target.value)}
                                    placeholder="e.g. 2.5"
                                    className={cn(
                                        "pl-8 bg-background border-border font-mono text-lg",
                                        result === "Win" && "text-emerald-500",
                                        result === "Lose" && "text-rose-500"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Chart Evidence */}
                    <div className="p-6 rounded-xl border border-border bg-card">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                            Chart Screenshot
                        </h3>
                        <label className="w-full h-52 rounded-xl border-2 border-dashed border-border bg-background/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden">
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary">
                                    <ImageIcon className="h-10 w-10 mb-3" />
                                    <span className="text-sm font-medium">Click to upload</span>
                                    <span className="text-xs text-muted-foreground/70 mt-1">Auto-compressed to 512KB</span>
                                </div>
                            )}
                        </label>
                        {compressionStatus && (
                            <p className="text-xs text-primary mt-2">{compressionStatus}</p>
                        )}
                        {imagePreview && (
                            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs text-muted-foreground hover:text-destructive mt-3">
                                Remove image
                            </button>
                        )}
                    </div>

                    {/* Trader's Note */}
                    <div className="p-6 rounded-xl border border-border bg-card">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                            Trade Notes (Optional)
                        </h3>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 bg-background border-border text-foreground focus:border-primary resize-none"
                            placeholder="Describe your analysis, execution, or lessons learned..."
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl shadow-lg shadow-primary/20 transition-all cta-primary"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                        ) : (
                            <><Send className="h-4 w-4 mr-2" />Submit Trade</>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        Trade will be submitted for mentor review
                    </p>
                </div>
            </form>
        </div>
    );
}
