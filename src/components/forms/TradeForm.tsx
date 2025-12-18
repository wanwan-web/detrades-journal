'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
    SESSION_TYPES,
    PAIR_TYPES,
    BIAS_TYPES,
    BIAS_DAILY_TYPES,
    FRAMEWORK_TYPES,
    PROFILING_TYPES,
    RESULT_TYPES,
    MOOD_TYPES,
    getEntryModelsForProfiling,
    type ProfilingType,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const tradeSchema = z.object({
    trade_date: z.string().min(1, 'Tanggal wajib diisi'),
    session: z.enum(SESSION_TYPES as unknown as [string, ...string[]]),
    pair: z.enum(PAIR_TYPES as unknown as [string, ...string[]]),
    bias: z.enum(BIAS_TYPES as unknown as [string, ...string[]]),
    bias_daily: z.enum(BIAS_DAILY_TYPES as unknown as [string, ...string[]]),
    framework: z.enum(FRAMEWORK_TYPES as unknown as [string, ...string[]]),
    profiling: z.enum(PROFILING_TYPES as unknown as [string, ...string[]]),
    entry_model: z.string().min(1, 'Entry model wajib dipilih'),
    result: z.enum(RESULT_TYPES as unknown as [string, ...string[]]),
    rr: z.string().min(1, 'RR wajib diisi').transform((val) => parseFloat(val)),
    mood: z.enum(MOOD_TYPES as unknown as [string, ...string[]]),
    description: z.string().optional(),
    tags: z.string().optional(),
})

type TradeFormData = z.input<typeof tradeSchema>

interface TradeFormProps {
    userId: string
    isLocked?: boolean
}

