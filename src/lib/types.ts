// =====================================================
// DETRADES TYPES - Simplified Schema
// =====================================================

// Database Enums matching Supabase schema
export type UserRole = 'member' | 'mentor';
export type ResultType = 'Win' | 'Lose';
export type TradeStatus = 'submitted' | 'reviewed' | 'needs_improvement';

// Database Interfaces
export interface Profile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Trade {
    id: string;
    user_id: string;
    created_at: string;
    updated_at?: string;

    // Trade Details
    trade_date: string;
    pair: string;
    result: ResultType;
    rr: number;

    // Analysis
    profiling: string | null;
    description: string | null;
    screenshot_url: string | null;

    // Review System
    status: TradeStatus;
    mentor_score: number | null;
    mentor_feedback: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
}

// Trade with profile info (for lists)
export interface TradeWithProfile extends Trade {
    profiles?: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;
}

// Form Input Types
export interface TradeFormInput {
    trade_date: string;
    pair: string;
    result: ResultType;
    rr: number;
    profiling?: string;
    description?: string;
    screenshot?: File;
}

// Stats Types
export interface UserStats {
    totalTrades: number;
    totalR: number;
    winRate: number;
    avgSopScore: number;
    winStreak: number;
    currentDayR: number;
}

export interface TeamStats {
    totalMembers: number;
    activeToday: number;
    teamTotalR: number;
    teamWinRate: number;
    pendingReviews: number;
}

// =====================================================
// PAIRS CONFIG - Grouped by Category
// =====================================================
export interface PairGroup {
    label: string;
    icon: string;
    pairs: string[];
}

export const PAIR_GROUPS: PairGroup[] = [
    {
        label: 'Indices',
        icon: '📊',
        pairs: ['NASDAQ', 'S&P500', 'DOW'],
    },
    {
        label: 'Commodities',
        icon: '💰',
        pairs: ['XAUUSD'],
    },
    {
        label: 'Forex',
        icon: '💱',
        pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF'],
    },
];

// Flat list of all pairs for validation
export const ALL_PAIRS = PAIR_GROUPS.flatMap(group => group.pairs);

// =====================================================
// PROFILING OPTIONS
// =====================================================
export const PROFILING_OPTIONS = [
    '6AM Reversal',
    '6AM Continuation',
    '10AM Reversal',
    '10AM Continuation',
    'Other',
];

// =====================================================
// CALENDAR TYPES
// =====================================================
export interface DailyPnL {
    date: string;
    totalR: number;
    trades: number;
    wins: number;
    losses: number;
}
