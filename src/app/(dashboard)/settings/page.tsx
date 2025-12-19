import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profileData } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

    const profile = profileData as { username: string | null; role: string } | null

    return <SettingsClient user={user} profile={profile} />
}
