"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) { setError(error.message); setIsLoading(false); return; }
            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white font-bold text-sm font-mono shadow-lg logo-glow">D</div>
                    <span className="font-bold tracking-wider text-white text-xl">DETRADES</span>
                    <span className="text-xs font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700">OS</span>
                </div>
            </div>

            <h2 className="text-center text-lg font-medium text-white mb-2">Internal Access Only</h2>
            <p className="text-center text-sm text-zinc-500 mb-8">Enter your team credentials to continue.</p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-sm">
                    <AlertCircle className="h-4 w-4" />{error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-zinc-400 ml-1">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950 border-zinc-800 pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 placeholder-zinc-600" placeholder="name@company.com" required />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-zinc-400 ml-1">Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-950 border-zinc-800 pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 placeholder-zinc-600" placeholder="••••••••" required />
                    </div>
                </div>
                <Button type="submit" disabled={isLoading} className="cta-primary w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-6 border-0">
                    {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><span>Enter Command Center</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-zinc-800 text-center"><p className="text-[10px] text-zinc-600">Restricted System. IP Address Logged.</p></div>
        </div>
    );
}
