"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/hooks/useUser";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}
