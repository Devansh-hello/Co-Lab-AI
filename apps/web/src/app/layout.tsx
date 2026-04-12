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
    <html lang="en" className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Manrope:wght@200..800&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
        />
      </head>
      <body className="m-0 min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
