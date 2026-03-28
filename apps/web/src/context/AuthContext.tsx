import React, { createContext, useState, useEffect, useContext } from "react";
import { AxiosError } from "axios";
import { api } from "../functions/send";

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: boolean | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  canShowApp: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [canShowApp, setCanShowApp] = useState<boolean>(false);

  const refresh = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/loggedin");
      setUser(res.data.loggedin);
      if (res.data.user) {
        setProfile(res.data.user);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response && err.response.status !== 401) {
        console.error("Auth check failed:", err);
      }
      setUser(false);
      setProfile(null);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
      setTimeout(() => {
        setCanShowApp(true);
      }, 100);
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Clear locally even if API fails
    }
    setUser(false);
    setProfile(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isInitialized, canShowApp, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
