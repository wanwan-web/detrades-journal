import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRR } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

interface TradeData {
    id: string
    pair: string
    trade_date: string
    session: string
    result: string
    rr: number
    is_reviewed: boolean
}

interface RecentTradesProps {
    trades: TradeData[]
}

export default function RecentTrades({ trades }: RecentTradesProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Trades</CardTitle>
                <Link href="/journal" className="text-sm text-primary hover:underline">
                    View all
                </Link>
            </CardHeader>
            <CardContent>
                {trades.length > 0 ? (
                    <div className="space-y-3">
                        {trades.map((trade) => (
                            <Link
                                key={trade.id}
                                href={`/journal/${trade.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${trade.result === 'Win' ? 'bg-win' : 'bg-loss'}`} />
                                    <div>
                                        <p className="font-medium">{trade.pair}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(trade.trade_date), 'dd MMM yyyy')} • {trade.session}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono font-medium ${trade.rr >= 0 ? 'text-win' : 'text-loss'}`}>
                                        {formatRR(trade.rr)}
                                    </span>
                                    {!trade.is_reviewed && (
                                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Belum ada trade. Mulai catat trading pertama Anda!
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
