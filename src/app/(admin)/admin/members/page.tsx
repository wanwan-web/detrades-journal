"use client";

import { useEffect, useState } from "react";
import { UserPlus, Search, X, Trash2, RefreshCw, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAllProfiles, updateProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function MembersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    // New member form
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const loadProfiles = async () => {
        setIsLoading(true);
        const data = await getAllProfiles();
        setProfiles(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const filteredProfiles = profiles.filter(p =>
        p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = profiles.filter(p => p.is_active).length;

    const handleToggleActive = async (profile: Profile) => {
        const success = await updateProfile(profile.id, { is_active: !profile.is_active });
        if (success) loadProfiles();
    };

    const handleCreateMember = async () => {
        if (!newEmail || !newName) return;

        setIsCreating(true);
        try {
            // Note: In production, this would be an admin function to create users
            // For now we just show the flow
            alert(`Member creation would send invite to: ${newEmail}`);
            setShowAddModal(false);
            setNewName("");
            setNewEmail("");
        } catch {
            alert("Failed to create member");
        }
        setIsCreating(false);
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-zinc-800 rounded w-1/3" />
                    <div className="h-80 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Team Roster</h1>
                    <p className="text-sm text-zinc-400">Manage access and account details.</p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                    <UserPlus className="mr-2" />Add New Member
                </Button>
            </div>

            {/* Member Table */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-zinc-500" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="bg-zinc-950 border-zinc-800 pl-9 pr-3 w-64 text-sm"
                        />
                    </div>
                    <div className="text-xs text-zinc-500">
                        Total: <span className="text-white font-bold">{activeCount} Active</span>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">User Profile</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Joined Date</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 text-sm">
                        {filteredProfiles.map((profile) => (
                            <tr
                                key={profile.id}
                                className={cn(
                                    "hover:bg-zinc-900/50 transition-colors",
                                    !profile.is_active && "opacity-70"
                                )}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                                            profile.role === 'mentor'
                                                ? "bg-gradient-to-tr from-amber-500 to-orange-500"
                                                : profile.is_active
                                                    ? "bg-gradient-to-tr from-indigo-500 to-purple-500"
                                                    : "bg-zinc-700"
                                        )}>
                                            {profile.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className={cn("font-bold", profile.is_active ? "text-white" : "text-zinc-400")}>
                                                {profile.username}
                                            </p>
                                            <p className="text-xs text-zinc-500">{profile.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {profile.role === 'mentor' ? (
                                        <span className="text-amber-500 font-bold flex items-center gap-1">
                                            <Crown className="h-4 w-4" />Admin
                                        </span>
                                    ) : (
                                        <span className="text-zinc-300">Trader</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                                        profile.is_active
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-zinc-800 text-zinc-500 border-zinc-700"
                                    )}>
                                        {profile.is_active ? "ACTIVE" : "SUSPENDED"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {profile.role === 'mentor' ? (
                                        <span className="text-zinc-700 text-xs">--</span>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleActive(profile)}
                                                className={cn(
                                                    "text-xs underline transition-colors",
                                                    profile.is_active
                                                        ? "text-zinc-500 hover:text-rose-500"
                                                        : "text-zinc-500 hover:text-emerald-500"
                                                )}
                                            >
                                                {profile.is_active ? "Suspend" : "Re-Activate"}
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                            <X className="text-lg" />
                        </button>

                        <h2 className="text-lg font-bold text-white mb-1">Add New Trader</h2>
                        <p className="text-xs text-zinc-500 mb-6">Create a new account for your team member.</p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Full Name / Username</label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. John_Trade"
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Email Address</label>
                                <Input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="e.g. john@detrades.com"
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Initial Password</label>
                                <Input
                                    value="Detrades2024!"
                                    readOnly
                                    className="bg-zinc-950 border-zinc-800 font-mono"
                                />
                                <p className="text-[10px] text-zinc-600">Member must change this upon first login.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 border-zinc-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateMember}
                                    disabled={isCreating || !newEmail || !newName}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                                >
                                    {isCreating ? "Creating..." : "Create Account"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
