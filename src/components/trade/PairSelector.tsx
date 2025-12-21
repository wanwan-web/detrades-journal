"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAIR_GROUPS } from "@/lib/types";

interface PairSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function PairSelector({ value, onChange, className }: PairSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5",
                    "rounded-lg border border-border bg-card",
                    "text-sm text-foreground",
                    "hover:border-primary/50 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
            >
                <span className={value ? "text-foreground" : "text-muted-foreground"}>
                    {value || "Select pair..."}
                </span>
                <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-80 overflow-y-auto">
                        {PAIR_GROUPS.map((group, groupIdx) => (
                            <div key={group.label}>
                                {/* Group Header */}
                                <div className="sticky top-0 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <span>{group.icon}</span>
                                    <span>{group.label}</span>
                                </div>

                                {/* Group Items */}
                                {group.pairs.map((pair) => (
                                    <button
                                        key={pair}
                                        type="button"
                                        onClick={() => {
                                            onChange(pair);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5",
                                            "text-sm text-foreground hover:bg-primary/10 transition-colors",
                                            value === pair && "bg-primary/20"
                                        )}
                                    >
                                        <span>{pair}</span>
                                        {value === pair && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </button>
                                ))}

                                {/* Divider between groups */}
                                {groupIdx < PAIR_GROUPS.length - 1 && (
                                    <div className="h-px bg-border" />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
