"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Eye, ListChecks, Users, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { getPendingReviews } from "@/lib/queries";

const adminNavItems = [
    { name: "My Dashboard", href: "/dashboard", icon: User, group: "My Stats" },
    { name: "God View", href: "/admin", icon: Eye, group: "Team Management" },
    { name: "Review Queue", href: "/admin/review", icon: ListChecks, group: "Team Management", hasBadge: true },
    { name: "Members", href: "/admin/members", icon: Users, group: "Team Management" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile, isLoading } = useUser();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        async function loadPending() {
            const pending = await getPendingReviews();
            setPendingCount(pending.length);
        }
        loadPending();
    }, []);

    // Group navigation items
    const myStatsItems = adminNavItems.filter(i => i.group === "My Stats");
    const teamItems = adminNavItems.filter(i => i.group === "Team Management");

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center bg-zinc-950"><div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;
    }

    // Redirect non-mentors
    if (!profile || profile.role !== 'mentor') {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <p className="text-zinc-400 mb-4">Access denied. Mentor only.</p>
                    <Link href="/dashboard" className="text-indigo-400 hover:underline">Go to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-glow">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col fixed inset-y-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center text-zinc-900 font-bold text-xs font-mono">M</div>
                        <span className="font-bold tracking-wider text-white">MENTOR</span>
                        <span className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
                    {/* My Stats */}
                    <div>
                        <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">My Stats</p>
                        <div className="space-y-1">
                            {myStatsItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                            isActive ? "bg-zinc-900 text-amber-500 border-l-2 border-amber-500 rounded-l-none" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                        )}
                                    >
                                        <Icon className="text-lg" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Team Management */}
                    <div>
                        <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Team Management</p>
                        <div className="space-y-1">
                            {teamItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                            isActive ? "bg-zinc-900 text-amber-500 border-l-2 border-amber-500 rounded-l-none" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="flex items-center gap-3">
                                                <Icon className="text-lg" />
                                                {item.name}
                                            </span>
                                            {item.hasBadge && pendingCount > 0 && (
                                                <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                            {profile.username?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">{profile.username}</p>
                            <p className="text-[10px] text-amber-500">Mentor</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 ml-64 overflow-y-auto">
                <div className="page-transition">{children}</div>
            </main>
        </div>
    );
}
