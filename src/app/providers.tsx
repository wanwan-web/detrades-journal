"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/hooks/useUser";
import QueryProvider from "@/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <UserProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </UserProvider>
        </QueryProvider>
    );
}
