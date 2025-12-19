"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, ZoomIn, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { getTradeById, reviewTrade } from "@/lib/queries";
import type { TradeWithProfile } from "@/lib/types";

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { profile, isMentor } = useUser();
    const [trade, setTrade] = useState<TradeWithProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review form state
    const [selectedScore, setSelectedScore] = useState<number | null>(null);
    const [mentorNotes, setMentorNotes] = useState("");

    useEffect(() => {
        async function loadTrade() {
            setIsLoading(true);
            const data = await getTradeById(id);
            setTrade(data);
            if (data?.mentor_score) setSelectedScore(data.mentor_score);
            if (data?.mentor_notes) setMentorNotes(data.mentor_notes);
            setIsLoading(false);
        }
        loadTrade();
    }, [id]);

    const handleReview = async (status: 'reviewed' | 'revision') => {
        if (!trade || !profile || !selectedScore) return;

        setIsSubmitting(true);
        const success = await reviewTrade(trade.id, profile.id, selectedScore, mentorNotes, status);
        if (success) {
            const updated = await getTradeById(id);
            setTrade(updated);
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)]">
                <div className="flex-1 bg-zinc-900/50 flex items-center justify-center">
                    <div className="animate-pulse w-3/4 h-3/4 bg-zinc-800 rounded-lg" />
                </div>
                <div className="w-[400px] bg-zinc-950 border-l border-zinc-800 animate-pulse">
                    <div className="p-6 space-y-4">
                        <div className="h-8 bg-zinc-800 rounded w-1/2" />
                        <div className="h-16 bg-zinc-800 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!trade) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">Trade not found</p>
                    <Link href="/journal" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">
                        Back to Journal
                    </Link>
                </div>
            </div>
        );
    }

    const isReviewed = trade.status === 'reviewed';

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Left: Chart View */}
            <div className="flex-1 bg-zinc-900/50 overflow-auto p-4 flex items-center justify-center relative group">
                {trade.image_url ? (
                    <div className="relative shadow-2xl rounded-lg overflow-hidden border border-zinc-800 max-w-4xl">
                        <img
                            src={trade.image_url}
                            alt="Trade Chart"
                            className="w-full h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur px-3 py-1.5 rounded border border-zinc-800 flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{trade.pair}</span>
                            <span className="text-[10px] text-zinc-400">{trade.session}</span>
                        </div>
                        <a
                            href={trade.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs border border-zinc-800 hover:border-indigo-500 transition-colors flex items-center gap-1"
                        >
                            <ExternalLink className="h-3 w-3" />Open Full
                        </a>
                    </div>
                ) : (
                    <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                        <ZoomIn className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 text-sm">No chart image uploaded</p>
                    </div>
                )}
            </div>

            {/* Right: Details Panel */}
            <div className="w-[400px] bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800">
                    <Link href="/journal" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm">
                        <ArrowLeft className="h-4 w-4" />Back to Journal
                    </Link>
                </div>

                {/* Trade Summary */}
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-zinc-500">#{trade.id.slice(0, 8)}</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                            trade.result === "Win" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                trade.result === "Lose" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                            {trade.result}
                        </span>
                    </div>
                    <h1 className={cn(
                        "text-2xl font-bold font-mono",
                        trade.rr > 0 ? "text-emerald-500" : trade.rr < 0 ? "text-rose-500" : "text-zinc-400"
                    )}>
                        {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        {trade.trade_date}
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>{trade.session}</span>
                    </div>
                    {trade.profiles && (
                        <p className="text-xs text-zinc-500 mt-2">
                            by <span className="text-zinc-400">@{trade.profiles.username}</span>
                        </p>
                    )}
                </div>

                {/* Execution Details */}
                <div className="p-6 border-b border-zinc-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase text-zinc-600 tracking-wider">Execution Logic</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Profiling</p>
                            <p className="text-sm font-medium text-white">{trade.profiling}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Model</p>
                            <p className="text-sm font-medium text-white">{trade.entry_model}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Daily Bias</p>
                            <p className={cn("text-sm font-medium", trade.bias === "Bullish" ? "text-emerald-500" : "text-rose-500")}>
                                {trade.bias}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Framework</p>
                            <p className="text-sm font-medium text-white">{trade.framework}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Bias Daily</p>
                            <p className="text-sm font-medium text-zinc-400">{trade.bias_daily}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Mental State</p>
                            <p className="text-sm font-medium text-zinc-400">{trade.mood}</p>
                        </div>
                    </div>
                </div>

                {/* Trader's Note */}
                {trade.description && (
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-xs font-bold uppercase text-zinc-600 tracking-wider mb-2">Trader&apos;s Note</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed italic">&quot;{trade.description}&quot;</p>
                    </div>
                )}

                {/* Mentor Review Section */}
                <div className="flex-1 bg-zinc-900/20 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full", isReviewed ? "bg-emerald-500" : "bg-indigo-500 animate-pulse")} />
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                            {isReviewed ? "Mentor Review" : isMentor ? "Submit Review" : "Pending Review"}
                        </h3>
                    </div>

                    {/* Score Display/Input */}
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-2">SOP Compliance Score</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                    key={score}
                                    type="button"
                                    disabled={isReviewed || !isMentor}
                                    onClick={() => setSelectedScore(score)}
                                    className={cn(
                                        "w-10 h-10 rounded-lg border font-mono font-bold transition-all",
                                        (isReviewed ? trade.mentor_score === score : selectedScore === score)
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : isReviewed || !isMentor
                                                ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                                                : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:scale-110 hover:border-indigo-500 hover:text-indigo-400"
                                    )}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-400 mb-2">Feedback / Coaching</p>
                        {isReviewed ? (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3">
                                <p className="text-sm text-zinc-300">{trade.mentor_notes || "No feedback provided"}</p>
                            </div>
                        ) : isMentor ? (
                            <Textarea
                                value={mentorNotes}
                                onChange={(e) => setMentorNotes(e.target.value)}
                                className="w-full h-32 bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-indigo-500 resize-none"
                                placeholder="Write your feedback here..."
                            />
                        ) : (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3">
                                <p className="text-sm text-zinc-500 italic">Awaiting mentor review...</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons (Mentor only) */}
                    {!isReviewed && isMentor && (
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <Button
                                variant="outline"
                                onClick={() => handleReview('revision')}
                                disabled={isSubmitting || !selectedScore}
                                className="border-rose-900/50 text-rose-500 hover:bg-rose-950/30"
                            >
                                Request Revision
                            </Button>
                            <Button
                                onClick={() => handleReview('reviewed')}
                                disabled={isSubmitting || !selectedScore}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            >
                                {isSubmitting ? "Saving..." : "Submit Review"}
                            </Button>
                        </div>
                    )}

                    {/* Status Badge for reviewed trades */}
                    {isReviewed && (
                        <div className="mt-auto pt-4 border-t border-zinc-800 text-center">
                            <span className="text-xs text-emerald-500">✓ Reviewed by mentor</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
