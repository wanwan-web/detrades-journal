import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRR } from '@/lib/types'
import { Trophy, TrendingUp, Target, Star } from 'lucide-react'

interface LeaderboardEntry {
    userId: string
    username: string
    role: string
    totalTrades: number
    wins: number
    winrate: number
    totalRR: number
    avgScore: number
}

interface ProfileData {
    id: string
    username: string | null
    role: string
}

interface TradeData {
    user_id: string
    result: string
    rr: number
    mentor_score: number | null
}

export default async function LeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all profiles
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')

    // Fetch all APPROVED trades only
    const { data: allTradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('is_reviewed', true)

    const profiles = (profilesData || []) as ProfileData[]
    const allTrades = (allTradesData || []) as TradeData[]

    // Calculate leaderboard data from APPROVED trades only
    const leaderboard: LeaderboardEntry[] = profiles
        .filter(p => p.role === 'member')
        .map(profile => {
            const userTrades = allTrades.filter(t => t.user_id === profile.id)
            const wins = userTrades.filter(t => t.result === 'Win').length
            const totalTrades = userTrades.length
            const totalRR = userTrades.reduce((sum, t) => sum + (t.rr || 0), 0)
            const reviewedTrades = userTrades.filter(t => t.mentor_score)
            const avgScore = reviewedTrades.length > 0
                ? reviewedTrades.reduce((sum, t) => sum + (t.mentor_score || 0), 0) / reviewedTrades.length
                : 0

            return {
                userId: profile.id,
                username: profile.username || 'Unknown',
                role: profile.role,
                totalTrades,
                wins,
                winrate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
                totalRR,
                avgScore,
            }
        })
        .sort((a, b) => b.totalRR - a.totalRR) // Sort by total RR

    const getRankBadge = (index: number) => {
        if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
        if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />
        if (index === 2) return <Trophy className="w-5 h-5 text-amber-700" />
        return <span className="w-5 text-center text-muted-foreground">#{index + 1}</span>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <p className="text-muted-foreground">Ranking performa tim berdasarkan Total RR</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Top Performer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaderboard[0] ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-yellow-500/20 text-yellow-500">
                                        {leaderboard[0].username[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{leaderboard[0].username}</p>
                                    <p className="text-sm text-win">{formatRR(leaderboard[0].totalRR)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No data</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Highest Winrate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const topWinrate = [...leaderboard].filter(l => l.totalTrades >= 5).sort((a, b) => b.winrate - a.winrate)[0]
                            return topWinrate ? (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/20 text-primary">
                                            {topWinrate.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{topWinrate.username}</p>
                                        <p className="text-sm text-primary">{topWinrate.winrate.toFixed(1)}%</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Min 5 trades required</p>
                            )
                        })()}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Best SOP Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const topScore = [...leaderboard].filter(l => l.avgScore > 0).sort((a, b) => b.avgScore - a.avgScore)[0]
                            return topScore ? (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-win/20 text-win">
                                            {topScore.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{topScore.username}</p>
                                        <p className="text-sm text-win">{topScore.avgScore.toFixed(1)}/5 ⭐</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No reviewed trades</p>
                            )
                        })()}
                    </CardContent>
                </Card>
            </div>

            {/* Leaderboard Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Ranking Tim</CardTitle>
                    <CardDescription>Berdasarkan Total Profit (RR)</CardDescription>
                </CardHeader>
                <CardContent>
                    {leaderboard.length > 0 ? (
                        <div className="space-y-2">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={entry.userId}
                                    className={`flex items-center gap-4 p-4 rounded-lg ${entry.userId === user.id ? 'bg-primary/10 border border-primary/30' : 'bg-accent/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-center w-8">
                                        {getRankBadge(index)}
                                    </div>

                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>
                                            {entry.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">{entry.username}</p>
                                            {entry.userId === user.id && (
                                                <Badge variant="secondary" className="text-xs">You</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {entry.totalTrades} trades • {entry.winrate.toFixed(0)}% WR
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className={`font-mono font-bold ${entry.totalRR >= 0 ? 'text-win' : 'text-loss'}`}>
                                            {formatRR(entry.totalRR)}
                                        </p>
                                        {entry.avgScore > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Avg Score: {entry.avgScore.toFixed(1)}⭐
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Belum ada data member
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
