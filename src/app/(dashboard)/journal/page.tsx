import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRR, isDailyLimitReached } from '@/lib/types'
import { format } from 'date-fns'
import { Plus, Filter, Star } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface TradeData {
    id: string
    trade_date: string
    session: string
    pair: string
    profiling: string
    result: string
    rr: number
    is_reviewed: boolean
    status: string
    mentor_score: number | null
}

export default async function JournalPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's trades
    const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })
        .order('created_at', { ascending: false })

    const trades = (tradesData || []) as TradeData[]

    // Check daily limit
    const today = new Date().toISOString().split('T')[0]
    const todayTrades = trades.filter(t => t.trade_date === today)
    const todayRR = todayTrades.reduce((sum, t) => sum + (t.rr || 0), 0)
    const isLocked = isDailyLimitReached(todayRR)

    const allTrades = trades

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Journal</h1>
                    <p className="text-muted-foreground">Riwayat trading Anda ({allTrades.length} trades)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled>
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    {!isLocked && (
                        <Button asChild>
                            <Link href="/journal/new">
                                <Plus className="w-4 h-4 mr-2" />
                                New Trade
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Trades Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Semua Trade</CardTitle>
                </CardHeader>
                <CardContent>
                    {allTrades.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Pair</TableHead>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Setup</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead className="text-right">RR</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allTrades.map((trade) => (
                                        <TableRow key={trade.id} className="cursor-pointer hover:bg-accent/50">
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`} className="block">
                                                    {format(new Date(trade.trade_date), 'dd MMM yyyy')}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`} className="font-medium">
                                                    {trade.pair}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`}>
                                                    <Badge variant="outline">{trade.session}</Badge>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`} className="text-muted-foreground text-sm">
                                                    {trade.profiling.split(' ')[0]} {trade.profiling.split(' ')[1]}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`}>
                                                    <Badge className={trade.result === 'Win' ? 'bg-win hover:bg-win/80' : 'bg-loss hover:bg-loss/80'}>
                                                        {trade.result}
                                                    </Badge>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/journal/${trade.id}`}>
                                                    <span className={`font-mono font-medium ${trade.rr >= 0 ? 'text-win' : 'text-loss'}`}>
                                                        {formatRR(trade.rr)}
                                                    </span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`}>
                                                    {trade.mentor_score ? (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                                            <span>{trade.mentor_score}/5</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/journal/${trade.id}`}>
                                                    {trade.status === 'revision' ? (
                                                        <Badge variant="destructive">Revision</Badge>
                                                    ) : trade.is_reviewed ? (
                                                        <Badge className="bg-win">Reviewed</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Pending</Badge>
                                                    )}
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">Belum ada trade. Mulai catat trading pertama Anda!</p>
                            <Button asChild>
                                <Link href="/journal/new">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Trade
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
