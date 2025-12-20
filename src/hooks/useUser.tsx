"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
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

    // Track current user ID to prevent unnecessary updates
    const currentUserIdRef = useRef<string | null>(null);

    const loadProfile = useCallback(async (userId: string) => {
        try {
            const profileData = await getProfile(userId);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
            setProfile(null);
        }
    }, []);

    // Update user only if ID actually changed
    const updateUser = useCallback((newUser: User | null) => {
        const newUserId = newUser?.id ?? null;

        // Only update if the user ID actually changed
        if (currentUserIdRef.current !== newUserId) {
            console.log('User changed:', currentUserIdRef.current, '->', newUserId);
            currentUserIdRef.current = newUserId;
            setUser(newUser);
            return true; // User changed
        }
        return false; // User did not change
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const changed = updateUser(session.user);
                if (changed) {
                    await loadProfile(session.user.id);
                }
            } else {
                updateUser(null);
                setProfile(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            updateUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [loadProfile, updateUser]);

    // Initial fetch + auth state listener
    useEffect(() => {
        fetchUser();

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            console.log('Auth event:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                const changed = updateUser(session.user);
                if (changed) {
                    await loadProfile(session.user.id);
                }
                setIsLoading(false);
            } else if (event === 'SIGNED_OUT') {
                updateUser(null);
                setProfile(null);
                setIsLoading(false);
            }
            // TOKEN_REFRESHED: Don't update user state, just let the token refresh
        });

        return () => subscription.unsubscribe();
    }, [fetchUser, loadProfile, updateUser]);

    // No visibility change handler needed - onAuthStateChange handles it

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
