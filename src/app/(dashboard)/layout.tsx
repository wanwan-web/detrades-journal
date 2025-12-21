"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, BarChart3, Users, Settings, LogOut, Crown, Shield, PlusCircle, Menu, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRiskGuard } from "@/hooks/useRiskGuard";
import { createClient } from "@/lib/supabase";

const memberNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Team Hub", href: "/team", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, isMentor, isLoading } = useUser();
    const { isLocked, currentR } = useRiskGuard();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white font-bold text-xs font-mono">D</div>
                    <span className="font-bold tracking-wider text-white">DETRADES</span>
                    {isMentor && (
                        <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-500">MENTOR</span>
                    )}
                </div>
                {/* Close button - mobile only */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                    aria-label="Close menu"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {memberNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "sidebar-link group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all",
                                isActive ? "bg-zinc-900 text-indigo-400 border-l-2 border-indigo-500 rounded-l-none" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "text-indigo-400")} />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Admin Link for Mentors */}
                {isMentor && (
                    <div className="pt-4 mt-4 border-t border-zinc-800">
                        <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Admin</p>
                        <Link
                            href="/admin"
                            className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-amber-500 hover:bg-zinc-900 transition-all"
                        >
                            <Crown className="h-5 w-5" />
                            God View
                        </Link>
                    </div>
                )}
            </nav>

            {/* Risk Guard Mini */}
            <div className="px-4 py-3 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className={cn("h-4 w-4", isLocked ? "text-rose-500" : "text-indigo-500")} />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Daily Risk</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={cn(
                        "font-mono font-bold",
                        isLocked ? "text-rose-500" : currentR > 0 ? "text-emerald-500" : currentR < 0 ? "text-amber-500" : "text-zinc-400"
                    )}>
                        {currentR > 0 ? "+" : ""}{currentR}R
                    </span>
                    {isLocked && <span className="text-[10px] text-rose-500 font-bold">LOCKED</span>}
                </div>
                <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all", isLocked ? "bg-rose-500" : "bg-indigo-500")}
                        style={{ width: `${Math.min(Math.abs(currentR) / 2 * 100, 100)}%` }}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-t border-zinc-800">
                <Link
                    href="/journal/new"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                        isLocked
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "cta-primary bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    )}
                >
                    <PlusCircle className="h-4 w-4" />
                    Log Trade
                </Link>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                            isMentor ? "bg-gradient-to-tr from-amber-500 to-orange-600" : "bg-gradient-to-tr from-indigo-500 to-purple-600"
                        )}>
                            {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">{profile?.username}</p>
                            <p className="text-[10px] text-zinc-500 capitalize">{profile?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-rose-500 hover:bg-zinc-900 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-glow">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white font-bold text-xs font-mono">D</div>
                    <span className="font-bold tracking-wider text-white">DETRADES</span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar - Desktop: Always visible, Mobile: Slide-out drawer */}
            <aside
                className={cn(
                    "w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 ease-in-out",
                    "lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 overflow-y-auto pt-14 lg:pt-0">
                <div className="page-transition">{children}</div>
            </main>
        </div>
    );
}
