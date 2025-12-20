import { createBrowserClient } from '@supabase/ssr';

// Singleton pattern - reuse the same client instance
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return supabaseInstance;
}

/**
 * Force refresh the session - call this when returning to tab
 */
export async function refreshSession(): Promise<boolean> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.refreshSession();
        return !error && !!data.session;
    } catch {
        return false;
    }
}

/**
 * Wrapper to add timeout to any promise
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Request timeout after ${ms}ms`));
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
}
