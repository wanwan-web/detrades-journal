import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRR, getScoreLabel } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Star, Calendar, Clock, Target, TrendingUp, Brain, MessageSquare } from 'lucide-react'
import MentorReviewPanel from '@/components/forms/MentorReviewPanel'

interface TradeData {
    id: string
    user_id: string
    trade_date: string
    session: string
    pair: string
    bias: string
    bias_daily: string
    framework: string
    profiling: string
    entry_model: string
    result: string
    rr: number
    mood: string
    image_url: string
    description: string | null
    tags: string[] | null
    status: string
    is_reviewed: boolean
    mentor_score: number | null
    mentor_notes: string | null
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TradeDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch trade
    const { data: tradeData, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !tradeData) {
        notFound()
    }

    const trade = tradeData as TradeData

    // Fetch current user's profile to check if mentor
    const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const profile = profileData as { role: string } | null
    const isMentor = profile?.role === 'mentor'
    const isOwner = trade.user_id === user.id

    // Fetch trade owner's profile
    const { data: tradeOwnerData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', trade.user_id)
        .single()

    const tradeOwner = tradeOwnerData as { username: string } | null

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/journal">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{trade.pair}</h1>
                            <Badge className={trade.result === 'Win' ? 'bg-win' : 'bg-loss'}>
                                {trade.result}
                            </Badge>
                            {trade.status === 'revision' && (
                                <Badge variant="destructive">Needs Revision</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            {format(new Date(trade.trade_date), 'EEEE, dd MMMM yyyy')} • {trade.session}
                            {!isOwner && tradeOwner && (
                                <span> • by {tradeOwner.username || 'Unknown'}</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-3xl font-bold font-mono ${trade.rr >= 0 ? 'text-win' : 'text-loss'}`}>
                        {formatRR(trade.rr)}
                    </div>
                    {trade.mentor_score && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm">{trade.mentor_score}/5 - {getScoreLabel(trade.mentor_score)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Screenshot */}
            <Card>
                <CardHeader>
                    <CardTitle>Screenshot Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-accent/20">
                        <Image
                            src={trade.image_url}
                            alt="Trade screenshot"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Trade Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Technical Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Analisis Teknikal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bias</span>
                            <span className="font-medium">{trade.bias}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bias Daily</span>
                            <Badge variant="outline">{trade.bias_daily}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Framework</span>
                            <span className="font-medium">{trade.framework}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Profiling</span>
                            <span className="font-medium">{trade.profiling}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Entry Model</span>
                            <Badge>{trade.entry_model}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Trade Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Info Trade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal
                            </span>
                            <span className="font-medium">{format(new Date(trade.trade_date), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Session
                            </span>
                            <Badge variant="secondary">{trade.session}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                Mood
                            </span>
                            <Badge variant={trade.mood === 'Calm' ? 'default' : 'secondary'}>{trade.mood}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Result</span>
                            <Badge className={trade.result === 'Win' ? 'bg-win' : 'bg-loss'}>
                                {trade.result} {formatRR(trade.rr)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tags */}
            {trade.tags && trade.tags.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {trade.tags.map((tag: string, i: number) => (
                                <Badge key={i} variant="outline">#{tag}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Description */}
            {trade.description && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Catatan Trader
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{trade.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* Mentor Review */}
            {trade.is_reviewed && trade.mentor_notes && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Mentor Review
                        </CardTitle>
                        <CardDescription>
                            Score: {trade.mentor_score}/5 - {getScoreLabel(trade.mentor_score || 0)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{trade.mentor_notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Mentor Review Panel (only visible to mentors for unreviewed trades) */}
            {isMentor && !trade.is_reviewed && (
                <MentorReviewPanel tradeId={trade.id} currentStatus={trade.status} />
            )}

            {/* Edit button for owner when revision requested */}
            {isOwner && trade.status === 'revision' && (
                <Card className="border-destructive/50">
                    <CardContent className="pt-6">
                        <p className="text-destructive mb-4">
                            Mentor meminta revisi untuk trade ini. Silakan edit dan perbaiki.
                        </p>
                        <Button variant="destructive" asChild>
                            <Link href={`/journal/${trade.id}/edit`}>Edit Trade</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
