import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Target, Activity, AlertTriangle } from 'lucide-react'
import { formatRR, isDailyLimitReached } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import WinrateChart from '@/components/charts/WinrateChart'
import RecentTrades from '@/components/charts/RecentTrades'

interface TradeData {
    id: string
    trade_date: string
    session: string
    pair: string
    result: string
    rr: number
    is_reviewed: boolean
    status: string
    mentor_score: number | null
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch user's trades
    const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })

    const allTrades = (trades || []) as TradeData[]

    // Separate approved and pending trades
    const approvedTrades = allTrades.filter(t => t.is_reviewed)
    const pendingTrades = allTrades.filter(t => !t.is_reviewed)

    // Calculate stats from APPROVED trades only
    const totalApproved = approvedTrades.length
    const wins = approvedTrades.filter(t => t.result === 'Win').length
    const winrate = totalApproved > 0 ? (wins / totalApproved) * 100 : 0
    const totalRR = approvedTrades.reduce((sum, t) => sum + (t.rr || 0), 0)
    const avgRR = totalApproved > 0 ? totalRR / totalApproved : 0

    // Today's trades for -2R check (ALL trades count for risk management)
    const today = new Date().toISOString().split('T')[0]
    const todayTrades = allTrades.filter(t => t.trade_date === today)
    const todayRR = todayTrades.reduce((sum, t) => sum + (t.rr || 0), 0)
    const isLocked = isDailyLimitReached(todayRR)

    // Session stats from APPROVED trades
    const londonTrades = approvedTrades.filter(t => t.session === 'London')
    const nyTrades = approvedTrades.filter(t => t.session === 'New York')
    const londonWins = londonTrades.filter(t => t.result === 'Win').length
    const nyWins = nyTrades.filter(t => t.result === 'Win').length

    const sessionData = [
        {
            name: 'London',
            winrate: londonTrades.length > 0 ? (londonWins / londonTrades.length) * 100 : 0,
            trades: londonTrades.length
        },
        {
            name: 'New York',
            winrate: nyTrades.length > 0 ? (nyWins / nyTrades.length) * 100 : 0,
            trades: nyTrades.length
        },
    ]

    // Pending reviews
    const pendingReview = pendingTrades.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Overview performa trading Anda</p>
                </div>
                {!isLocked ? (
                    <Button asChild>
                        <Link href="/journal/new">+ New Trade</Link>
                    </Button>
                ) : null}
            </div>

            {/* Daily Limit Alert */}
            {isLocked && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Daily Loss Limit Reached</AlertTitle>
                    <AlertDescription>
                        Anda sudah mencapai batas kerugian harian (-2R). Trading untuk hari ini dihentikan.
                        Total hari ini: {formatRR(todayRR)}
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Trades
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalApproved}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {pendingReview} pending review
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Win Rate
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${winrate >= 50 ? 'text-win' : 'text-loss'}`}>
                            {winrate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {wins}W / {totalApproved - wins}L
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total RR
                        </CardTitle>
                        {totalRR >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-win" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-loss" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalRR >= 0 ? 'text-win' : 'text-loss'}`}>
                            {formatRR(totalRR)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Avg: {formatRR(avgRR)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Today&apos;s RR
                        </CardTitle>
                        {todayRR >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-win" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-loss" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${todayRR >= 0 ? 'text-win' : 'text-loss'}`}>
                            {formatRR(todayRR)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {todayTrades.length} trades today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <WinrateChart data={sessionData} />
                <RecentTrades trades={allTrades.slice(0, 5)} />
            </div>
        </div>
    )
}
