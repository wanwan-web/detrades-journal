import { useQuery } from "@tanstack/react-query";
import { getUserStats, getUserTrades, getMonthlyPnL, getTradesByDate } from "@/lib/queries";
import type { Trade, UserStats, DailyPnL } from "@/lib/types";

interface DashboardData {
    stats: UserStats | null;
    recentTrades: Trade[];
    allTrades: Trade[];
}

export function useDashboardData(userId: string | undefined) {
    return useQuery<DashboardData>({
        queryKey: ['dashboard', userId],
        queryFn: async () => {
            if (!userId) {
                return {
                    stats: null,
                    recentTrades: [],
                    allTrades: [],
                };
            }

            const [stats, recentTrades, allTrades] = await Promise.all([
                getUserStats(userId),
                getUserTrades(userId, 5),
                getUserTrades(userId),
            ]);

            return {
                stats,
                recentTrades,
                allTrades,
            };
        },
        enabled: !!userId,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
}

export function useCalendarData(userId: string | undefined, year: number, month: number) {
    return useQuery<DailyPnL[]>({
        queryKey: ['calendar', userId, year, month],
        queryFn: async () => {
            if (!userId) return [];
            return getMonthlyPnL(userId, year, month);
        },
        enabled: !!userId,
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useTradesByDate(userId: string | undefined, date: string | null) {
    return useQuery<Trade[]>({
        queryKey: ['trades-by-date', userId, date],
        queryFn: async () => {
            if (!userId || !date) return [];
            return getTradesByDate(userId, date);
        },
        enabled: !!userId && !!date,
        staleTime: 30 * 1000,
    });
}
