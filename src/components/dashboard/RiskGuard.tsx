"use client";

import { cn } from "@/lib/utils";
import { useRiskGuard } from "@/hooks/useRiskGuard";
import { Lock, Shield } from "lucide-react";

export function RiskGuard() {
    const { currentR, isLocked, isLoading, resetTimer, percentage } = useRiskGuard();

    const getBarColor = () => {
        if (isLocked) return "bg-rose-600";
        if (currentR <= -1) return "bg-amber-500";
        return "bg-emerald-500";
    };

    const formatRiskValue = () => {
        const sign = currentR > 0 ? "+" : "";
        return `${sign}${currentR.toFixed(1)}R`;
    };

    if (isLoading) {
        return (
            <div className="lg:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 flex flex-col justify-between animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-1/2 mb-4" />
                <div className="h-12 bg-zinc-800 rounded w-1/3 mb-6" />
                <div className="h-3 bg-zinc-800 rounded-full" />
            </div>
        );
    }

    return (
        <div className={cn(
            "lg:col-span-1 rounded-xl border bg-zinc-900/30 p-6 flex flex-col justify-between transition-all duration-300",
            isLocked ? "border-rose-900 bg-rose-950/10" : "border-zinc-800"
        )}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield className={cn("h-4 w-4", isLocked ? "text-rose-500" : "text-indigo-500")} />
                        <h3 className="text-sm font-semibold text-zinc-200">Daily Risk Guard</h3>
                    </div>
                    <div className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border",
                        isLocked
                            ? "border-rose-500 text-rose-500 bg-rose-500/10"
                            : "border-zinc-700 text-zinc-400"
                    )}>
                        {isLocked ? "LOCKED" : "Limit: -2R"}
                    </div>
                </div>

                {/* Current R Value */}
                <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                        "font-mono text-5xl font-bold tracking-tighter transition-colors duration-300",
                        isLocked ? "text-rose-500" : currentR > 0 ? "text-emerald-500" : currentR < 0 ? "text-amber-500" : "text-white"
                    )}>
                        {formatRiskValue()}
                    </span>
                    {isLocked && <Lock className="h-6 w-6 text-rose-500 animate-pulse" />}
                </div>

                {/* Reset Timer */}
                <p className="text-xs text-zinc-500 mb-4">
                    Resets in <span className="font-mono text-zinc-400">{resetTimer}</span>
                </p>

                {/* Progress Bar */}
                <div className="relative h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500 ease-out", getBarColor())}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-600">
                    <span>0R</span>
                    <span>-1R</span>
                    <span>-2R</span>
                </div>
            </div>

            {/* Status Message */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
                {isLocked ? (
                    <div className="flex items-center gap-2 text-rose-400">
                        <Lock className="h-4 w-4" />
                        <p className="text-xs">Trading disabled until NY midnight reset.</p>
                    </div>
                ) : currentR <= -1 ? (
                    <p className="text-xs text-amber-400">⚠️ Warning: Approaching daily limit. Trade carefully.</p>
                ) : currentR > 0 ? (
                    <p className="text-xs text-emerald-400">✓ In profit today. Stay consistent!</p>
                ) : (
                    <p className="text-xs text-zinc-500">You haven&apos;t logged any trades today.</p>
                )}
            </div>
        </div>
    );
}
