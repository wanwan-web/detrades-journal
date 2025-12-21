import { createClient } from './supabase';
import type { Trade, Profile, TradeWithProfile, UserStats, TeamStats, TradeFormInput, DailyPnL } from './types';

// =====================================================
// USER & PROFILE QUERIES
// =====================================================

export async function getCurrentUser() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
}

export async function getAllProfiles(): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) return [];
    return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    return !error;
}

// =====================================================
// TRADE QUERIES
// =====================================================

export async function getUserTrades(userId: string, limit?: number): Promise<Trade[]> {
    const supabase = createClient();
    let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) return [];
    return data;
}

export async function getAllTrades(limit?: number): Promise<TradeWithProfile[]> {
    const supabase = createClient();
    let query = supabase
        .from('trades')
        .select(`*, profiles:user_id(username, full_name, avatar_url)`)
        .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) return [];
    return data;
}

export async function getTradeById(tradeId: string): Promise<TradeWithProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('trades')
        .select(`*, profiles:user_id(username, full_name, avatar_url)`)
        .eq('id', tradeId)
        .single();

    if (error) return null;
    return data;
}

export async function getPendingReviews(): Promise<TradeWithProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('trades')
        .select(`*, profiles:user_id(username, full_name, avatar_url)`)
        .in('status', ['submitted', 'needs_improvement'])
        .order('created_at', { ascending: true });

    if (error) return [];
    return data;
}

export async function createTrade(input: TradeFormInput & { user_id: string; screenshot_url?: string }): Promise<Trade | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('trades')
        .insert({
            user_id: input.user_id,
            trade_date: input.trade_date,
            pair: input.pair,
            result: input.result,
            rr: input.rr,
            profiling: input.profiling || null,
            description: input.description || null,
            screenshot_url: input.screenshot_url || null,
            status: 'submitted',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating trade:', error);
        return null;
    }
    return data;
}

export async function updateTrade(tradeId: string, updates: Partial<Trade>): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', tradeId);

    return !error;
}

export async function deleteTrade(tradeId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

    return !error;
}

export async function reviewTrade(
    tradeId: string,
    reviewerId: string,
    score: number,
    feedback: string,
    status: 'reviewed' | 'needs_improvement' = 'reviewed'
): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('trades')
        .update({
            mentor_score: score,
            mentor_feedback: feedback,
            status,
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

    return !error;
}

// =====================================================
// STATS QUERIES
// =====================================================

export async function getUserStats(userId: string): Promise<UserStats> {
    const supabase = createClient();
    const { data: trades } = await supabase
        .from('trades')
        .select('rr, result, mentor_score')
        .eq('user_id', userId);

    if (!trades || trades.length === 0) {
        return {
            totalTrades: 0,
            totalR: 0,
            winRate: 0,
            avgSopScore: 0,
            winStreak: 0,
            currentDayR: 0,
        };
    }

    const wins = trades.filter((t: { result: string }) => t.result === 'Win').length;
    const totalR = trades.reduce((sum: number, t: { rr: number }) => sum + (t.rr || 0), 0);
    const scoredTrades = trades.filter((t: { mentor_score: number | null }) => t.mentor_score !== null);
    const avgSop = scoredTrades.length > 0
        ? scoredTrades.reduce((sum: number, t: { mentor_score: number | null }) => sum + (t.mentor_score || 0), 0) / scoredTrades.length
        : 0;

    // Calculate today's R
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTrades } = await supabase
        .from('trades')
        .select('rr')
        .eq('user_id', userId)
        .eq('trade_date', today);

    const currentDayR = todayTrades?.reduce((sum: number, t: { rr: number }) => sum + (t.rr || 0), 0) ?? 0;

    return {
        totalTrades: trades.length,
        totalR: Math.round(totalR * 100) / 100,
        winRate: Math.round((wins / trades.length) * 100),
        avgSopScore: Math.round(avgSop * 10) / 10,
        winStreak: 0, // TODO: calculate properly
        currentDayR: Math.round(currentDayR * 100) / 100,
    };
}

