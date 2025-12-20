"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Download, Search, ListIcon, Grid2X2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { getUserTrades } from "@/lib/queries";
import type { Trade } from "@/lib/types";

export default function JournalPage() {
    const { user, isLoading: userLoading } = useUser();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sessionFilter, setSessionFilter] = useState("all");
    const [resultFilter, setResultFilter] = useState("all");

    const userIdRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);

    // Initial load
    useEffect(() => {
        if (userLoading || !user) return;
        if (userIdRef.current === user.id) return;

        userIdRef.current = user.id;
        isFetchingRef.current = true;

        getUserTrades(user.id)
            .then((data) => {
                setTrades(data);
                setFilteredTrades(data);
            })
            .catch((error) => {
                console.error('Error loading trades:', error);
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
            getUserTrades(userIdRef.current)
                .then((data) => {
                    setTrades(data);
                    setFilteredTrades(data);
                })
                .catch((error) => {
                    console.error('Error refetching trades:', error);
                })
                .finally(() => {
                    isFetchingRef.current = false;
                });
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...trades];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.pair.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        if (sessionFilter !== "all") {
            result = result.filter(t => t.session === sessionFilter);
        }

        if (resultFilter !== "all") {
            result = result.filter(t => t.result === resultFilter);
        }

        setFilteredTrades(result);
    }, [trades, searchQuery, sessionFilter, resultFilter]);

    const getResultStyles = (r: "Win" | "Lose" | "BE") => {
        if (r === "Win") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        if (r === "Lose") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    };

    const getRRColor = (rr: number) => {
        if (rr > 0) return "text-emerald-500";
        if (rr < 0) return "text-rose-500";
        return "text-zinc-400";
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSessionFilter("all");
        setResultFilter("all");
    };

    const hasFilters = searchQuery || sessionFilter !== "all" || resultFilter !== "all";

    // Stats summary
    const stats = {
        total: trades.length,
        wins: trades.filter(t => t.result === 'Win').length,
        losses: trades.filter(t => t.result === 'Lose').length,
        be: trades.filter(t => t.result === 'BE').length,
        totalR: trades.reduce((sum, t) => sum + t.rr, 0),
    };

    if (userLoading || isFirstLoad) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="h-12 bg-zinc-800 rounded" />
                    <div className="h-96 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Trade Journal</h1>
                    <p className="text-sm text-zinc-400">
                        {trades.length > 0
                            ? `${stats.total} trades • ${stats.wins}W / ${stats.losses}L / ${stats.be}BE • Total: ${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`
                            : "No trades logged yet"
                        }
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white">
                        <Download className="h-4 w-4 mr-2" />Export CSV
                    </Button>
                    <Link href="/journal/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Plus className="h-4 w-4 mr-2" />New Trade
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 p-1 overflow-x-auto flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        type="text"
                        placeholder="Search pair or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 pl-9 pr-4 placeholder-zinc-600 focus:border-indigo-500"
                    />
                </div>
                <Select value={sessionFilter} onValueChange={setSessionFilter}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 w-40">
                        <Calendar className="h-4 w-4 mr-2 text-zinc-500" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        <SelectItem value="London">London</SelectItem>
                        <SelectItem value="New York">New York</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 w-40">
                        <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Results</SelectItem>
                        <SelectItem value="Win">Win</SelectItem>
                        <SelectItem value="Lose">Loss</SelectItem>
                        <SelectItem value="BE">BE</SelectItem>
                    </SelectContent>
                </Select>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-500 hover:text-white">
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            {trades.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                        <ListIcon className="h-6 w-6 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 text-sm mb-2">No trades logged yet</p>
                    <p className="text-zinc-500 text-xs mb-4">Start building your trading journal by logging your first trade.</p>
                    <Link href="/journal/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                            <Plus className="h-4 w-4 mr-2" />Log First Trade
                        </Button>
                    </Link>
                </div>
            ) : filteredTrades.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
                    <p className="text-zinc-400 text-sm">No trades match your filters</p>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-indigo-400">
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                                <th className="px-6 py-4 w-32">Date</th>
                                <th className="px-6 py-4">Session & Pair</th>
                                <th className="px-6 py-4">Execution Logic</th>
                                <th className="px-6 py-4 text-center">Result</th>
                                <th className="px-6 py-4 text-right">R Value</th>
                                <th className="px-6 py-4 text-center">SOP Score</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-zinc-800/50">
                            {filteredTrades.map((trade) => (
                                <tr key={trade.id} className="group hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                        {trade.trade_date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 rounded border border-zinc-700 text-[10px] font-bold text-zinc-400">
                                                {trade.session === 'London' ? 'LDN' : 'NY'}
                                            </span>
                                            <span className="font-bold text-white">{trade.pair}</span>
                                            <span className={cn("text-xs", trade.bias === 'Bullish' ? 'text-emerald-500' : 'text-rose-500')}>
                                                {trade.bias}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-white text-xs">{trade.profiling}</p>
                                        <p className="text-zinc-500 text-[10px]">{trade.entry_model}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", getResultStyles(trade.result))}>
                                            {trade.result.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={cn("px-6 py-4 text-right font-mono font-bold", getRRColor(trade.rr))}>
                                        {trade.rr > 0 ? "+" : ""}{trade.rr.toFixed(2)}R
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {trade.mentor_score ? (
                                            <div className="flex justify-center gap-0.5 text-amber-500 text-xs">
                                                {Array.from({ length: trade.mentor_score }).map((_, i) => <span key={i}>★</span>)}
                                                {Array.from({ length: 5 - trade.mentor_score }).map((_, i) => <span key={i} className="text-zinc-700">★</span>)}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-zinc-600">Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded border",
                                            trade.status === 'reviewed' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" :
                                                trade.status === 'revision' ? "text-amber-500 border-amber-500/20 bg-amber-500/10" :
                                                    "text-zinc-500 border-zinc-700 bg-zinc-800"
                                        )}>
                                            {trade.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/journal/${trade.id}`} className="text-zinc-500 hover:text-indigo-400 transition-colors text-lg">
                                            →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination info */}
            {filteredTrades.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-zinc-500">
                        Showing {filteredTrades.length} of {trades.length} trades
                    </p>
                </div>
            )}
        </div>
    );
}
