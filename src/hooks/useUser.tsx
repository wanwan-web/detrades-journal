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

    const loadProfile = useCallback(async (userId: string) => {
        try {
            const profileData = await getProfile(userId);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
            setProfile(null);
        }
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
                await loadProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [loadProfile]);

    // Initial fetch + auth state listener
    useEffect(() => {
        // Initial load
        fetchUser();

        // Listen for auth changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                await loadProfile(session.user.id);
                setIsLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setIsLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchUser, loadProfile]);

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
