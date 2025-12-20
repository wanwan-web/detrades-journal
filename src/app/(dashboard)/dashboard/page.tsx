"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, PlusCircle, Check, X, Minus, ArrowRight, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RiskGuard } from "@/components/dashboard/RiskGuard";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { useUser } from "@/hooks/useUser";
import { getUserStats, getUserTrades, getSessionStats } from "@/lib/queries";
import { isMarketOpen } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Trade, UserStats } from "@/lib/types";

export default function DashboardPage() {
    const { user, profile, isLoading: userLoading } = useUser();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [allTrades, setAllTrades] = useState<Trade[]>([]);
    const [sessionStats, setSessionStats] = useState<{ london: { totalR: number; winRate: number; count: number }; newYork: { totalR: number; winRate: number; count: number } } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const market = isMarketOpen();

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const [userStats, recent, all, sessions] = await Promise.all([
                    getUserStats(user.id),
                    getUserTrades(user.id, 5),
                    getUserTrades(user.id),
                    getSessionStats(user.id),
                ]);

                if (isMounted) {
                    setStats(userStats);
                    setRecentTrades(recent);
                    setAllTrades(all);
                    setSessionStats(sessions);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                // Set empty defaults on error
                if (isMounted) {
                    setStats(null);
                    setRecentTrades([]);
                    setAllTrades([]);
                    setSessionStats(null);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        if (!userLoading) loadData();

        return () => { isMounted = false; };
    }, [user, userLoading]);

    const getResultIcon = (r: "Win" | "Lose" | "BE") => {
        if (r === "Win") return <Check className="h-4 w-4 text-emerald-500" />;
        if (r === "Lose") return <X className="h-4 w-4 text-rose-500" />;
        return <Minus className="h-4 w-4 text-amber-500" />;
    };

    const getResultColors = (r: "Win" | "Lose" | "BE") => {
        if (r === "Win") return "bg-emerald-500/10 border-emerald-500/20";
        if (r === "Lose") return "bg-rose-500/10 border-rose-500/20";
        return "bg-amber-500/10 border-amber-500/20";
    };

    const getRRColor = (rr: number) => {
        if (rr > 0) return "text-emerald-500";
        if (rr < 0) return "text-rose-500";
        return "text-zinc-400";
    };

    if (userLoading || isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-zinc-800 rounded-xl" />)}
                    </div>
                    <div className="h-80 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Welcome back, <span className="text-indigo-400">{profile?.username || 'Trader'}</span>
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Market is <span className={cn("font-medium", market.isOpen ? "text-emerald-500" : "text-zinc-500")}>
                            {market.isOpen ? "OPEN" : "CLOSED"}
                        </span>
                        {market.session && `. ${market.session} Session.`}
                    </p>
                </div>
                <Link
                    href="/journal/new"
                    className={cn(
                        "cta-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all border border-indigo-500",
                        stats?.isLocked && "opacity-50 pointer-events-none"
                    )}
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
                    valueColor="white"
                    trend={{
                        value: stats?.winRate && stats.winRate >= 50 ? "Above 50%" : "Below 50%",
                        type: stats?.winRate && stats.winRate >= 50 ? "up" : "down"
                    }}
                />
                <StatCard
                    title="Avg SOP Score"
                    value={stats?.avgSopScore?.toFixed(1) ?? "-"}
                    valueColor="amber"
                    icon={Star}
                    trend={{ value: stats?.avgSopScore && stats.avgSopScore >= 4 ? "Great execution" : "Room to improve", type: "neutral" }}
                />
                <StatCard
                    title="Today's P&L"
                    value={`${stats?.currentDayR && stats.currentDayR > 0 ? '+' : ''}${stats?.currentDayR ?? 0}R`}
                    valueColor={stats?.currentDayR && stats.currentDayR > 0 ? "emerald" : stats?.currentDayR && stats.currentDayR < 0 ? "rose" : "white"}
                    icon={Activity}
                    trend={{ value: stats?.isLocked ? "LOCKED" : "Trading active", type: stats?.isLocked ? "down" : "neutral" }}
                />
            </div>

            {/* Equity Curve & Risk Guard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <EquityCurve trades={allTrades} />
                <RiskGuard />
            </div>

            {/* Recent Trades */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                        Recent Trades
                    </h3>
                    <Link href="/journal" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                {recentTrades.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-zinc-500 text-sm">No trades logged yet</p>
                        <Link href="/journal/new" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">
                            Log your first trade →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {recentTrades.map((trade) => (
                            <Link
                                key={trade.id}
                                href={`/journal/${trade.id}`}
                                className="table-row-hover flex items-center justify-between px-5 py-3 hover:bg-zinc-900/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", getResultColors(trade.result))}>
                                        {getResultIcon(trade.result)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {trade.pair} <span className="text-zinc-500 font-normal">• {trade.session}</span>
                                        </p>
                                        <p className="text-[10px] text-zinc-500">{trade.trade_date}</p>
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

            {/* Session Performance */}
            {sessionStats && (sessionStats.london.count > 0 || sessionStats.newYork.count > 0) && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all" />
                        <div className="relative">
                            <p className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">London Session</p>
                            <div className="flex items-end gap-2 mt-2">
                                <p className="text-2xl font-mono text-white">{sessionStats.london.winRate}%</p>
                                <span className="text-xs text-zinc-500 mb-1">Winrate • {sessionStats.london.count} trades</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full transition-all" style={{ width: `${sessionStats.london.winRate}%` }} />
                            </div>
                            <p className={cn("text-xs font-mono mt-2", sessionStats.london.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {sessionStats.london.totalR >= 0 ? "+" : ""}{sessionStats.london.totalR}R
                            </p>
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />
                        <div className="relative">
                            <p className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">New York Session</p>
                            <div className="flex items-end gap-2 mt-2">
                                <p className="text-2xl font-mono text-white">{sessionStats.newYork.winRate}%</p>
                                <span className="text-xs text-zinc-500 mb-1">Winrate • {sessionStats.newYork.count} trades</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full transition-all" style={{ width: `${sessionStats.newYork.winRate}%` }} />
                            </div>
                            <p className={cn("text-xs font-mono mt-2", sessionStats.newYork.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {sessionStats.newYork.totalR >= 0 ? "+" : ""}{sessionStats.newYork.totalR}R
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
