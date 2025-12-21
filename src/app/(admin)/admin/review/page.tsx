"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, TrendingUp, Eye, Check, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendingReviews } from "@/lib/queries";
import type { TradeWithProfile } from "@/lib/types";

export default function ReviewQueuePage() {
    const [trades, setTrades] = useState<TradeWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const pending = await getPendingReviews();
            setTrades(pending);
            setIsLoading(false);
        }
        loadData();
    }, []);

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto p-8">
                <div className="space-y-6">
                    <div className="h-10 skeleton rounded w-1/3" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-6 page-transition">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Review Queue</h1>
                    <p className="text-sm text-muted-foreground">
                        You have <span className="text-amber-500 font-bold">{trades.length} pending trade{trades.length !== 1 ? 's' : ''}</span> to grade.
                    </p>
                </div>
            </div>

            {/* Queue List */}
            {trades.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border rounded-xl">
                    <Check className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">All caught up! No pending trades.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trades.map((trade) => (
                        <div
                            key={trade.id}
                            className="group relative flex flex-col md:flex-row bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all"
                        >
                            {/* Chart Thumbnail */}
                            <div className="w-full md:w-48 h-32 bg-muted relative overflow-hidden border-r border-border">
                                {trade.screenshot_url ? (
                                    <img
                                        src={trade.screenshot_url}
                                        alt="Chart"
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur px-2 py-0.5 rounded text-xs font-mono text-foreground">
                                    {trade.pair}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 p-5 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                                            {trade.profiles?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{trade.profiles?.username}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTimeAgo(trade.created_at)}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                                        trade.result === 'Win'
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                    )}>
                                        {trade.result === 'Win' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        {trade.result} {trade.rr >= 0 ? '+' : ''}{trade.rr}R
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="font-mono font-medium text-foreground">{trade.pair}</span>
                                    {trade.profiling && <span>{trade.profiling}</span>}
                                    <span>{trade.trade_date}</span>
                                </div>

                                {trade.description && (
                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1 italic">
                                        &quot;{trade.description}&quot;
                                    </p>
                                )}

                                {/* Status badge */}
                                {trade.status === 'needs_improvement' && (
                                    <div className="mt-2">
                                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                            Needs Improvement
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <div className="p-5 flex flex-col justify-center border-l border-border bg-muted/20">
                                <Link
                                    href={`/journal/${trade.id}`}
                                    className={cn(
                                        "text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all text-center",
                                        trade.result === 'Lose'
                                            ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                                            : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                                    )}
                                >
                                    <Eye className="inline mr-1 h-3 w-3" />
                                    {trade.result === 'Lose' ? 'Review Now' : 'Quick Grade'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
