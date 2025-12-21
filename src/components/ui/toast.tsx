"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Helper function for easy toast creation
export function toast(options: Omit<Toast, "id">) {
    // This is a placeholder - actual implementation needs provider
    console.warn("Toast called outside provider:", options);
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).slice(2, 9);
        const newToast = { ...toast, id };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration ?? 4000;
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

// Toast Container
function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Individual Toast
const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle }> = {
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle },
    error: { bg: "bg-rose-500/10", border: "border-rose-500/30", icon: AlertCircle },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle },
    info: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", icon: Info },
};

const toastIconColors: Record<ToastType, string> = {
    success: "text-emerald-500",
    error: "text-rose-500",
    warning: "text-amber-500",
    info: "text-indigo-500",
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const style = toastStyles[toast.type];
    const Icon = style.icon;

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm",
                "animate-in slide-in-from-right-full fade-in duration-300",
                style.bg,
                style.border
            )}
            role="alert"
        >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", toastIconColors[toast.type])} />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.title}</p>
                {toast.description && (
                    <p className="text-xs text-zinc-400 mt-1">{toast.description}</p>
                )}
            </div>

            <button
                onClick={onClose}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                aria-label="Close"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// Shorthand functions
export const toastSuccess = (title: string, description?: string) => ({
    type: "success" as const,
    title,
    description,
});

export const toastError = (title: string, description?: string) => ({
    type: "error" as const,
    title,
    description,
});

export const toastWarning = (title: string, description?: string) => ({
    type: "warning" as const,
    title,
    description,
});

export const toastInfo = (title: string, description?: string) => ({
    type: "info" as const,
    title,
    description,
});
