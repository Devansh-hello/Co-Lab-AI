"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthProvider } from "../context/AuthContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "13px",
              fontFamily: "JetBrains Mono, monospace",
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
