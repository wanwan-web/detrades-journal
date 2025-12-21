"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, BarChart3, Users, Settings, LogOut, Crown, PlusCircle, Menu, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
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
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm font-mono logo-glow">D</div>
                    <span className="font-bold tracking-wider text-foreground brand-text">DETRADES</span>
                    {isMentor && (
                        <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-500">MENTOR</span>
                    )}
                </div>
                {/* Close button - mobile only */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                                "sidebar-link group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                                isActive
                                    ? "sidebar-active text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Admin Link for Mentors */}
                {isMentor && (
                    <div className="pt-4 mt-4 border-t border-border">
                        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Admin</p>
                        <Link
                            href="/admin"
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                                pathname.startsWith("/admin")
                                    ? "bg-amber-500/10 text-amber-500 border-l-2 border-amber-500"
                                    : "text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/5"
                            )}
                        >
                            <Crown className="h-5 w-5" />
                            God View
                        </Link>
                    </div>
                )}
            </nav>

            {/* Quick Actions */}
            <div className="px-4 py-4 border-t border-border">
                <Link
                    href="/journal/new"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cta-primary bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                    <PlusCircle className="h-4 w-4" />
                    Log Trade
                </Link>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm",
                            isMentor ? "bg-gradient-to-tr from-amber-500 to-orange-600" : "bg-gradient-to-tr from-primary to-blue-600"
                        )}>
                            {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{profile?.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xs font-mono">D</div>
                    <span className="font-bold tracking-wider text-foreground">DETRADES</span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                    "w-64 bg-background border-r border-border flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 ease-in-out",
                    "lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 overflow-y-auto pt-14 lg:pt-0 bg-gradient-radial">
                <div className="page-transition">{children}</div>
            </main>
        </div>
    );
}
