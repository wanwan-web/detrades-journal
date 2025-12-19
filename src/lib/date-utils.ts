import { format, toZonedTime } from 'date-fns-tz';

const NY_TIMEZONE = 'America/New_York';

export function getNewYorkDate(): string {
    const now = new Date();
    const nyTime = toZonedTime(now, NY_TIMEZONE);
    return format(nyTime, 'yyyy-MM-dd', { timeZone: NY_TIMEZONE });
}

export function getNewYorkHour(): number {
    const now = new Date();
    const nyTime = toZonedTime(now, NY_TIMEZONE);
    return nyTime.getHours();
}

export function isMarketOpen(): { isOpen: boolean; session: 'London' | 'New York' | null } {
    const hour = getNewYorkHour();
    const day = new Date().getDay();

    if (day === 0 || day === 6) return { isOpen: false, session: null };
    if (hour >= 3 && hour < 8) return { isOpen: true, session: 'London' };
    if (hour >= 8 && hour < 17) return { isOpen: true, session: 'New York' };
    return { isOpen: false, session: null };
}

export function getTimeUntilNYMidnight(): { hours: number; minutes: number } {
    const now = new Date();
    const nyTime = toZonedTime(now, NY_TIMEZONE);
    return {
        hours: 23 - nyTime.getHours(),
        minutes: 59 - nyTime.getMinutes(),
    };
}

export function formatResetTimer(): string {
    const { hours, minutes } = getTimeUntilNYMidnight();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hrs`;
}
