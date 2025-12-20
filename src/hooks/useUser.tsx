"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { getProfile } from '@/lib/queries';
import type { Profile } from '@/lib/types';

interface UserContextType {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isMentor: boolean;
    refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    profile: null,
    isLoading: true,
    isMentor: false,
    refresh: async () => { },
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const isFetchingRef = useRef(false);

    const fetchUser = useCallback(async (showLoading = true) => {
        // Prevent concurrent fetches
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            if (showLoading) setIsLoading(true);

            const supabase = createClient();

            // getSession is faster and works better after tab switch
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
                const profileData = await getProfile(session.user.id);
                setProfile(profileData);
            } else {
                setUser(null);
                setProfile(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            // On error, just clear state gracefully - don't crash
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
            isFetchingRef.current = false;
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchUser();

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Only refetch on explicit auth events
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                if (session?.user) {
                    setUser(session.user);
                    const profileData = await getProfile(session.user.id);
                    setProfile(profileData);
                } else {
                    setUser(null);
                    setProfile(null);
                }
                setIsLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Just update user without full refetch
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchUser]);

    // Handle visibility change - use silent refresh, no loading indicator
    useEffect(() => {
        let refreshTimer: NodeJS.Timeout | null = null;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isInitialized) {
                // Small delay to let browser wake up properly
                refreshTimer = setTimeout(() => {
                    fetchUser(false); // Silent refresh, no loading indicator
                }, 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (refreshTimer) clearTimeout(refreshTimer);
        };
    }, [fetchUser, isInitialized]);

    // Handle focus event as backup
    useEffect(() => {
        const handleFocus = () => {
            if (isInitialized) {
                fetchUser(false);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchUser, isInitialized]);

    return (
        <UserContext.Provider value={{
            user,
            profile,
            isLoading,
            isMentor: profile?.role === 'mentor',
            refresh: fetchUser,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
