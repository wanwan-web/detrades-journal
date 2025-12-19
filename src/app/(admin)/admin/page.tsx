"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Lock, Activity, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeamStats, getAllProfiles, getAllTrades } from "@/lib/queries";
import type { TeamStats, Profile, Trade } from "@/lib/types";

interface MemberStatus {
    profile: Profile;
    todayR: number;
    isLocked: boolean;
    lastTrade?: Trade;
    mood?: string;
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
                    const lastTrade = memberTrades[0];

                    return {
                        profile,
                        todayR: Math.round(todayR * 10) / 10,
                        isLocked: todayR <= -2,
                        lastTrade,
                        mood: lastTrade?.mood,
                    };
                });

            setMembers(memberStatuses);
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading) {
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

    const getMoodEmoji = (mood?: string) => {
        switch (mood) {
            case 'Calm': return '🙂';
            case 'Anxious': return '😰';
            case 'Greedy': return '🤑';
            case 'Fear': return '😨';
            case 'Bored': return '😑';
            case 'Revenge': return '😡';
            default: return '-';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Team Overview (God View)</h1>
                    <p className="text-sm text-zinc-400">
                        Monitoring <span className="text-white font-bold">{teamStats?.totalMembers || 0} Active Traders</span> today.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-zinc-300">Live Monitoring</span>
                    </div>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Team PnL (Today)</p>
                    <div className="mt-2">
                        <span className={cn(
                            "font-mono text-3xl font-bold",
                            (teamStats?.teamTotalR ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {(teamStats?.teamTotalR ?? 0) >= 0 ? "+" : ""}{teamStats?.teamTotalR ?? 0}R
                        </span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Win Rate (Today)</p>
                    <div className="mt-2">
                        <span className="font-mono text-3xl font-bold text-white">{teamStats?.teamWinRate ?? 0}%</span>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Breached Risk (-2R)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-rose-500">{teamStats?.lockedMembers ?? 0}</span>
                        <span className="text-xs text-zinc-500">Members</span>
                    </div>
                    {(teamStats?.lockedMembers ?? 0) > 0 && (
                        <AlertTriangle className="absolute top-4 right-4 h-5 w-5 text-rose-500 animate-pulse" />
                    )}
                </div>
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Pending Reviews</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-amber-500">{teamStats?.pendingReviews ?? 0}</span>
                        <span className="text-xs text-zinc-500">Trades</span>
                    </div>
                    {(teamStats?.pendingReviews ?? 0) > 0 && (
                        <Link href="/admin/review" className="absolute top-4 right-4 text-xs text-indigo-400 hover:underline">
                            Review →
                        </Link>
                    )}
                </div>
            </div>

            {/* Member Health Monitor */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-amber-500" />
                        Live Member Status
                    </h3>
                    <span className="text-xs text-zinc-500">{members.length} members</span>
                </div>

                {members.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-zinc-500">No active members</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Daily PnL</th>
                                <th className="px-6 py-3 text-center">Last Trade</th>
                                <th className="px-6 py-3 text-center">Mental State</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                            {members.map((member) => (
                                <tr
                                    key={member.profile.id}
                                    className={cn(
                                        "transition-colors",
                                        member.isLocked ? "bg-rose-950/10 hover:bg-rose-950/20" : "hover:bg-zinc-900/50"
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                member.isLocked ? "bg-rose-500" : member.todayR !== 0 ? "bg-emerald-500" : "bg-zinc-600"
                                            )} />
                                            <span className="font-bold text-white">{member.profile.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {member.isLocked ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white border border-rose-600 inline-flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> LOCKED
                                            </span>
                                        ) : member.todayR !== 0 ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                TRADING
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                IDLE
                                            </span>
                                        )}
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-mono font-bold",
                                        member.todayR > 0 ? "text-emerald-500" : member.todayR < 0 ? "text-rose-500" : "text-zinc-500"
                                    )}>
                                        {member.todayR > 0 ? "+" : ""}{member.todayR}R
                                    </td>
                                    <td className="px-6 py-4 text-center text-zinc-400 text-xs">
                                        {member.lastTrade ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {member.lastTrade.trade_date}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">No trades</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "text-xs",
                                            member.mood === 'Revenge' || member.mood === 'Fear' ? "text-rose-400" : ""
                                        )}>
                                            {getMoodEmoji(member.mood)} {member.mood || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {member.lastTrade ? (
                                            <Link
                                                href={`/journal/${member.lastTrade.id}`}
                                                className="text-zinc-500 hover:text-indigo-400 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="text-zinc-700">-</span>
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