export async function getTeamStats(): Promise<TeamStats> {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // Get all active members
    const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

    // Get today's trades
    const { data: todayTrades } = await supabase
        .from('trades')
        .select('user_id, rr, result')
        .eq('trade_date', today);

    // Get pending reviews
    const { data: pending } = await supabase
        .from('trades')
        .select('id')
        .in('status', ['submitted', 'needs_improvement']);

    const teamTotalR = todayTrades?.reduce((sum: number, t: { rr: number }) => sum + (t.rr || 0), 0) ?? 0;
    const wins = todayTrades?.filter((t: { result: string }) => t.result === 'Win').length ?? 0;
    const activeUsers = new Set(todayTrades?.map((t: { user_id: string }) => t.user_id) ?? []);

    return {
        totalMembers: members?.length ?? 0,
        activeToday: activeUsers.size,
        teamTotalR: Math.round(teamTotalR * 10) / 10,
        teamWinRate: todayTrades?.length ? Math.round((wins / todayTrades.length) * 100) : 0,
        pendingReviews: pending?.length ?? 0,
    };
}

// =====================================================
// CALENDAR QUERIES
// =====================================================

export async function getMonthlyPnL(userId: string, year: number, month: number): Promise<DailyPnL[]> {
    const supabase = createClient();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data: trades } = await supabase
        .from('trades')
        .select('trade_date, rr, result')
        .eq('user_id', userId)
        .gte('trade_date', startDate)
        .lte('trade_date', endDate)
        .order('trade_date', { ascending: true });

    if (!trades) return [];

    // Group by date
    const grouped = trades.reduce((acc: Record<string, DailyPnL>, trade: { trade_date: string; rr: number; result: string }) => {
        const date = trade.trade_date;
        if (!acc[date]) {
            acc[date] = { date, totalR: 0, trades: 0, wins: 0, losses: 0 };
        }
        acc[date].totalR += trade.rr;
        acc[date].trades += 1;
        if (trade.result === 'Win') acc[date].wins += 1;
        else acc[date].losses += 1;
        return acc;
    }, {});

    return Object.values(grouped);
}

export async function getTradesByDate(userId: string, date: string): Promise<Trade[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .eq('trade_date', date)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data;
}

// =====================================================
// IMAGE UPLOAD
// =====================================================

export async function uploadTradeImage(file: File, userId: string): Promise<string | null> {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, file);

    if (error) {
        console.error('Error uploading image:', error);
        return null;
    }

    const { data } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(fileName);

    return data.publicUrl;
}

// =====================================================
// LEADERBOARD & ANALYTICS
// =====================================================

export async function getLeaderboard(): Promise<(Profile & { totalR: number; trades: number; winRate: number })[]> {
    const supabase = createClient();

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'member');

    if (!profiles) return [];

    const leaderboard = await Promise.all(profiles.map(async (profile: Profile) => {
        const { data: trades } = await supabase
            .from('trades')
            .select('rr, result')
            .eq('user_id', profile.id);

        const totalR = trades?.reduce((sum: number, t: { rr: number }) => sum + (t.rr || 0), 0) ?? 0;
        const wins = trades?.filter((t: { result: string }) => t.result === 'Win').length ?? 0;
        const winRate = trades?.length ? Math.round((wins / trades.length) * 100) : 0;

        return {
            ...profile,
            totalR: Math.round(totalR * 10) / 10,
            trades: trades?.length ?? 0,
            winRate,
        };
    }));

    return leaderboard.sort((a, b) => b.totalR - a.totalR);
}

export async function getProfilingStats(userId?: string) {
    const supabase = createClient();
    let query = supabase.from('trades').select('profiling, rr, result');
    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    if (!data) return [];

    type ProfilingTrade = { profiling: string; rr: number; result: string };
    const grouped = data.reduce((acc: Record<string, ProfilingTrade[]>, t: ProfilingTrade) => {
        const prof = t.profiling || 'Unspecified';
        if (!acc[prof]) acc[prof] = [];
        acc[prof].push(t);
        return acc;
    }, {} as Record<string, ProfilingTrade[]>);

    return (Object.entries(grouped) as [string, ProfilingTrade[]][]).map(([profiling, trades]) => ({
        profiling,
        count: trades.length,
        totalR: Math.round(trades.reduce((sum, t) => sum + (t.rr || 0), 0) * 10) / 10,
        winRate: Math.round((trades.filter((t) => t.result === 'Win').length / trades.length) * 100),
    }));
}
