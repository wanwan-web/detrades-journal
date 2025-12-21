import { useQuery } from "@tanstack/react-query";
import { getUserStats, getUserTrades, getSessionStats } from "@/lib/queries";
import type { Trade, UserStats } from "@/lib/types";

interface DashboardData {
    stats: UserStats | null;
    recentTrades: Trade[];
    allTrades: Trade[];
    sessionStats: {
        london: { totalR: number; winRate: number; count: number };
        newYork: { totalR: number; winRate: number; count: number };
    } | null;
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
                    sessionStats: null,
                };
            }

            const [stats, recentTrades, allTrades, sessionStats] = await Promise.all([
                getUserStats(userId),
                getUserTrades(userId, 5),
                getUserTrades(userId),
                getSessionStats(userId),
            ]);

            return {
                stats,
                recentTrades,
                allTrades,
                sessionStats,
            };
        },
        enabled: !!userId,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    });
}
