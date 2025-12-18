'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface SettingsClientProps {
    user: { email?: string } | null
    profile: { username?: string | null; role?: string } | null
}

export default function SettingsClient({ user, profile }: SettingsClientProps) {
    const [username, setUsername] = useState(profile?.username || '')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (!currentUser) {
                toast.error('Not authenticated')
                return
            }

            const { error } = await supabase
                .from('profiles')
                .update({ username })
                .eq('id', currentUser.id)

            if (error) throw error

            toast.success('Profile updated successfully')
            router.refresh()
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Kelola profil dan preferensi Anda</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile
                    </CardTitle>
                    <CardDescription>Informasi profil Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Masukkan username"
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Perubahan'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Role Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Role & Permissions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Current Role</p>
                            <p className="text-sm text-muted-foreground">
                                {profile?.role === 'mentor'
                                    ? 'Anda memiliki akses mentor untuk review trades'
                                    : 'Anda adalah member tim trading'}
                            </p>
                        </div>
                        <Badge variant={profile?.role === 'mentor' ? 'default' : 'secondary'} className="capitalize">
                            {profile?.role || 'member'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Untuk menghapus akun atau mengubah password, hubungi mentor atau admin.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
