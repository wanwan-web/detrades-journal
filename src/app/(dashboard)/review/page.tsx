import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRR } from '@/lib/types'
import { format } from 'date-fns'
import { Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'

interface TradeWithProfile {
    id: string
    trade_date: string
    session: string
    pair: string
    result: string
    rr: number
    status: string
    is_reviewed: boolean
    mentor_score: number | null
    image_url: string
    profiling: string
    entry_model: string
    created_at: string
    profiles: { username: string } | null
}

export default async function ReviewPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is mentor
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'mentor') {
        redirect('/dashboard')
    }

    // Fetch all trades that need review (not from current user, not yet reviewed)
    const { data: pendingTrades } = await supabase
        .from('trades')
        .select(`
      *,
      profiles:user_id (username)
    `)
        .neq('user_id', user.id)
        .eq('is_reviewed', false)
        .order('created_at', { ascending: true })

    // Fetch recently reviewed trades
    const { data: reviewedTrades } = await supabase
        .from('trades')
        .select(`
      *,
      profiles:user_id (username)
    `)
        .neq('user_id', user.id)
        .eq('is_reviewed', true)
        .order('created_at', { ascending: false })
        .limit(10)

    const pending = (pendingTrades || []) as TradeWithProfile[]
    const reviewed = (reviewedTrades || []) as TradeWithProfile[]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Review Queue</h1>
                <p className="text-muted-foreground">
                    Review dan approve trade dari member tim Anda
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pending Review
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-500">{pending.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Need Revision
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">
                            {pending.filter(t => t.status === 'revision').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Reviewed Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">
                            {reviewed.filter(t => {
                                const today = new Date().toISOString().split('T')[0]
                                return t.created_at?.startsWith(today)
                            }).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Trades */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        Trades Menunggu Review
                    </CardTitle>
                    <CardDescription>
                        Klik untuk melihat detail dan memberikan penilaian
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pending.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pending.map((trade) => (
                                <Link
                                    key={trade.id}
                                    href={`/journal/${trade.id}`}
                                    className="group block"
                                >
                                    <div className="border rounded-lg overflow-hidden hover:border-primary transition-colors">
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video bg-accent/20">
                                            <Image
                                                src={trade.image_url}
                                                alt="Trade screenshot"
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute top-2 right-2">
                                                <Badge className={trade.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}>
                                                    {trade.result} {formatRR(trade.rr)}
                                                </Badge>
                                            </div>
                                            {trade.status === 'revision' && (
                                                <div className="absolute top-2 left-2">
                                                    <Badge variant="destructive">Revision</Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{trade.pair}</span>
                                                <Badge variant="outline">{trade.session}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>by {(trade.profiles as { username: string })?.username || 'Unknown'}</span>
                                                <span>{format(new Date(trade.trade_date), 'dd MMM')}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {trade.profiling} → {trade.entry_model.split(' ')[0]} {trade.entry_model.split(' ')[1]}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                            <p>Semua trade sudah di-review! 🎉</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recently Reviewed */}
            {reviewed.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Baru Direview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {reviewed.slice(0, 5).map((trade) => (
                                <Link
                                    key={trade.id}
                                    href={`/journal/${trade.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${trade.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <span className="font-medium">{trade.pair}</span>
                                            <span className="text-muted-foreground text-sm ml-2">
                                                by {(trade.profiles as { username: string })?.username || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Score: {trade.mentor_score}/5</Badge>
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
