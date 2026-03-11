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
      const res = await api.get("/loggedin");
      setUser(res.data.loggedin);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response && err.response.status !== 401) {
        // Log unexpected errors
        console.error("Auth check failed:", err);
      }
      setUser(false);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
      // Small delay before allowing app to show for smooth transition
      setTimeout(() => {
        setCanShowApp(true);
      }, 100);
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