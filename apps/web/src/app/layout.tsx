import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "../index.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "Co-Lab AI",
  description: "AI engineering team workspace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 min-h-screen bg-background text-foreground antialiased">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
