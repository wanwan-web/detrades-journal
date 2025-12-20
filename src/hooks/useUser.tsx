"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

    const fetchUser = useCallback(async () => {
        try {
            const supabase = createClient();

            // Use a timeout to prevent infinite loading
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );

            const userPromise = supabase.auth.getUser();

            const result = await Promise.race([userPromise, timeoutPromise]);

            if (result && 'data' in result) {
                const userData = result.data.user;
                setUser(userData);

                if (userData) {
                    const profileData = await getProfile(userData.id);
                    setProfile(profileData);
                } else {
                    setProfile(null);
                }
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            // On error, just set loading to false to prevent stuck state
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                setIsLoading(true);
                await fetchUser();
            }
        });

        // Handle visibility change - refresh session when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Refresh session when tab becomes visible again
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        // Session is still valid, refresh user data silently
                        fetchUser();
                    } else {
                        // Session expired, update state
                        setUser(null);
                        setProfile(null);
                        setIsLoading(false);
                    }
                });
            }
        };

        // Handle online/offline status
        const handleOnline = () => {
            fetchUser();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, [fetchUser]);

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