export default function TradeForm({ userId, isLocked = false }: TradeFormProps) {
    const [loading, setLoading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [entryModelOptions, setEntryModelOptions] = useState<readonly string[]>([])
    const router = useRouter()
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TradeFormData>({
        resolver: zodResolver(tradeSchema),
        defaultValues: {
            trade_date: new Date().toISOString().split('T')[0],
            rr: '',
        },
    })

    const selectedProfiling = watch('profiling') as ProfilingType | undefined
    const selectedResult = watch('result')

    // Cascading logic: Update entry model options when profiling changes
    useEffect(() => {
        if (selectedProfiling) {
            const options = getEntryModelsForProfiling(selectedProfiling)
            setEntryModelOptions(options)
            setValue('entry_model', '') // Reset entry model when profiling changes
        }
    }, [selectedProfiling, setValue])

    // Auto-set RR sign based on result
    useEffect(() => {
        const currentRR = watch('rr')
        if (currentRR && selectedResult) {
            const numRR = parseFloat(currentRR)
            if (!isNaN(numRR)) {
                if (selectedResult === 'Lose' && numRR > 0) {
                    setValue('rr', (-Math.abs(numRR)).toString())
                } else if (selectedResult === 'Win' && numRR < 0) {
                    setValue('rr', Math.abs(numRR).toString())
                }
            }
        }
    }, [selectedResult, setValue, watch])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran gambar maksimal 5MB')
            return
        }

        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('trade-images')
                .upload(fileName, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('trade-images')
                .getPublicUrl(fileName)

            setImageUrl(publicUrl)
            toast.success('Screenshot berhasil diupload')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Gagal mengupload gambar')
        } finally {
            setUploading(false)
        }
    }

    const removeImage = () => {
        setImageUrl(null)
    }

    const onSubmit = async (data: TradeFormData) => {
        if (!imageUrl) {
            toast.error('Screenshot chart wajib diupload')
            return
        }

        setLoading(true)

        try {
            // Parse tags from comma-separated string
            const tags = data.tags
                ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
                : null

            const { error } = await supabase.from('trades').insert({
                user_id: userId,
                trade_date: data.trade_date,
                session: data.session,
                pair: data.pair,
                bias: data.bias,
                bias_daily: data.bias_daily,
                framework: data.framework,
                profiling: data.profiling,
                entry_model: data.entry_model,
                result: data.result,
                rr: typeof data.rr === 'string' ? parseFloat(data.rr) : data.rr,
                mood: data.mood,
                image_url: imageUrl,
                description: data.description || null,
                tags,
                status: 'submitted',
                is_reviewed: false,
            })

            if (error) throw error

            toast.success('Trade berhasil disimpan!')
            router.push('/journal')
            router.refresh()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Gagal menyimpan trade')
        } finally {
            setLoading(false)
        }
    }

    if (isLocked) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Daily loss limit tercapai (-2R). Trading untuk hari ini dihentikan.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Dasar</CardTitle>
                    <CardDescription>Detail umum tentang trade</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="trade_date">Tanggal Trade *</Label>
                        <Input
                            id="trade_date"
                            type="date"
                            {...register('trade_date')}
                            className={errors.trade_date ? 'border-destructive' : ''}
                        />
                        {errors.trade_date && (
                            <p className="text-xs text-destructive">{errors.trade_date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="session">Session *</Label>
                        <Select onValueChange={(v) => setValue('session', v as typeof SESSION_TYPES[number])}>
                            <SelectTrigger className={errors.session ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Pilih session" />
                            </SelectTrigger>
                            <SelectContent>
                                {SESSION_TYPES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pair">Pair *</Label>
                        <Select onValueChange={(v) => setValue('pair', v as typeof PAIR_TYPES[number])}>
                            <SelectTrigger className={errors.pair ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Pilih pair" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAIR_TYPES.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Technical Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>Analisis Teknikal</CardTitle>
                    <CardDescription>Detail setup dan entry berdasarkan metodologi Detrades</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="bias">Bias *</Label>
                        <Select onValueChange={(v) => setValue('bias', v as typeof BIAS_TYPES[number])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih bias" />
                            </SelectTrigger>
                            <SelectContent>
                                {BIAS_TYPES.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bias_daily">Bias Daily *</Label>
                        <Select onValueChange={(v) => setValue('bias_daily', v as typeof BIAS_DAILY_TYPES[number])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih bias daily" />
                            </SelectTrigger>
                            <SelectContent>
                                {BIAS_DAILY_TYPES.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="framework">Framework *</Label>
                        <Select onValueChange={(v) => setValue('framework', v as typeof FRAMEWORK_TYPES[number])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih framework" />
                            </SelectTrigger>
                            <SelectContent>
                                {FRAMEWORK_TYPES.map((f) => (
                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profiling">Profiling *</Label>
                        <Select onValueChange={(v) => setValue('profiling', v as typeof PROFILING_TYPES[number])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih profiling" />
                            </SelectTrigger>
                            <SelectContent>
                                {PROFILING_TYPES.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="entry_model">Entry Model * {!selectedProfiling && <span className="text-muted-foreground">(Pilih profiling dulu)</span>}</Label>
                        <Select
                            onValueChange={(v) => setValue('entry_model', v)}
                            disabled={!selectedProfiling}
                        >
                            <SelectTrigger className={errors.entry_model ? 'border-destructive' : ''}>
                                <SelectValue placeholder={selectedProfiling ? 'Pilih entry model' : 'Pilih profiling terlebih dahulu'} />
                            </SelectTrigger>
                            <SelectContent>
                                {entryModelOptions.map((e) => (
                                    <SelectItem key={e} value={e}>{e}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedProfiling && (
                            <p className="text-xs text-muted-foreground">
                                {selectedProfiling.includes('Reversal') ? 'DNT Models (Reversal setup)' : 'DCM Models (Continuation setup)'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Result */}
            <Card>
                <CardHeader>
                    <CardTitle>Hasil Trade</CardTitle>
                    <CardDescription>Outcome dan psikologi saat trading</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="result">Result *</Label>
                        <Select onValueChange={(v) => setValue('result', v as typeof RESULT_TYPES[number])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Win / Lose" />
                            </SelectTrigger>
                            <SelectContent>
                                {RESULT_TYPES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        <span className={r === 'Win' ? 'text-win' : 'text-loss'}>{r}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rr">Risk Reward (RR) *</Label>
                        <Input
                            id="rr"
                            type="number"
                            step="0.01"
                            placeholder={selectedResult === 'Lose' ? '-1.00' : '2.00'}
                            {...register('rr')}
                            className={errors.rr ? 'border-destructive' : ''}
                        />
                        {errors.rr && (
                            <p className="text-xs text-destructive">{errors.rr.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mood">Mood *</Label>
                        <Select onValueChange={(v) => setValue('mood', v as typeof MOOD_TYPES[number])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih mood" />
                            </SelectTrigger>
                            <SelectContent>
                                {MOOD_TYPES.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Screenshot */}
            <Card>
                <CardHeader>
                    <CardTitle>Screenshot Chart *</CardTitle>
                    <CardDescription>Upload screenshot dari chart setup Anda (wajib)</CardDescription>
                </CardHeader>
                <CardContent>
                    {imageUrl ? (
                        <div className="relative">
                            <div className="relative aspect-video w-full max-w-2xl rounded-lg overflow-hidden border">
                                <Image
                                    src={imageUrl}
                                    alt="Trade screenshot"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {uploading ? (
                                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                                ) : (
                                    <>
                                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                                        </p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG (max 5MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </label>
                    )}
                </CardContent>
            </Card>

            {/* Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Catatan (Opsional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            placeholder="Catatan tambahan tentang trade ini..."
                            {...register('description')}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                            id="tags"
                            placeholder="Contoh: A+Setup, NewsEvent (pisahkan dengan koma)"
                            {...register('tags')}
                        />
                        <p className="text-xs text-muted-foreground">Pisahkan dengan koma</p>
                    </div>
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={loading || !imageUrl}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        'Simpan Trade'
                    )}
                </Button>
                {!imageUrl && (
                    <p className="text-sm text-muted-foreground self-center">
                        Upload screenshot untuk mengaktifkan tombol simpan
                    </p>
                )}
            </div>
        </form>
    )
}
