import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TradeForm from '@/components/forms/TradeForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { isDailyLimitReached, formatRR } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewTradePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check daily loss limit
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTradesData } = await supabase
        .from('trades')
        .select('rr')
        .eq('user_id', user.id)
        .eq('trade_date', today)

    const todayTrades = (todayTradesData || []) as { rr: number }[]
    const todayRR = todayTrades.reduce((sum, t) => sum + (t.rr || 0), 0)
    const isLocked = isDailyLimitReached(todayRR)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">New Trade</h1>
                    <p className="text-muted-foreground">Catat trade baru Anda</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/journal">← Kembali</Link>
                </Button>
            </div>

            {isLocked ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Daily Loss Limit Reached</AlertTitle>
                    <AlertDescription>
                        Anda sudah mencapai batas kerugian harian (-2R). Trading untuk hari ini dihentikan.
                        <br />Total hari ini: <strong>{formatRR(todayRR)}</strong>
                    </AlertDescription>
                </Alert>
            ) : (
                <TradeForm userId={user.id} />
            )}
        </div>
    )
}
