import { createClient } from './supabase';
import type { Trade, Profile, DailyRisk, TradeWithProfile, UserStats, TeamStats, TradeFormInput } from './types';

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
        .eq('status', 'submitted')
        .order('created_at', { ascending: true });

    if (error) return [];
    return data;
}

export async function createTrade(input: TradeFormInput & { user_id: string; image_url?: string }): Promise<Trade | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('trades')
        .insert({
            user_id: input.user_id,
            trade_date: input.trade_date,
            session: input.session,
            pair: input.pair,
            bias: input.bias,
            bias_daily: input.bias_daily,
            framework: input.framework,
            profiling: input.profiling,
            entry_model: input.entry_model,
            result: input.result,
            rr: input.rr,
            mood: input.mood,
            description: input.description,
            image_url: input.image_url,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating trade:', error);
        return null;
    }
    return data;
}

export async function reviewTrade(
    tradeId: string,
    reviewerId: string,
    score: number,
    notes: string,
    status: 'reviewed' | 'revision' = 'reviewed'
): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('trades')
        .update({
            mentor_score: score,
            mentor_notes: notes,
            status,
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

    return !error;
}

// =====================================================
// DAILY RISK QUERIES
// =====================================================

export async function getDailyRisk(userId: string, date: string): Promise<DailyRisk | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('daily_risk')
        .select('*')
        .eq('user_id', userId)
        .eq('trade_date', date)
        .single();

    if (error) return null;
    return data;
}

export async function getTodayRisk(userId: string): Promise<{ totalR: number; isLocked: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    const risk = await getDailyRisk(userId, today);

    return {
        totalR: risk?.total_rr ?? 0,
        isLocked: risk?.is_locked ?? false,
    };
}

// =====================================================
// STATS QUERIES
// =====================================================

export async function getUserStats(userId: string): Promise<UserStats> {
    const supabase = createClient();

    // Get all trades for user
    const { data: trades } = await supabase
        .from('trades')
        .select('result, rr, mentor_score')
        .eq('user_id', userId);

    // Get today's risk
    const todayRisk = await getTodayRisk(userId);

    if (!trades || trades.length === 0) {
        return {
            totalTrades: 0,
            totalR: 0,
            winRate: 0,
            avgSopScore: 0,
            winStreak: 0,
            currentDayR: todayRisk.totalR,
            isLocked: todayRisk.isLocked,
        };
    }

    const wins = trades.filter((t: Trade) => t.result === 'Win').length;
    const totalR = trades.reduce((sum: number, t: Trade) => sum + (t.rr || 0), 0);
    const scoredTrades = trades.filter((t: Trade) => t.mentor_score !== null);
    const avgSop = scoredTrades.length > 0
        ? scoredTrades.reduce((sum: number, t: Trade) => sum + (t.mentor_score || 0), 0) / scoredTrades.length
        : 0;

    return {
        totalTrades: trades.length,
        totalR: Math.round(totalR * 10) / 10,
        winRate: Math.round((wins / trades.length) * 100),
        avgSopScore: Math.round(avgSop * 10) / 10,
        winStreak: 0, // TODO: Calculate actual streak
        currentDayR: todayRisk.totalR,
        isLocked: todayRisk.isLocked,
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
        .select('rr, result, user_id')
        .eq('trade_date', today);

    // Get locked members today
    const { data: lockedRisks } = await supabase
        .from('daily_risk')
        .select('user_id')
        .eq('trade_date', today)
        .eq('is_locked', true);

    // Get pending reviews
    const { data: pending } = await supabase
        .from('trades')
        .select('id')
        .eq('status', 'submitted');

    const teamTotalR = todayTrades?.reduce((sum: number, t: { rr: number }) => sum + (t.rr || 0), 0) ?? 0;
    const wins = todayTrades?.filter((t: { result: string }) => t.result === 'Win').length ?? 0;
    const activeUsers = new Set(todayTrades?.map((t: { user_id: string }) => t.user_id) ?? []);

    return {
        totalMembers: members?.length ?? 0,
        activeToday: activeUsers.size,
        teamTotalR: Math.round(teamTotalR * 10) / 10,
        teamWinRate: todayTrades?.length ? Math.round((wins / todayTrades.length) * 100) : 0,
        lockedMembers: lockedRisks?.length ?? 0,
        pendingReviews: pending?.length ?? 0,
    };
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

export async function getSessionStats(userId?: string) {
    const supabase = createClient();
    let query = supabase.from('trades').select('session, rr, result');
    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    if (!data) return { london: { totalR: 0, winRate: 0, count: 0 }, newYork: { totalR: 0, winRate: 0, count: 0 } };

    const londonTrades = data.filter((t: { session: string }) => t.session === 'London');
    const nyTrades = data.filter((t: { session: string }) => t.session === 'New York');

    type TradeData = { session: string; rr: number; result: string };
    const calcStats = (trades: TradeData[]) => ({
        totalR: Math.round(trades.reduce((sum: number, t: TradeData) => sum + (t.rr || 0), 0) * 10) / 10,
        winRate: trades.length ? Math.round((trades.filter((t: TradeData) => t.result === 'Win').length / trades.length) * 100) : 0,
        count: trades.length,
    });

    return {
        london: calcStats(londonTrades),
        newYork: calcStats(nyTrades),
    };
}

export async function getProfilingStats(userId?: string) {
    const supabase = createClient();
    let query = supabase.from('trades').select('profiling, rr, result');
    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    if (!data) return [];

    type ProfilingTrade = { profiling: string; rr: number; result: string };
    const grouped = data.reduce((acc: Record<string, ProfilingTrade[]>, t: ProfilingTrade) => {
        if (!acc[t.profiling]) acc[t.profiling] = [];
        acc[t.profiling].push(t);
        return acc;
    }, {} as Record<string, ProfilingTrade[]>);

    return (Object.entries(grouped) as [string, ProfilingTrade[]][]).map(([profiling, trades]) => ({
        profiling,
        count: trades.length,
        totalR: Math.round(trades.reduce((sum, t) => sum + (t.rr || 0), 0) * 10) / 10,
        winRate: Math.round((trades.filter((t) => t.result === 'Win').length / trades.length) * 100),
    }));
}
