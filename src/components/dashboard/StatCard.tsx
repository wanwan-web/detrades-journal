import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Check } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    trend?: { value: string; type: "up" | "down" | "neutral" };
    valueColor?: "emerald" | "rose" | "amber" | "indigo" | "white";
    icon?: LucideIcon;
}

const valueColorMap = { emerald: "text-emerald-500", rose: "text-rose-500", amber: "text-amber-500", indigo: "text-indigo-400", white: "text-white" };
const trendColorMap = { up: "text-emerald-500", down: "text-rose-500", neutral: "text-zinc-500" };

export function StatCard({ title, value, trend, valueColor = "white", icon: Icon }: StatCardProps) {
    return (
        <div className="stat-card p-5 rounded-xl bg-zinc-900/40 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className={cn("stat-number font-mono text-3xl font-bold", valueColorMap[valueColor])}>{value}</span>
                {Icon && <Icon className={cn("h-4 w-4", valueColorMap[valueColor])} />}
            </div>
            {trend && (
                <div className={cn("mt-2 flex items-center gap-1 text-xs", trendColorMap[trend.type])}>
                    {trend.type === "up" && <TrendingUp className="h-3 w-3" />}
                    {trend.type === "down" && <TrendingDown className="h-3 w-3" />}
                    {trend.type === "neutral" && <Check className="h-3 w-3" />}
                    <span>{trend.value}</span>
                </div>
            )}
        </div>
    );
}
