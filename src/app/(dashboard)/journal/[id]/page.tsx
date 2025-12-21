"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ZoomIn, ExternalLink, AlertCircle, Check, X } from "lucide-react";
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
    const [mentorFeedback, setMentorFeedback] = useState("");

    useEffect(() => {
        async function loadTrade() {
            setIsLoading(true);
            const data = await getTradeById(id);
            setTrade(data);
            if (data?.mentor_score) setSelectedScore(data.mentor_score);
            if (data?.mentor_feedback) setMentorFeedback(data.mentor_feedback);
            setIsLoading(false);
        }
        loadTrade();
    }, [id]);

    const handleReview = async (status: 'reviewed' | 'needs_improvement') => {
        if (!trade || !profile || !selectedScore) return;

        setIsSubmitting(true);
        const success = await reviewTrade(trade.id, profile.id, selectedScore, mentorFeedback, status);
        if (success) {
            const updated = await getTradeById(id);
            setTrade(updated);
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)]">
                <div className="flex-1 bg-muted/20 flex items-center justify-center">
                    <div className="animate-pulse w-3/4 h-3/4 skeleton rounded-lg" />
                </div>
                <div className="w-[400px] bg-background border-l border-border animate-pulse">
                    <div className="p-6 space-y-4">
                        <div className="h-8 skeleton rounded w-1/2" />
                        <div className="h-16 skeleton rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!trade) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Trade not found</p>
                    <Link href="/journal" className="text-primary text-sm mt-2 inline-block hover:underline">
                        Back to Journal
                    </Link>
                </div>
            </div>
        );
    }

    const isReviewed = trade.status === 'reviewed';
    const needsImprovement = trade.status === 'needs_improvement';

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Left: Chart View */}
            <div className="flex-1 bg-muted/10 overflow-auto p-4 flex items-center justify-center relative group">
                {trade.screenshot_url ? (
                    <div className="relative shadow-2xl rounded-xl overflow-hidden border border-border max-w-4xl">
                        <img
                            src={trade.screenshot_url}
                            alt="Trade Chart"
                            className="w-full h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{trade.pair}</span>
                            <span className={cn(
                                "text-xs font-mono font-bold",
                                trade.rr > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {trade.rr > 0 ? '+' : ''}{trade.rr.toFixed(2)}R
                            </span>
                        </div>
                        <a
                            href={trade.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 bg-background/90 backdrop-blur text-foreground px-3 py-1.5 rounded-full text-xs border border-border hover:border-primary transition-colors flex items-center gap-1"
                        >
                            <ExternalLink className="h-3 w-3" />Open Full
                        </a>
                    </div>
                ) : (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center">
                        <ZoomIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm">No chart image uploaded</p>
                    </div>
                )}
            </div>

            {/* Right: Details Panel */}
            <div className="w-[400px] bg-background border-l border-border flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <Link href="/journal" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
                        <ArrowLeft className="h-4 w-4" />Back to Journal
                    </Link>
                </div>

                {/* Trade Summary */}
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-muted-foreground">#{trade.id.slice(0, 8)}</span>
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                            trade.result === "Win"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                            {trade.result === "Win"
                                ? <Check className="h-3 w-3" />
                                : <X className="h-3 w-3" />
                            }
                            {trade.result}
                        </div>
                    </div>
                    <h1 className={cn(
                        "text-3xl font-bold font-mono",
                        trade.rr > 0 ? "text-emerald-500" : trade.rr < 0 ? "text-rose-500" : "text-muted-foreground"
                    )}>
                        {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {trade.trade_date}
                    </div>
                    {trade.profiles && (
                        <p className="text-xs text-muted-foreground mt-2">
                            by <span className="text-foreground">@{trade.profiles.username}</span>
                        </p>
                    )}
                </div>

                {/* Trade Details */}
                <div className="p-6 border-b border-border space-y-4">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Trade Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Pair</p>
                            <p className="text-sm font-mono font-medium text-foreground">{trade.pair}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Profiling</p>
                            <p className="text-sm font-medium text-foreground">{trade.profiling || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                            <p className={cn(
                                "text-sm font-medium",
                                isReviewed && "text-emerald-500",
                                needsImprovement && "text-rose-500",
                                trade.status === 'submitted' && "text-amber-500"
                            )}>
                                {trade.status === 'needs_improvement' ? 'Needs Improvement' :
                                    trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trader's Note */}
                {trade.description && (
                    <div className="p-6 border-b border-border">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Trader's Note</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">"{trade.description}"</p>
                    </div>
                )}

                {/* Mentor Review Section */}
                <div className="flex-1 bg-muted/20 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full", isReviewed ? "bg-emerald-500" : "bg-primary animate-pulse")} />
                        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                            {isReviewed ? "Mentor Review" : isMentor ? "Submit Review" : "Pending Review"}
                        </h3>
                    </div>

                    {/* Score Display/Input */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">SOP Compliance Score</p>
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
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : isReviewed || !isMentor
                                                ? "border-border bg-muted text-muted-foreground"
                                                : "border-border bg-muted text-muted-foreground hover:scale-110 hover:border-primary hover:text-primary"
                                    )}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Feedback / Coaching</p>
                        {isReviewed ? (
                            <div className="bg-background border border-border rounded-lg p-3">
                                <p className="text-sm text-foreground">{trade.mentor_feedback || "No feedback provided"}</p>
                            </div>
                        ) : isMentor ? (
                            <Textarea
                                value={mentorFeedback}
                                onChange={(e) => setMentorFeedback(e.target.value)}
                                className="w-full h-32 bg-background border-border text-foreground focus:border-primary resize-none"
                                placeholder="Write your feedback here..."
                            />
                        ) : (
                            <div className="bg-background border border-border rounded-lg p-3">
                                <p className="text-sm text-muted-foreground italic">Awaiting mentor review...</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons (Mentor only) */}
                    {!isReviewed && isMentor && (
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <Button
                                variant="outline"
                                onClick={() => handleReview('needs_improvement')}
                                disabled={isSubmitting || !selectedScore}
                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                            >
                                Needs Improvement
                            </Button>
                            <Button
                                onClick={() => handleReview('reviewed')}
                                disabled={isSubmitting || !selectedScore}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? "Saving..." : "Approve"}
                            </Button>
                        </div>
                    )}

                    {/* Status Badge for reviewed trades */}
                    {isReviewed && (
                        <div className="mt-auto pt-4 border-t border-border text-center">
                            <span className="text-xs text-emerald-500">✓ Reviewed by mentor</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
