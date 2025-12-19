"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const profileData = await getProfile(user.id);
            setProfile(profileData);
        } else {
            setProfile(null);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchUser();

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                await fetchUser();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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
