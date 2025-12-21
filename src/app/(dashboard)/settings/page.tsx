"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Palette, Shield, LogOut, Save, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { updateProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const router = useRouter();
    const { profile, isMentor, refresh, isLoading: userLoading } = useUser();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Preferences (mock - not persisted yet)
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [compactView, setCompactView] = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || "");
            setFullName(profile.full_name || "");
        }
    }, [profile]);

    const handleSave = async () => {
        if (!profile) return;

        setIsSaving(true);
        setSaveSuccess(false);

        const success = await updateProfile(profile.id, {
            username,
            full_name: fullName,
        });

        if (success) {
            await refresh();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }

        setIsSaving(false);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (userLoading) {
        return (
            <div className="max-w-3xl mx-auto p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="h-64 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-sm text-zinc-400">Manage your account and preferences.</p>
                </div>
                {isMentor && (
                    <Link href="/admin" className="text-amber-500 text-sm hover:underline flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Admin Panel →
                    </Link>
                )}
            </div>

            {/* Profile Section */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Profile</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-400">Username</Label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-400">Full Name</Label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-400">Username</Label>
                        <Input
                            value={profile?.username || ""}
                            disabled
                            className="bg-zinc-900 border-zinc-800 text-zinc-500"
                        />
                        <p className="text-[10px] text-zinc-600">Username cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-400">Role</Label>
                        <div className={cn(
                            "px-3 py-2 rounded-md border text-sm",
                            isMentor
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400"
                        )}>
                            {profile?.role === 'mentor' ? '👑 Mentor' : '📊 Member'}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                        ) : (
                            <><Save className="h-4 w-4 mr-2" />Save Changes</>
                        )}
                    </Button>
                    {saveSuccess && (
                        <span className="text-emerald-500 text-sm">✓ Saved successfully</span>
                    )}
                </div>
            </div>

            {/* Preferences Section */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Palette className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Preferences</h2>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white">Email Notifications</p>
                            <p className="text-xs text-zinc-500">Receive trade review updates via email</p>
                        </div>
                        <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white">Dark Mode</p>
                            <p className="text-xs text-zinc-500">Use dark color scheme (always on)</p>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={setDarkMode} disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white">Compact View</p>
                            <p className="text-xs text-zinc-500">Show more trades per page</p>
                        </div>
                        <Switch checked={compactView} onCheckedChange={setCompactView} />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <LogOut className="h-5 w-5 text-rose-500" />
                    <h2 className="text-sm font-semibold text-rose-500 uppercase tracking-wider">Session</h2>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white">Sign Out</p>
                        <p className="text-xs text-zinc-500">End your current session</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-rose-900/50 text-rose-500 hover:bg-rose-950/30"
                    >
                        <LogOut className="h-4 w-4 mr-2" />Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
