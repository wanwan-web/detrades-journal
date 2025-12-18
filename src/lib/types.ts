// ==========================================
// ENUM Types (Match database ENUM exactly)
// ==========================================

export const SESSION_TYPES = ['London', 'New York'] as const
export type SessionType = (typeof SESSION_TYPES)[number]

export const BIAS_TYPES = ['Bullish', 'Bearish'] as const
export type BiasType = (typeof BIAS_TYPES)[number]

export const BIAS_DAILY_TYPES = ['DNT', 'DCM', 'DFM', 'DCC', 'DRM'] as const
export type BiasDailyType = (typeof BIAS_DAILY_TYPES)[number]

export const FRAMEWORK_TYPES = ['IRL to ERL', 'OPR', 'OB to Liq', 'ERL to IRL'] as const
export type FrameworkType = (typeof FRAMEWORK_TYPES)[number]

export const PROFILING_TYPES = [
    '6AM Reversal',
    '6AM Continuation',
    '10AM Reversal',
    '10AM Continuation',
] as const
export type ProfilingType = (typeof PROFILING_TYPES)[number]

export const ENTRY_MODEL_DNT = [
    'Entry Model 1 (DNT)',
    'Entry Model 2 (DNT)',
    'Entry Model 3 (DNT)',
] as const

export const ENTRY_MODEL_DCM = [
    'Entry Model 1 (DCM)',
    'Entry Model 2 (DCM)',
] as const

export const ENTRY_MODEL_TYPES = [...ENTRY_MODEL_DNT, ...ENTRY_MODEL_DCM] as const
export type EntryModelType = (typeof ENTRY_MODEL_TYPES)[number]

export const RESULT_TYPES = ['Win', 'Lose'] as const
export type ResultType = (typeof RESULT_TYPES)[number]

export const MOOD_TYPES = ['Calm', 'Anxious', 'Greedy', 'Fear', 'Bored', 'Revenge'] as const
export type MoodType = (typeof MOOD_TYPES)[number]

export const TRADE_STATUS_TYPES = ['submitted', 'revision'] as const
export type TradeStatusType = (typeof TRADE_STATUS_TYPES)[number]

export const PAIR_TYPES = ['NQ', 'ES', 'YM', 'EU', 'GU', 'XAU'] as const
export type PairType = (typeof PAIR_TYPES)[number]

export const ROLE_TYPES = ['member', 'mentor'] as const
export type RoleType = (typeof ROLE_TYPES)[number]

// ==========================================
// Database Row Types
// ==========================================

export interface Profile {
    id: string
    username: string | null
    role: RoleType
    created_at: string
}

export interface Trade {
    id: string
    user_id: string
    created_at: string
    trade_date: string
    session: SessionType
    pair: PairType
    bias: BiasType
    bias_daily: BiasDailyType
    framework: FrameworkType
    profiling: ProfilingType
    entry_model: EntryModelType
    result: ResultType
    rr: number
    mood: MoodType
    image_url: string
    description: string | null
    tags: string[] | null
    status: TradeStatusType
    mentor_score: number | null
    mentor_notes: string | null
    is_reviewed: boolean
}

// ==========================================
// Insert/Update Types
// ==========================================

export type TradeInsert = Omit<Trade, 'id' | 'created_at' | 'mentor_score' | 'mentor_notes' | 'is_reviewed'> & {
    status?: TradeStatusType
}

export type TradeUpdate = Partial<Omit<Trade, 'id' | 'user_id' | 'created_at'>>

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface TradeWithProfile extends Trade {
    profiles: Profile
}

// ==========================================
// Supabase Database Type
// ==========================================

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'created_at'> & { created_at?: string }
                Update: ProfileUpdate
            }
            trades: {
                Row: Trade
                Insert: TradeInsert & { id?: string; created_at?: string }
                Update: TradeUpdate
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            session_type: SessionType
            bias_type: BiasType
            bias_daily_type: BiasDailyType
            framework_type: FrameworkType
            profiling_type: ProfilingType
            entry_model_type: EntryModelType
            result_type: ResultType
            mood_type: MoodType
            trade_status: TradeStatusType
        }
    }
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get available entry models based on profiling type
 * Reversal profiles -> DNT models
 * Continuation profiles -> DCM models
 */
export function getEntryModelsForProfiling(profiling: ProfilingType): readonly string[] {
    if (profiling.includes('Reversal')) {
        return ENTRY_MODEL_DNT
    }
    return ENTRY_MODEL_DCM
}

/**
 * Check if profiling is a reversal type
 */
export function isReversalProfiling(profiling: ProfilingType): boolean {
    return profiling.includes('Reversal')
}

/**
 * Format RR value for display
 */
export function formatRR(rr: number): string {
    const sign = rr >= 0 ? '+' : ''
    return `${sign}${rr.toFixed(2)}R`
}

/**
 * Get score label from numeric score
 */
export function getScoreLabel(score: number): string {
    const labels: Record<number, string> = {
        5: 'Perfect Execution',
        4: 'Good',
        3: 'Neutral',
        2: 'Bad',
        1: 'Violation',
    }
    return labels[score] || 'Unknown'
}

/**
 * Check if daily loss limit reached (-2R)
 */
export function isDailyLimitReached(totalRR: number): boolean {
    return totalRR <= -2
}
