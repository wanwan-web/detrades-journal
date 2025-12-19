// Database Enums matching Supabase schema
export type UserRole = 'member' | 'mentor';
export type SessionType = 'London' | 'New York';
export type BiasType = 'Bullish' | 'Bearish';
export type BiasDailyType = 'DNT' | 'DCM' | 'DFM' | 'DCC' | 'DRM';
export type FrameworkType = 'IRL to ERL' | 'OPR' | 'OB to Liq' | 'ERL to IRL';
export type ProfilingType = '6AM Reversal' | '6AM Continuation' | '10AM Reversal' | '10AM Continuation';
export type EntryModelType =
    | 'Entry Model 1 (DNT)'
    | 'Entry Model 2 (DNT)'
    | 'Entry Model 3 (DNT)'
    | 'Entry Model 1 (DCM)'
    | 'Entry Model 2 (DCM)';
export type ResultType = 'Win' | 'Lose' | 'BE';
export type MoodType = 'Calm' | 'Anxious' | 'Greedy' | 'Fear' | 'Bored' | 'Revenge';
export type TradeStatus = 'submitted' | 'revision' | 'reviewed';

// Database Interfaces
export interface Profile {
    id: string;
    email: string | null;
    username: string | null;
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
    trade_date: string;
    session: SessionType;
    pair: string;
    bias: BiasType;
    bias_daily: BiasDailyType;
    framework: FrameworkType;
    profiling: ProfilingType;
    entry_model: EntryModelType;
    result: ResultType;
    rr: number;
    mood: MoodType;
    image_url: string | null;
    description: string | null;
    status: TradeStatus;
    mentor_score: number | null;
    mentor_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
}

export interface DailyRisk {
    id: string;
    user_id: string;
    trade_date: string;
    total_rr: number;
    is_locked: boolean;
    locked_at: string | null;
    created_at: string;
}

// Trade with profile info (for lists)
export interface TradeWithProfile extends Trade {
    profiles?: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;
}

// Form Input Types
export interface TradeFormInput {
    trade_date: string;
    session: SessionType;
    pair: string;
    bias: BiasType;
    bias_daily: BiasDailyType;
    framework: FrameworkType;
    profiling: ProfilingType;
    entry_model: EntryModelType;
    result: ResultType;
    rr: number;
    mood: MoodType;
    description?: string;
    image?: File;
}

// Stats Types
export interface UserStats {
    totalTrades: number;
    totalR: number;
    winRate: number;
    avgSopScore: number;
    winStreak: number;
    currentDayR: number;
    isLocked: boolean;
}

export interface TeamStats {
    totalMembers: number;
    activeToday: number;
    teamTotalR: number;
    teamWinRate: number;
    lockedMembers: number;
    pendingReviews: number;
}

// Cascading dropdown helpers
export const REVERSAL_ENTRY_MODELS: EntryModelType[] = [
    'Entry Model 1 (DNT)',
    'Entry Model 2 (DNT)',
    'Entry Model 3 (DNT)',
];

export const CONTINUATION_ENTRY_MODELS: EntryModelType[] = [
    'Entry Model 1 (DCM)',
    'Entry Model 2 (DCM)',
];

export const isReversalProfiling = (profiling: ProfilingType): boolean => {
    return profiling.includes('Reversal');
};

export const getAvailableEntryModels = (profiling: ProfilingType): EntryModelType[] => {
    return isReversalProfiling(profiling) ? REVERSAL_ENTRY_MODELS : CONTINUATION_ENTRY_MODELS;
};

// Constants
export const PAIRS = ['XAUUSD', 'NQ', 'ES', 'YM', 'EURUSD', 'GBPUSD', 'GBPJPY', 'USDJPY'];
export const BIAS_DAILY_OPTIONS: BiasDailyType[] = ['DNT', 'DCM', 'DFM', 'DCC', 'DRM'];
export const FRAMEWORKS: FrameworkType[] = ['IRL to ERL', 'OPR', 'OB to Liq', 'ERL to IRL'];
export const PROFILINGS: ProfilingType[] = ['6AM Reversal', '6AM Continuation', '10AM Reversal', '10AM Continuation'];
export const MOODS: MoodType[] = ['Calm', 'Anxious', 'Greedy', 'Fear', 'Bored', 'Revenge'];
