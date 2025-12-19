"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

interface EquityCurveProps {
    trades: Trade[];
    className?: string;
}

export function EquityCurve({ trades, className }: EquityCurveProps) {
    // Calculate cumulative R for chart
    const chartData = useMemo(() => {
        if (!trades || trades.length === 0) return [];

        // Sort by date ascending
        const sorted = [...trades].sort((a, b) =>
            new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
        );

        let cumulative = 0;
        return sorted.map((trade) => {
            cumulative += trade.rr;
            return {
                date: trade.trade_date,
                rr: trade.rr,
                cumulative: Math.round(cumulative * 10) / 10,
            };
        });
    }, [trades]);

    // Generate SVG path
    const generatePath = () => {
        if (chartData.length === 0) return { linePath: "", areaPath: "" };

        const width = 100;
        const height = 50;
        const padding = 2;

        const values = chartData.map(d => d.cumulative);
        const minVal = Math.min(0, ...values);
        const maxVal = Math.max(0, ...values);
        const range = maxVal - minVal || 1;

        const points = chartData.map((d, i) => {
            const x = (i / (chartData.length - 1 || 1)) * (width - padding * 2) + padding;
            const y = height - padding - ((d.cumulative - minVal) / range) * (height - padding * 2);
            return { x, y };
        });

        const linePath = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`
        ).join(' ');

        const areaPath = `${linePath} L${width - padding},${height} L${padding},${height} Z`;

        return { linePath, areaPath };
    };

    const { linePath, areaPath } = generatePath();
    const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0;
    const isPositive = lastValue >= 0;

    return (
        <div className={cn("lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6", className)}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-200">Equity Curve</h3>
                    <p className="text-xs text-zinc-500">{chartData.length} trades plotted</p>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "font-mono text-2xl font-bold",
                        isPositive ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {isPositive ? "+" : ""}{lastValue}R
                    </p>
                    <p className="text-[10px] text-zinc-500">Total Cumulative</p>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center border border-dashed border-zinc-800 rounded-lg">
                    <div className="text-center">
                        <p className="text-zinc-500 text-sm">No trades yet</p>
                        <p className="text-zinc-600 text-xs mt-1">Start logging trades to see your equity curve</p>
                    </div>
                </div>
            ) : (
                <div className="h-[200px] relative">
                    <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="equity-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: isPositive ? "#10b981" : "#f43f5e", stopOpacity: 0.3 }} />
                                <stop offset="100%" style={{ stopColor: isPositive ? "#10b981" : "#f43f5e", stopOpacity: 0.02 }} />
                            </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.2" strokeDasharray="2,2" />
                        {/* Area fill */}
                        <path d={areaPath} fill="url(#equity-gradient)" />
                        {/* Line */}
                        <path d={linePath} fill="none" stroke={isPositive ? "#10b981" : "#f43f5e"} strokeWidth="0.8" />
                        {/* End dot */}
                        {chartData.length > 0 && (
                            <circle
                                cx={100 - 2}
                                cy={chartData.length > 0 ? 50 - 2 - ((chartData[chartData.length - 1].cumulative - Math.min(0, ...chartData.map(d => d.cumulative))) / (Math.max(0, ...chartData.map(d => d.cumulative)) - Math.min(0, ...chartData.map(d => d.cumulative)) || 1)) * 46 : 25}
                                r="1.5"
                                fill={isPositive ? "#10b981" : "#f43f5e"}
                                className="animate-pulse"
                            />
                        )}
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-zinc-600 mt-1">
                        <span>{chartData[0]?.date.slice(5)}</span>
                        <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            {chartData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Best Trade</p>
                        <p className="font-mono text-sm text-emerald-500">
                            +{Math.max(...chartData.map(d => d.rr)).toFixed(1)}R
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Worst Trade</p>
                        <p className="font-mono text-sm text-rose-500">
                            {Math.min(...chartData.map(d => d.rr)).toFixed(1)}R
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Avg Trade</p>
                        <p className="font-mono text-sm text-zinc-300">
                            {(chartData.reduce((s, d) => s + d.rr, 0) / chartData.length).toFixed(2)}R
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
