'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Star, RotateCcw, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MentorReviewPanelProps {
    tradeId: string
    currentStatus: string
}

export default function MentorReviewPanel({ tradeId, currentStatus }: MentorReviewPanelProps) {
    const [score, setScore] = useState<number>(0)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmitReview = async (requestRevision: boolean = false) => {
        if (!requestRevision && score === 0) {
            toast.error('Pilih score terlebih dahulu')
            return
        }

        setLoading(true)

        try {
            const updateData = requestRevision
                ? {
                    status: 'revision' as const,
                    mentor_notes: notes || 'Mentor meminta revisi',
                }
                : {
                    mentor_score: score,
                    mentor_notes: notes,
                    is_reviewed: true,
                    status: 'submitted' as const,
                }

            const { error } = await supabase
                .from('trades')
                .update(updateData)
                .eq('id', tradeId)

            if (error) throw error

            toast.success(requestRevision ? 'Revision request sent' : 'Review submitted successfully')
            router.refresh()
        } catch (error) {
            console.error('Review error:', error)
            toast.error('Failed to submit review')
        } finally {
            setLoading(false)
        }
    }

    const scoreLabels = [
        { value: 1, label: 'Violation', color: 'bg-loss' },
        { value: 2, label: 'Bad', color: 'bg-orange-500' },
        { value: 3, label: 'Neutral', color: 'bg-yellow-500' },
        { value: 4, label: 'Good', color: 'bg-lime-500' },
        { value: 5, label: 'Perfect', color: 'bg-win' },
    ]

    return (
        <Card className="border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Mentor Review Panel
                </CardTitle>
                <CardDescription>
                    {currentStatus === 'revision'
                        ? 'Trade ini sedang dalam status revisi - menunggu trader memperbaiki'
                        : 'Berikan penilaian untuk trade ini'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score Selection */}
                <div className="space-y-3">
                    <Label>SOP Compliance Score</Label>
                    <div className="flex flex-wrap gap-2">
                        {scoreLabels.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => setScore(s.value)}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 transition-all',
                                    score === s.value
                                        ? `${s.color} border-transparent text-white`
                                        : 'border-border hover:border-primary'
                                )}
                            >
                                <div className="flex items-center gap-1">
                                    {[...Array(s.value)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                'w-4 h-4',
                                                score === s.value ? 'fill-current' : 'fill-none'
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs font-medium">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="mentor-notes">Catatan untuk Trader</Label>
                    <Textarea
                        id="mentor-notes"
                        placeholder="Berikan feedback atau instruksi perbaikan..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={() => handleSubmitReview(false)}
                        disabled={loading || score === 0}
                        className="flex-1"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="mr-2 h-4 w-4" />
                        )}
                        Submit Review
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => handleSubmitReview(true)}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                        )}
                        Request Revision
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
