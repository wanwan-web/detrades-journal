"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, TrendingUp, Eye, Check, AlertCircle } from "lucide-react";
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
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-800 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Review Queue</h1>
                    <p className="text-sm text-zinc-400">
                        You have <span className="text-amber-500 font-bold">{trades.length} pending trade{trades.length !== 1 ? 's' : ''}</span> to grade.
                    </p>
                </div>
            </div>

            {/* Queue List */}
            {trades.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl">
                    <Check className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-zinc-400 text-sm">All caught up! No pending trades.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trades.map((trade) => (
                        <div
                            key={trade.id}
                            className="group relative flex flex-col md:flex-row bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all"
                        >
                            {/* Chart Thumbnail */}
                            <div className="w-full md:w-48 h-32 bg-zinc-950 relative overflow-hidden border-r border-zinc-800">
                                {trade.image_url ? (
                                    <img
                                        src={trade.image_url}
                                        alt="Chart"
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                        <TrendingUp className="h-8 w-8 text-zinc-700" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 rounded text-[10px] text-white">
                                    {trade.session}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 p-5 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                            {trade.profiles?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <span className="text-sm font-bold text-white">{trade.profiles?.username}</span>
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Clock className="text-xs" />
                                            {formatTimeAgo(trade.created_at)}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                                        trade.result === 'Win' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                            trade.result === 'Lose' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    )}>
                                        {trade.result.toUpperCase()} {trade.rr >= 0 ? '+' : ''}{trade.rr}R
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <span className="font-bold text-white">{trade.pair}</span>
                                    </span>
                                    <span>{trade.profiling}</span>
                                    <span>{trade.entry_model}</span>
                                </div>

                                {trade.description && (
                                    <p className="mt-2 text-xs text-zinc-500 line-clamp-1 italic">
                                        &quot;{trade.description}&quot;
                                    </p>
                                )}
                            </div>

                            {/* Action */}
                            <div className="p-5 flex flex-col justify-center border-l border-zinc-800 bg-zinc-900/20">
                                <Link
                                    href={`/journal/${trade.id}`}
                                    className={cn(
                                        "text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all text-center",
                                        trade.result === 'Lose'
                                            ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                                            : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                    )}
                                >
                                    <Eye className="inline mr-1" />
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
