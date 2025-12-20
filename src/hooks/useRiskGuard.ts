"use client";

import { useEffect, useState, useCallback } from 'react';
import { getTodayRisk } from '@/lib/queries';
import { useUser } from './useUser';
import { getTimeUntilNYMidnight } from '@/lib/date-utils';

interface RiskGuardState {
    currentR: number;
    isLocked: boolean;
    isLoading: boolean;
    resetTimer: string;
    percentage: number;
    refresh: () => Promise<void>;
}

export function useRiskGuard(): RiskGuardState {
    const { user, isLoading: userLoading } = useUser();
    const [currentR, setCurrentR] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [resetTimer, setResetTimer] = useState('--:-- hrs');

    const fetchRisk = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const risk = await getTodayRisk(user.id);
            setCurrentR(risk.totalR);
            setIsLocked(risk.isLocked);
        } catch (error) {
            console.error('Error fetching risk:', error);
            // On error, reset to safe defaults
            setCurrentR(0);
            setIsLocked(false);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Update reset timer
    useEffect(() => {
        const updateTimer = () => {
            const { hours, minutes } = getTimeUntilNYMidnight();
            setResetTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hrs`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch risk on mount and user change
    useEffect(() => {
        if (!userLoading) {
            fetchRisk();
        }
    }, [fetchRisk, userLoading]);

    // Handle visibility change - refresh risk when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                fetchRisk();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [fetchRisk, user]);

    // Calculate percentage (0R = 0%, -2R = 100%)
    const percentage = currentR < 0 ? Math.min((Math.abs(currentR) / 2) * 100, 100) : 0;

    return {
        currentR,
        isLocked,
        isLoading: isLoading || userLoading,
        resetTimer,
        percentage,
        refresh: fetchRisk,
    };
}
