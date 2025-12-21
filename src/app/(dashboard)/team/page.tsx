"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, BookOpen, Crown, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaderboard, getAllTrades } from "@/lib/queries";
import type { Profile, TradeWithProfile } from "@/lib/types";

type LeaderboardEntry = Profile & { totalR: number; trades: number; winRate: number };

export default function TeamHubPage() {
    const [activeTab, setActiveTab] = useState<"leaderboard" | "playbook">("leaderboard");
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [bestTrades, setBestTrades] = useState<TradeWithProfile[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Initial load - Team Hub doesn't need user context
    useEffect(() => {
        if (dataLoaded) return;

        let cancelled = false;

        Promise.all([
            getLeaderboard(),
            getAllTrades(20),
        ])
            .then(([leaders, trades]) => {
                if (!cancelled) {
                    setLeaderboard(leaders);
                    setBestTrades(trades.filter(t => t.result === 'Win' && t.mentor_score && t.mentor_score >= 4).slice(0, 9));
                    setDataLoaded(true);
                }
            })
            .catch((error) => {
                console.error('Error loading team data:', error);
                if (!cancelled) setDataLoaded(true);
            });

        return () => { cancelled = true; };
    }, [dataLoaded]);

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    if (!dataLoaded) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="h-64 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Team Hub</h1>
                    <p className="text-sm text-zinc-400">Compete with excellence, learn from the best.</p>
                </div>
                <div className="bg-zinc-900 p-1 rounded-lg border border-zinc-800 flex">
                    <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === "leaderboard" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <Trophy className="h-4 w-4" />Leaderboard
                    </button>
                    <button
                        onClick={() => setActiveTab("playbook")}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === "playbook" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <BookOpen className="h-4 w-4" />Playbook
                    </button>
                </div>
            </div>

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
                <div className="space-y-8">
                    {/* Empty State */}
                    {leaderboard.length === 0 ? (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                            <Trophy className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-400 text-sm mb-2">No leaderboard data yet</p>
                            <p className="text-zinc-500 text-xs">Start trading to appear on the leaderboard.</p>
                        </div>
                    ) : (
                        <>
                            {/* Podium */}
                            {top3.length >= 3 && (
                                <div className="grid grid-cols-3 gap-6 items-end mb-12">
                                    {/* 2nd Place */}
                                    <div className="flex flex-col items-center order-1">
                                        <div className="mb-4 text-center">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-400 to-zinc-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                                                {top3[1].username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className="block font-bold text-white text-lg">{top3[1].username}</span>
                                            <span className={cn("text-xs font-mono", top3[1].totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {top3[1].totalR >= 0 ? "+" : ""}{top3[1].totalR}R
                                            </span>
                                        </div>
                                        <div className="w-full h-24 bg-zinc-900 border-t-4 border-zinc-400 rounded-t-lg flex items-start justify-center pt-4 relative">
                                            <div className="absolute -top-6 w-10 h-10 rounded-full border-4 border-zinc-950 bg-zinc-400 flex items-center justify-center text-zinc-900 font-bold">
                                                2
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1st Place */}
                                    <div className="flex flex-col items-center order-2">
                                        <div className="mb-4 text-center">
                                            <Crown className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">
                                                {top3[0].username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className="block font-bold text-white text-xl">{top3[0].username}</span>
                                            <span className={cn("text-sm font-mono font-bold", top3[0].totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {top3[0].totalR >= 0 ? "+" : ""}{top3[0].totalR}R
                                            </span>
                                        </div>
                                        <div className="w-full h-36 bg-gradient-to-t from-zinc-900 to-zinc-800 border-t-4 border-amber-500 rounded-t-lg flex items-start justify-center pt-6 relative shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                            <div className="absolute -top-8 w-14 h-14 rounded-full border-4 border-zinc-950 bg-amber-500 flex items-center justify-center text-zinc-900 font-bold text-xl">
                                                1
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3rd Place */}
                                    <div className="flex flex-col items-center order-3">
                                        <div className="mb-4 text-center">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-orange-700 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                                                {top3[2].username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className="block font-bold text-white text-lg">{top3[2].username}</span>
                                            <span className={cn("text-xs font-mono", top3[2].totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {top3[2].totalR >= 0 ? "+" : ""}{top3[2].totalR}R
                                            </span>
                                        </div>
                                        <div className="w-full h-16 bg-zinc-900 border-t-4 border-orange-700 rounded-t-lg flex items-start justify-center pt-3 relative">
                                            <div className="absolute -top-5 w-8 h-8 rounded-full border-4 border-zinc-950 bg-orange-700 flex items-center justify-center text-white font-bold text-sm">
                                                3
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Full Rankings Table */}
                            {rest.length > 0 && (
                                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                                    <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                                        <h3 className="text-sm font-semibold text-white">Full Rankings</h3>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-3 w-16">Rank</th>
                                                <th className="px-6 py-3">Member</th>
                                                <th className="px-6 py-3 text-right">Trades</th>
                                                <th className="px-6 py-3 text-right">Win Rate</th>
                                                <th className="px-6 py-3 text-right">Total Gain</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                                            {rest.map((member, i) => (
                                                <tr key={member.id} className="hover:bg-zinc-900/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-zinc-500">{i + 4}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {member.username?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-bold text-white">{member.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-zinc-400">{member.trades}</td>
                                                    <td className="px-6 py-4 text-right text-zinc-400">{member.winRate}%</td>
                                                    <td className={cn("px-6 py-4 text-right font-mono font-bold", member.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                        {member.totalR >= 0 ? "+" : ""}{member.totalR}R
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Playbook Tab */}
            {activeTab === "playbook" && (
                <div className="space-y-6">
                    {bestTrades.length === 0 ? (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                            <BookOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-400 text-sm mb-2">No playbook entries yet</p>
                            <p className="text-zinc-500 text-xs">High-scoring reviewed trades will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bestTrades.map((trade) => (
                                <Link
                                    key={trade.id}
                                    href={`/journal/${trade.id}`}
                                    className="group rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
                                >
                                    <div className="h-40 bg-zinc-800 relative overflow-hidden">
                                        {trade.screenshot_url ? (
                                            <img src={trade.screenshot_url} alt="Trade" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                                <BookOpen className="h-8 w-8 text-zinc-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] text-emerald-400 border border-emerald-500/20">
                                            +{trade.rr}R
                                        </div>
                                        {trade.mentor_score && (
                                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded flex items-center gap-1">
                                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                <span className="text-[10px] text-amber-500">{trade.mentor_score}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{trade.pair} - {trade.profiling}</h4>
                                                <p className="text-xs text-zinc-500">by @{trade.profiles?.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <span className="px-1.5 py-0.5 rounded border border-zinc-700 text-[10px] text-zinc-400">{trade.trade_date}</span>
                                            {trade.profiling && <span className="px-1.5 py-0.5 rounded border border-zinc-700 text-[10px] text-zinc-400">{trade.profiling}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
