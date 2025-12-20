"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, BarChart3, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { getUserStats, getSessionStats, getProfilingStats, getUserTrades } from "@/lib/queries";
import type { UserStats, Trade } from "@/lib/types";

export default function AnalyticsPage() {
    const { user, profile, isLoading: userLoading } = useUser();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [sessionStats, setSessionStats] = useState<{ london: { totalR: number; winRate: number; count: number }; newYork: { totalR: number; winRate: number; count: number } } | null>(null);
    const [profilingStats, setProfilingStats] = useState<{ profiling: string; count: number; totalR: number; winRate: number }[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const userIdRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);

    // Initial load
    useEffect(() => {
        if (userLoading || !user) return;
        if (userIdRef.current === user.id) return;

        userIdRef.current = user.id;
        isFetchingRef.current = true;

        Promise.all([
            getUserStats(user.id),
            getSessionStats(user.id),
            getProfilingStats(user.id),
            getUserTrades(user.id),
        ])
            .then(([userStats, sessions, profiling, allTrades]) => {
                setStats(userStats);
                setSessionStats(sessions);
                setProfilingStats(profiling);
                setTrades(allTrades);
            })
            .catch((error) => {
                console.error('Error loading analytics:', error);
            })
            .finally(() => {
                setIsFirstLoad(false);
                isFetchingRef.current = false;
            });
    }, [user, userLoading]);

    // Visibility change - silent refetch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            if (!userIdRef.current) return;
            if (isFetchingRef.current) return;

            isFetchingRef.current = true;
            const userId = userIdRef.current;

            Promise.all([
                getUserStats(userId),
                getSessionStats(userId),
                getProfilingStats(userId),
                getUserTrades(userId),
            ])
                .then(([userStats, sessions, profiling, allTrades]) => {
                    setStats(userStats);
                    setSessionStats(sessions);
                    setProfilingStats(profiling);
                    setTrades(allTrades);
                })
                .catch((error) => {
                    console.error('Error refetching analytics:', error);
                })
                .finally(() => {
                    isFetchingRef.current = false;
                });
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Calculate monthly stats
    const getMonthlyStats = () => {
        const monthlyData: Record<string, { trades: number; totalR: number; wins: number }> = {};

        trades.forEach(trade => {
            const month = trade.trade_date.slice(0, 7); // YYYY-MM
            if (!monthlyData[month]) monthlyData[month] = { trades: 0, totalR: 0, wins: 0 };
            monthlyData[month].trades++;
            monthlyData[month].totalR += trade.rr;
            if (trade.result === 'Win') monthlyData[month].wins++;
        });

        return Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // Last 6 months
            .map(([month, data]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                ...data,
                winRate: data.trades ? Math.round((data.wins / data.trades) * 100) : 0,
            }));
    };

    const monthlyStats = getMonthlyStats();
    const maxMonthlyR = Math.max(...monthlyStats.map(m => Math.abs(m.totalR)), 1);

    if (userLoading || isFirstLoad) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-zinc-800 rounded-xl" />)}
                    </div>
                    <div className="h-80 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!stats || trades.length === 0) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Performance Analytics</h1>
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center mt-8">
                    <BarChart3 className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 text-sm mb-2">No trading data yet</p>
                    <p className="text-zinc-500 text-xs">Start logging trades to see your analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Performance Analytics</h1>
                <p className="text-sm text-zinc-400">
                    Analyzing <span className="text-indigo-400 font-bold">{stats.totalTrades} trades</span> from your journal
                </p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total P&L</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className={cn("font-mono text-3xl font-bold", stats.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {stats.totalR >= 0 ? "+" : ""}{stats.totalR}R
                        </span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Win Rate</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-white">{stats.winRate}%</span>
                        {stats.winRate >= 50 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Avg SOP Score</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-amber-500">{stats.avgSopScore || '-'}</span>
                        <span className="text-xs text-zinc-500">/ 5</span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Trades</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-white">{stats.totalTrades}</span>
                    </div>
                </div>
            </div>

            {/* Session Comparison */}
            {sessionStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-sm font-semibold text-zinc-200">Session Comparison</h3>
                        </div>
                        <div className="space-y-6">
                            {/* London */}
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-white font-medium">London Session</span>
                                    <span className="text-zinc-400">{sessionStats.london.count} trades</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Win Rate</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${sessionStats.london.winRate}%` }} />
                                            </div>
                                            <span className="text-xs font-mono text-indigo-400">{sessionStats.london.winRate}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Total R</p>
                                        <p className={cn("text-lg font-mono font-bold", sessionStats.london.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {sessionStats.london.totalR >= 0 ? "+" : ""}{sessionStats.london.totalR}R
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* New York */}
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-white font-medium">New York Session</span>
                                    <span className="text-zinc-400">{sessionStats.newYork.count} trades</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Win Rate</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${sessionStats.newYork.winRate}%` }} />
                                            </div>
                                            <span className="text-xs font-mono text-purple-400">{sessionStats.newYork.winRate}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Total R</p>
                                        <p className={cn("text-lg font-mono font-bold", sessionStats.newYork.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {sessionStats.newYork.totalR >= 0 ? "+" : ""}{sessionStats.newYork.totalR}R
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entry Model Performance */}
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-sm font-semibold text-zinc-200">Entry Model Performance</h3>
                        </div>
                        <div className="space-y-3">
                            {profilingStats.length > 0 ? profilingStats.map((stat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-300 truncate">{stat.profiling}</span>
                                            <span className="text-zinc-500">{stat.count} trades</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full", stat.totalR >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                                                style={{ width: `${Math.min(Math.abs(stat.totalR) * 10, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className={cn("text-xs font-mono font-bold w-12 text-right", stat.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {stat.totalR >= 0 ? "+" : ""}{stat.totalR}R
                                    </span>
                                </div>
                            )) : (
                                <p className="text-zinc-500 text-sm text-center py-4">No data yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Progress */}
            {monthlyStats.length > 0 && (
                <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-zinc-200">Monthly Progress</h3>
                    </div>
                    <div className="flex items-end justify-around gap-4 h-48">
                        {monthlyStats.map((month, i) => (
                            <div key={i} className="flex flex-col items-center flex-1">
                                <div className="w-full flex flex-col items-center justify-end h-36">
                                    <span className={cn("text-xs font-mono mb-1", month.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {month.totalR >= 0 ? "+" : ""}{month.totalR.toFixed(1)}R
                                    </span>
                                    <div
                                        className={cn(
                                            "w-full max-w-12 rounded-t transition-all",
                                            month.totalR >= 0 ? "bg-emerald-500/30 border border-emerald-500/50" : "bg-rose-500/30 border border-rose-500/50"
                                        )}
                                        style={{ height: `${(Math.abs(month.totalR) / maxMonthlyR) * 100}%`, minHeight: 4 }}
                                    />
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-zinc-400">{month.month}</p>
                                    <p className="text-[10px] text-zinc-600">{month.trades} trades</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trade Distribution */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200">Trade Distribution</h3>
                    <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Win</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Loss</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> BE</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {trades.slice(0, 50).map((trade, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-8 h-8 rounded border flex items-center justify-center text-[10px] font-mono",
                                trade.result === 'Win' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                                    trade.result === 'Lose' ? "bg-rose-500/10 border-rose-500/30 text-rose-500" :
                                        "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            )}
                            title={`${trade.pair} ${trade.rr >= 0 ? '+' : ''}${trade.rr}R`}
                        >
                            {trade.rr >= 0 ? '+' : ''}{trade.rr}
                        </div>
                    ))}
                    {trades.length > 50 && (
                        <div className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">
                            +{trades.length - 50}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
