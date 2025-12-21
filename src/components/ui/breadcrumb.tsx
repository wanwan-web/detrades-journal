"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex items-center gap-1 text-sm", className)}
        >
            {/* Home icon */}
            <Link
                href="/dashboard"
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Dashboard"
            >
                <Home className="h-4 w-4" />
            </Link>

            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const Icon = item.icon;

                return (
                    <div key={index} className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4 text-zinc-600" />

                        {isLast ? (
                            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                {Icon && <Icon className="h-4 w-4" />}
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href || "#"}
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {item.label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

// Pre-built breadcrumb configurations for common pages
export const breadcrumbConfigs = {
    journal: [{ label: "Journal", href: "/journal" }],
    journalNew: [
        { label: "Journal", href: "/journal" },
        { label: "New Trade" },
    ],
    journalDetail: (id: string, pair?: string) => [
        { label: "Journal", href: "/journal" },
        { label: pair || `Trade #${id}` },
    ],
    analytics: [{ label: "Analytics" }],
    settings: [{ label: "Settings" }],
    team: [{ label: "Team Hub" }],
    admin: [{ label: "God View" }],
    adminReview: [
        { label: "God View", href: "/admin" },
        { label: "Review Queue" },
    ],
    adminMembers: [
        { label: "God View", href: "/admin" },
        { label: "Members" },
    ],
};
