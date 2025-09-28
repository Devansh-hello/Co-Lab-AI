import React, { createContext, useState, useEffect, useContext } from "react";
import { AxiosError } from "axios";
import { api } from "../functions/send";

interface AuthContextType {
  user: boolean | null;
  isLoading: boolean;
  isInitialized: boolean;
  canShowApp: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [canShowApp, setCanShowApp] = useState<boolean>(false);

  const refresh = async () => {
    try {
      setIsLoading(true);
      
      // Ensure minimum loading time for smooth UX
      const startTime = Date.now();
      const minLoadingTime = 1500; // 1.5 seconds minimum
      
      const res = await api.get("/loggedin");
      setUser(res.data.loggedin);
      setIsInitialized(true);
      
      // Calculate remaining time to meet minimum loading duration
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      // Wait for remaining time, then allow app to show with fade transition
      setTimeout(() => {
        setIsLoading(false);
        // Small delay before allowing app to show for smooth transition
        setTimeout(() => {
          setCanShowApp(true);
        }, 100);
      }, remainingTime);
      
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setUser(false);
      } else {
        setUser(false);
      }
      setIsInitialized(true);
      
      // Same timing logic for error case
      const elapsed = Date.now() - (Date.now() - 1500);
      const remainingTime = Math.max(0, 1500 - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => {
          setCanShowApp(true);
        }, 100);
      }, remainingTime);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, canShowApp, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}