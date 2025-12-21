"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, Check, X, ArrowRight, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { WinrateWidget } from "@/components/dashboard/WinrateWidget";
import { useUser } from "@/hooks/useUser";
import { useDashboardData, useCalendarData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

export default function DashboardPage() {
    const { user, profile, isLoading: userLoading } = useUser();
    const { data, isLoading: dataLoading, isFetching } = useDashboardData(user?.id);

    const now = new Date();
    const [calendarYear, setCalendarYear] = useState(now.getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);
    const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[]>([]);

    const { data: calendarData } = useCalendarData(user?.id, calendarYear, calendarMonth);

    const stats = data?.stats ?? null;
    const recentTrades = data?.recentTrades ?? [];
    const allTrades = data?.allTrades ?? [];

    const getResultIcon = (r: "Win" | "Lose") => {
        if (r === "Win") return <Check className="h-4 w-4 text-emerald-500" />;
        return <X className="h-4 w-4 text-rose-500" />;
    };

    const getResultColors = (r: "Win" | "Lose") => {
        if (r === "Win") return "bg-emerald-500/10 border-emerald-500/20";
        return "bg-rose-500/10 border-rose-500/20";
    };

    const getRRColor = (rr: number) => {
        if (rr > 0) return "text-emerald-500";
        if (rr < 0) return "text-rose-500";
        return "text-muted-foreground";
    };

    // Calculate total wins for winrate widget
    const totalWins = allTrades.filter(t => t.result === 'Win').length;

    // Show loading only on initial load
    if (userLoading || (dataLoading && !data)) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="space-y-8">
                    <div className="h-10 skeleton w-1/3" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
                    </div>
                    <div className="h-80 skeleton rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 page-transition">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Welcome back, <span className="text-primary">{profile?.username || 'Trader'}</span>
                        {isFetching && <span className="ml-2 text-xs text-muted-foreground">(syncing...)</span>}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Here's your trading performance overview
                    </p>
                </div>
                <Link
                    href="/journal/new"
                    className="cta-primary flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                >
                    <PlusCircle className="h-4 w-4" />
                    Log Trade
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Gain"
                    value={`${stats?.totalR && stats.totalR > 0 ? '+' : ''}${stats?.totalR ?? 0}R`}
                    valueColor={stats?.totalR && stats.totalR > 0 ? "emerald" : stats?.totalR && stats.totalR < 0 ? "rose" : "white"}
                    trend={{ value: `${stats?.totalTrades ?? 0} trades total`, type: "neutral" }}
                />
                <StatCard
                    title="Win Rate"
                    value={`${stats?.winRate ?? 0}%`}
                    valueColor={stats?.winRate && stats.winRate >= 50 ? "emerald" : "rose"}
                    icon={TrendingUp}
                    trend={{
                        value: stats?.winRate && stats.winRate >= 50 ? "Above 50%" : "Below 50%",
                        type: stats?.winRate && stats.winRate >= 50 ? "up" : "down"
                    }}
                />
                <StatCard
                    title="Avg SOP Score"
                    value={stats?.avgSopScore?.toFixed(1) ?? "-"}
                    valueColor="amber"
                    trend={{ value: stats?.avgSopScore && stats.avgSopScore >= 4 ? "Great execution" : "Room to improve", type: "neutral" }}
                />
                <StatCard
                    title="Today's P&L"
                    value={`${stats?.currentDayR && stats.currentDayR > 0 ? '+' : ''}${stats?.currentDayR ?? 0}R`}
                    valueColor={stats?.currentDayR && stats.currentDayR > 0 ? "emerald" : stats?.currentDayR && stats.currentDayR < 0 ? "rose" : "white"}
                    trend={{ value: new Date().toLocaleDateString('en-US', { weekday: 'long' }), type: "neutral" }}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Equity Curve - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <EquityCurve trades={allTrades} />
                </div>

                {/* Winrate Widget */}
                <WinrateWidget
                    winRate={stats?.winRate ?? 0}
                    totalWins={totalWins}
                    totalTrades={stats?.totalTrades ?? 0}
                />
            </div>

            {/* Calendar & Recent Trades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar Widget */}
                <CalendarWidget
                    monthlyData={calendarData || []}
                    onDateClick={(date, trades) => setSelectedDateTrades(trades)}
                />

                {/* Recent Trades */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Recent Trades</h3>
                        <Link href="/journal" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            View All <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {recentTrades.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground text-sm">No trades logged yet</p>
                            <Link href="/journal/new" className="text-primary text-sm mt-2 inline-block hover:underline">
                                Log your first trade →
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {recentTrades.map((trade) => (
                                <Link
                                    key={trade.id}
                                    href={`/journal/${trade.id}`}
                                    className="table-row-hover flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", getResultColors(trade.result))}>
                                            {getResultIcon(trade.result)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {trade.pair}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">{trade.trade_date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {trade.mentor_score && (
                                            <div className="flex gap-0.5 text-amber-500 text-xs">
                                                {Array.from({ length: trade.mentor_score }).map((_, i) => <span key={i}>★</span>)}
                                            </div>
                                        )}
                                        <span className={cn("font-mono text-sm font-bold", getRRColor(trade.rr))}>
                                            {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Date Trades Modal (if any) */}
            {selectedDateTrades.length > 0 && (
                <div className="rounded-xl border border-primary/30 bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">
                            Trades on {selectedDateTrades[0]?.trade_date}
                        </h3>
                        <button
                            onClick={() => setSelectedDateTrades([])}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Close
                        </button>
                    </div>
                    <div className="space-y-2">
                        {selectedDateTrades.map(trade => (
                            <Link
                                key={trade.id}
                                href={`/journal/${trade.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-6 h-6 rounded border flex items-center justify-center text-xs", getResultColors(trade.result))}>
                                        {trade.result === 'Win' ? '✓' : '✗'}
                                    </div>
                                    <span className="text-sm font-medium">{trade.pair}</span>
                                </div>
                                <span className={cn("font-mono text-sm font-bold", getRRColor(trade.rr))}>
                                    {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
