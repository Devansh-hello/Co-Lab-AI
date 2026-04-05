"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[next-app] Global route error:", error);
  }, [error]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 20px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ color: "rgba(255,255,255,0.72)", marginBottom: 22 }}>
        A route-level error occurred while rendering this page.
      </p>
      <button
        onClick={reset}
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          borderRadius: 8,
          padding: "10px 14px",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </main>
  );
}
