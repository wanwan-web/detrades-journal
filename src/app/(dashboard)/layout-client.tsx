'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    LayoutDashboard,
    BookOpen,
    Trophy,
    Settings,
    LogOut,
    Menu,
    X,
    TrendingUp,
    Plus,
    ClipboardCheck,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Journal', href: '/journal', icon: BookOpen },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
]

const mentorNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Review', href: '/review', icon: ClipboardCheck },
    { name: 'Journal', href: '/journal', icon: BookOpen },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
]

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user: { email?: string } | null
    profile: { username?: string | null; role?: string } | null
}

export default function DashboardLayoutClient({
    children,
    user,
    profile
}: DashboardLayoutClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const userInitial = profile?.username?.[0]?.toUpperCase() ||
        user?.email?.[0]?.toUpperCase() ||
        'U'

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-semibold text-lg">Detrades</span>
                        <button
                            className="ml-auto lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {(profile?.role === 'mentor' ? mentorNavigation : navigation).map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/dashboard' && pathname.startsWith(item.href))
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Add Trade Button */}
                    <div className="px-4 pb-4">
                        <Button asChild className="w-full">
                            <Link href="/journal/new">
                                <Plus className="w-4 h-4 mr-2" />
                                New Trade
                            </Link>
                        </Button>
                    </div>

                    {/* User Menu */}
                    <div className="border-t border-border p-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-accent transition-colors">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {userInitial}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium truncate">
                                            {profile?.username || user?.email?.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {profile?.role || 'member'}
                                        </p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar (mobile) */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:hidden">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Detrades</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
