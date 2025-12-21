"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Target, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { getUserStats, getProfilingStats, getUserTrades } from "@/lib/queries";
import type { UserStats, Trade } from "@/lib/types";

export default function AnalyticsPage() {
    const { user, profile, isLoading: userLoading } = useUser();

    const { data: stats } = useQuery<UserStats>({
        queryKey: ['user-stats', user?.id],
        queryFn: () => getUserStats(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    });

    const { data: profilingStats = [] } = useQuery({
        queryKey: ['profiling-stats', user?.id],
        queryFn: () => getProfilingStats(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    });

    const { data: trades = [], isLoading } = useQuery<Trade[]>({
        queryKey: ['user-trades-analytics', user?.id],
        queryFn: () => getUserTrades(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    });

    // Calculate monthly stats from trades
    const getMonthlyStats = () => {
        const monthlyData: Record<string, { trades: number; totalR: number; wins: number }> = {};

        trades.forEach((trade: Trade) => {
            const month = trade.trade_date.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { trades: 0, totalR: 0, wins: 0 };
            }
            monthlyData[month].trades += 1;
            monthlyData[month].totalR += trade.rr;
            if (trade.result === 'Win') monthlyData[month].wins += 1;
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                ...data,
                winRate: data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0,
            }))
            .sort((a, b) => b.month.localeCompare(a.month))
            .slice(0, 6);
    };

    const monthlyStats = getMonthlyStats();
    const maxMonthlyR = Math.max(...monthlyStats.map(m => Math.abs(m.totalR)), 1);

    if (userLoading || isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="space-y-6">
                    <div className="h-10 skeleton w-1/3 rounded" />
                    <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 page-transition">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Performance Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1">Deep dive into your trading performance</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Trades</p>
                    <p className="text-3xl font-mono font-bold text-foreground mt-2">{stats?.totalTrades ?? 0}</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Win Rate</p>
                    <p className={cn("text-3xl font-mono font-bold mt-2", (stats?.winRate ?? 0) >= 50 ? "text-emerald-500" : "text-rose-500")}>
                        {stats?.winRate ?? 0}%
                    </p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total P&L</p>
                    <p className={cn("text-3xl font-mono font-bold mt-2", (stats?.totalR ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {(stats?.totalR ?? 0) >= 0 ? '+' : ''}{stats?.totalR?.toFixed(1) ?? 0}R
                    </p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg SOP Score</p>
                    <p className="text-3xl font-mono font-bold text-amber-500 mt-2">{stats?.avgSopScore?.toFixed(1) ?? "-"}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Performance */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Monthly Performance</h3>
                    </div>

                    {monthlyStats.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">No data yet</p>
                    ) : (
                        <div className="space-y-4">
                            {monthlyStats.map((month) => (
                                <div key={month.month} className="flex items-center gap-4">
                                    <div className="w-20 text-xs text-muted-foreground font-mono">{month.month}</div>
                                    <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                                        <div
                                            className={cn(
                                                "h-full rounded-lg transition-all",
                                                month.totalR >= 0 ? "bg-emerald-500/80" : "bg-rose-500/80"
                                            )}
                                            style={{ width: `${Math.abs(month.totalR) / maxMonthlyR * 100}%` }}
                                        />
                                        <span className={cn(
                                            "absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold",
                                            month.totalR >= 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {month.totalR >= 0 ? '+' : ''}{month.totalR.toFixed(1)}R
                                        </span>
                                    </div>
                                    <div className="w-16 text-right text-xs text-muted-foreground">
                                        {month.trades} trades
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Profiling Performance */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Target className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Performance by Profiling</h3>
                    </div>

                    {profilingStats.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">No data yet</p>
                    ) : (
                        <div className="space-y-4">
                            {profilingStats.map((stat) => (
                                <div key={stat.profiling} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-foreground">{stat.profiling}</span>
                                        <span className={cn(
                                            "text-sm font-mono font-bold",
                                            stat.totalR >= 0 ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {stat.totalR >= 0 ? '+' : ''}{stat.totalR.toFixed(1)}R
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{stat.count} trades</span>
                                        <span>{stat.winRate}% win rate</span>
                                    </div>
                                    <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${stat.winRate}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Best/Worst Trades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Best Trade */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-sm font-semibold text-foreground">Best Trade</h3>
                    </div>
                    {trades.length > 0 ? (
                        <div>
                            {(() => {
                                const best = trades.reduce((max, t) => t.rr > max.rr ? t : max, trades[0]);
                                return (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono font-medium text-foreground">{best.pair}</p>
                                            <p className="text-xs text-muted-foreground">{best.trade_date}</p>
                                        </div>
                                        <p className="text-2xl font-mono font-bold text-emerald-500">+{best.rr.toFixed(2)}R</p>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No trades yet</p>
                    )}
                </div>

                {/* Worst Trade */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                        <h3 className="text-sm font-semibold text-foreground">Worst Trade</h3>
                    </div>
                    {trades.length > 0 ? (
                        <div>
                            {(() => {
                                const worst = trades.reduce((min, t) => t.rr < min.rr ? t : min, trades[0]);
                                return (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono font-medium text-foreground">{worst.pair}</p>
                                            <p className="text-xs text-muted-foreground">{worst.trade_date}</p>
                                        </div>
                                        <p className="text-2xl font-mono font-bold text-rose-500">{worst.rr.toFixed(2)}R</p>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No trades yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
