import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-zinc-800/50",
                className
            )}
            {...props}
        />
    );
}

// Preset skeleton patterns for common use cases
export function SkeletonCard() {
    return (
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
            </div>
            {/* Rows */}
            <div className="divide-y divide-zinc-800/50">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
