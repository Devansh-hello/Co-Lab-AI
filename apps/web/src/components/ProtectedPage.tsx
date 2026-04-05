"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import MainLoadingScreen from "./MainLoadingScreen";

export function ProtectedPage({ children }: { children: ReactNode }) {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized && !isLoading && user === false) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isInitialized, isLoading, user, router, pathname]);

  if (!isInitialized || isLoading || user === null || user === false) {
    return <MainLoadingScreen label="Verifying session" />;
  }

  return <>{children}</>;
}
