"use client";

import { useEffect, useState, useCallback } from 'react';
import { getTodayRisk } from '@/lib/queries';
import { useUser } from './useUser';
import { getNewYorkDate, getTimeUntilNYMidnight } from '@/lib/date-utils';

interface RiskGuardState {
    currentR: number;
    isLocked: boolean;
    isLoading: boolean;
    resetTimer: string;
    percentage: number;
    refresh: () => Promise<void>;
}

export function useRiskGuard(): RiskGuardState {
    const { user } = useUser();
    const [currentR, setCurrentR] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [resetTimer, setResetTimer] = useState('--:-- hrs');

    const fetchRisk = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const risk = await getTodayRisk(user.id);
        setCurrentR(risk.totalR);
        setIsLocked(risk.isLocked);
        setIsLoading(false);
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
        fetchRisk();
    }, [fetchRisk]);

    // Calculate percentage (0R = 0%, -2R = 100%)
    const percentage = currentR < 0 ? Math.min((Math.abs(currentR) / 2) * 100, 100) : 0;

    return {
        currentR,
        isLocked,
        isLoading,
        resetTimer,
        percentage,
        refresh: fetchRisk,
    };
}
