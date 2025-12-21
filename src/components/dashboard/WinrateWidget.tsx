"use client";

import { cn } from "@/lib/utils";

interface WinrateWidgetProps {
    winRate: number;
    totalWins: number;
    totalTrades: number;
    label?: string;
}

export function WinrateWidget({ winRate, totalWins, totalTrades, label = "Win Rate" }: WinrateWidgetProps) {
    // Clamp winRate between 0 and 100
    const percentage = Math.min(100, Math.max(0, winRate));

    return (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/30"
                    />
                    {/* Progress arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${percentage * 2.64} 264`}
                        className={cn(
                            "transition-all duration-500",
                            percentage >= 50 ? "text-emerald-500" : "text-rose-500"
                        )}
                    />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                        "text-3xl font-bold font-mono",
                        percentage >= 50 ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {percentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                </div>
            </div>

            {/* Stats Below */}
            <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Wins:</span>
                    <span className="font-mono font-medium text-emerald-500">{totalWins}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-muted-foreground">Losses:</span>
                    <span className="font-mono font-medium text-rose-500">{totalTrades - totalWins}</span>
                </div>
            </div>
        </div>
    );
}
