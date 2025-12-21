"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { getUserTrades } from "@/lib/queries";
import type { Trade } from "@/lib/types";

export default function JournalPage() {
    const { user, isLoading: userLoading } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [resultFilter, setResultFilter] = useState("all");
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);

    const { data: trades = [], isLoading: tradesLoading } = useQuery({
        queryKey: ['user-trades', user?.id],
        queryFn: () => getUserTrades(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });

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

        if (resultFilter !== "all") {
            result = result.filter(t => t.result === resultFilter);
        }

        setFilteredTrades(result);
    }, [trades, searchQuery, resultFilter]);

    // Stats calculation
    const stats = {
        total: trades.length,
        wins: trades.filter(t => t.result === 'Win').length,
        losses: trades.filter(t => t.result === 'Lose').length,
        totalR: trades.reduce((sum, t) => sum + t.rr, 0),
    };

    const isLoading = userLoading || tradesLoading;

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="space-y-6">
                    <div className="h-10 skeleton w-1/3 rounded" />
                    <div className="h-12 skeleton rounded" />
                    <div className="h-96 skeleton rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 page-transition">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Trade Journal</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {stats.total} trades • <span className="text-emerald-500">{stats.wins}W</span> / <span className="text-rose-500">{stats.losses}L</span> • <span className={cn("font-mono", stats.totalR >= 0 ? "text-emerald-500" : "text-rose-500")}>{stats.totalR >= 0 ? '+' : ''}{stats.totalR.toFixed(1)}R</span>
                    </p>
                </div>
                <Link href="/journal/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cta-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Log Trade
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by pair or notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-border"
                        />
                    </div>
                </div>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                    <SelectTrigger className="w-[140px] bg-background border-border">
                        <SelectValue placeholder="Result" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Results</SelectItem>
                        <SelectItem value="Win">Wins Only</SelectItem>
                        <SelectItem value="Lose">Losses Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Trades List */}
            {filteredTrades.length === 0 ? (
                <div className="text-center py-16 border border-border rounded-xl bg-card">
                    <p className="text-muted-foreground text-sm">No trades found</p>
                    <Link href="/journal/new" className="text-primary text-sm mt-2 inline-block hover:underline">
                        Log your first trade →
                    </Link>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-1">Result</div>
                        <div className="col-span-2">Pair</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">R Value</div>
                        <div className="col-span-2">Score</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border/50">
                        {filteredTrades.map((trade) => (
                            <Link
                                key={trade.id}
                                href={`/journal/${trade.id}`}
                                className="grid grid-cols-12 gap-4 px-5 py-4 items-center table-row-hover hover:bg-muted/30 transition-colors"
                            >
                                {/* Result */}
                                <div className="col-span-1">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg border flex items-center justify-center",
                                        trade.result === 'Win'
                                            ? "bg-emerald-500/10 border-emerald-500/30"
                                            : "bg-rose-500/10 border-rose-500/30"
                                    )}>
                                        {trade.result === 'Win'
                                            ? <Check className="h-4 w-4 text-emerald-500" />
                                            : <X className="h-4 w-4 text-rose-500" />
                                        }
                                    </div>
                                </div>

                                {/* Pair */}
                                <div className="col-span-2">
                                    <span className="font-mono font-medium text-foreground">{trade.pair}</span>
                                </div>

                                {/* Date */}
                                <div className="col-span-2">
                                    <span className="text-sm text-muted-foreground">{trade.trade_date}</span>
                                </div>

                                {/* R Value */}
                                <div className="col-span-2">
                                    <span className={cn(
                                        "font-mono font-bold text-sm",
                                        trade.rr > 0 ? "text-emerald-500" : trade.rr < 0 ? "text-rose-500" : "text-muted-foreground"
                                    )}>
                                        {trade.rr > 0 ? '+' : ''}{trade.rr.toFixed(2)}R
                                    </span>
                                </div>

                                {/* Score */}
                                <div className="col-span-2">
                                    {trade.mentor_score ? (
                                        <div className="flex items-center gap-1 text-amber-500">
                                            {Array.from({ length: trade.mentor_score }).map((_, i) => (
                                                <Star key={i} className="h-3 w-3 fill-current" />
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="col-span-2">
                                    <span className={cn(
                                        "text-xs px-2.5 py-1 rounded-full font-medium",
                                        trade.status === 'reviewed' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                                        trade.status === 'submitted' && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                                        trade.status === 'needs_improvement' && "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    )}>
                                        {trade.status === 'needs_improvement' ? 'Needs Improvement' :
                                            trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <div className="col-span-1 text-right">
                                    <span className="text-muted-foreground">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
