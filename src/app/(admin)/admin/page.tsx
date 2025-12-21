"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Activity, Clock, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeamStats, getAllProfiles, getAllTrades } from "@/lib/queries";
import type { TeamStats, Profile, Trade } from "@/lib/types";

interface MemberStatus {
    profile: Profile;
    todayR: number;
    totalR: number;
    lastTrade?: Trade;
    tradesCount: number;
}

export default function AdminDashboardPage() {
    const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
    const [members, setMembers] = useState<MemberStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const [stats, profiles, trades] = await Promise.all([
                getTeamStats(),
                getAllProfiles(),
                getAllTrades(50),
            ]);

            setTeamStats(stats);

            // Build member status
            const today = new Date().toISOString().split('T')[0];
            const memberStatuses: MemberStatus[] = profiles
                .filter(p => p.role === 'member' && p.is_active)
                .map(profile => {
                    const memberTrades = trades.filter(t => t.user_id === profile.id);
                    const todayTrades = memberTrades.filter(t => t.trade_date === today);
                    const todayR = todayTrades.reduce((sum, t) => sum + t.rr, 0);
                    const totalR = memberTrades.reduce((sum, t) => sum + t.rr, 0);
                    const lastTrade = memberTrades[0];

                    return {
                        profile,
                        todayR: Math.round(todayR * 10) / 10,
                        totalR: Math.round(totalR * 10) / 10,
                        lastTrade,
                        tradesCount: memberTrades.length,
                    };
                })
                .sort((a, b) => b.totalR - a.totalR); // Sort by total R

            setMembers(memberStatuses);
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="space-y-8">
                    <div className="h-10 skeleton rounded w-1/3" />
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
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Team Overview (God View)</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring <span className="text-foreground font-bold">{teamStats?.totalMembers || 0} Active Traders</span> today.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">Live Monitoring</span>
                    </div>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Team PnL (Today)</p>
                    <div className="mt-2">
                        <span className={cn(
                            "font-mono text-3xl font-bold",
                            (teamStats?.teamTotalR ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {(teamStats?.teamTotalR ?? 0) >= 0 ? "+" : ""}{teamStats?.teamTotalR ?? 0}R
                        </span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Team Win Rate</p>
                    <div className="mt-2">
                        <span className="font-mono text-3xl font-bold text-foreground">{teamStats?.teamWinRate ?? 0}%</span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Today</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-primary">{teamStats?.activeToday ?? 0}</span>
                        <span className="text-xs text-muted-foreground">/ {teamStats?.totalMembers ?? 0}</span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Reviews</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-amber-500">{teamStats?.pendingReviews ?? 0}</span>
                        <span className="text-xs text-muted-foreground">Trades</span>
                    </div>
                    {(teamStats?.pendingReviews ?? 0) > 0 && (
                        <Link href="/admin/review" className="absolute top-4 right-4 text-xs text-primary hover:underline">
                            Review →
                        </Link>
                    )}
                </div>
            </div>

            {/* Member Leaderboard */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Team Leaderboard
                    </h3>
                    <span className="text-xs text-muted-foreground">{members.length} members</span>
                </div>

                {members.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground">No active members</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-muted/30 text-xs uppercase text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Today</th>
                                <th className="px-6 py-3 text-right">Total P&L</th>
                                <th className="px-6 py-3 text-center">Trades</th>
                                <th className="px-6 py-3 text-center">Last Trade</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-sm">
                            {members.map((member, idx) => (
                                <tr
                                    key={member.profile.id}
                                    className="table-row-hover transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "font-mono font-bold",
                                            idx === 0 && "text-amber-500",
                                            idx === 1 && "text-slate-400",
                                            idx === 2 && "text-amber-700"
                                        )}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                idx === 0 ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"
                                            )}>
                                                {member.profile.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className="font-medium text-foreground">{member.profile.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {member.todayR !== 0 ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                TRADING
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                                                IDLE
                                            </span>
                                        )}
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-mono font-bold",
                                        member.todayR > 0 ? "text-emerald-500" : member.todayR < 0 ? "text-rose-500" : "text-muted-foreground"
                                    )}>
                                        {member.todayR > 0 ? "+" : ""}{member.todayR}R
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-mono font-bold",
                                        member.totalR > 0 ? "text-emerald-500" : member.totalR < 0 ? "text-rose-500" : "text-muted-foreground"
                                    )}>
                                        {member.totalR > 0 ? "+" : ""}{member.totalR}R
                                    </td>
                                    <td className="px-6 py-4 text-center text-muted-foreground">
                                        {member.tradesCount}
                                    </td>
                                    <td className="px-6 py-4 text-center text-muted-foreground text-xs">
                                        {member.lastTrade ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {member.lastTrade.trade_date}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/50">No trades</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {member.lastTrade ? (
                                            <Link
                                                href={`/journal/${member.lastTrade.id}`}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground/30">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
