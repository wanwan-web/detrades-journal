"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyPnL, Trade } from "@/lib/types";

interface CalendarWidgetProps {
    monthlyData: DailyPnL[];
    onDateClick?: (date: string, trades: Trade[]) => void;
    tradesByDate?: Record<string, Trade[]>;
}

export function CalendarWidget({ monthlyData, onDateClick, tradesByDate = {} }: CalendarWidgetProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const goToPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getDayData = (day: number): DailyPnL | undefined => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return monthlyData.find(d => d.date === dateStr);
    };

    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        if (onDateClick) {
            onDateClick(dateStr, tradesByDate[dateStr] || []);
        }
    };

    const renderDays = () => {
        const days = [];

        // Empty cells for days before the first day of month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10" />);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = getDayData(day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDate === dateStr;
            const hasWin = dayData && dayData.totalR > 0;
            const hasLose = dayData && dayData.totalR < 0;
            const isNeutral = dayData && dayData.totalR === 0;

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                        "h-10 w-full rounded-lg text-sm font-medium transition-all duration-200",
                        "hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        isToday && !dayData && "ring-1 ring-primary/50",
                        isSelected && "ring-2 ring-primary",
                        hasWin && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                        hasLose && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                        isNeutral && dayData && "bg-amber-500/10 text-amber-400",
                        !dayData && "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex flex-col items-center justify-center h-full">
                        <span>{day}</span>
                        {dayData && (
                            <span className={cn(
                                "text-[10px] font-mono",
                                hasWin && "text-emerald-400",
                                hasLose && "text-rose-400"
                            )}>
                                {dayData.totalR > 0 ? '+' : ''}{dayData.totalR.toFixed(1)}R
                            </span>
                        )}
                    </div>
                </button>
            );
        }

        return days;
    };

    // Calculate monthly totals
    const monthlyTotal = monthlyData.reduce((sum, d) => sum + d.totalR, 0);
    const totalTrades = monthlyData.reduce((sum, d) => sum + d.trades, 0);
    const totalWins = monthlyData.reduce((sum, d) => sum + d.wins, 0);

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Trading Calendar</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium min-w-[120px] text-center">
                        {monthNames[month]} {year}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            {/* Monthly Summary */}
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Monthly P&L</p>
                    <p className={cn(
                        "text-lg font-mono font-bold",
                        monthlyTotal > 0 ? "text-emerald-500" : monthlyTotal < 0 ? "text-rose-500" : "text-foreground"
                    )}>
                        {monthlyTotal > 0 ? '+' : ''}{monthlyTotal.toFixed(1)}R
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-lg font-mono font-bold text-foreground">{totalTrades}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-mono font-bold text-foreground">
                        {totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
}
