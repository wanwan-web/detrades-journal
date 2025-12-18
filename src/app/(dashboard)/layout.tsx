import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './layout-client'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

    return (
        <DashboardLayoutClient
            user={user}
            profile={profile}
        >
            {children}
        </DashboardLayoutClient>
    )
}
