import React, { createContext, useState, useEffect, useContext } from "react";
import  { AxiosError } from "axios";
import {api} from "../functions/send"; 

interface AuthContextType {
  user: boolean | null;          
  refresh: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<boolean | null>(null);

  const refresh = async () => {
    try {
      const res = await api.get("/loggedin");
      setUser(res.data.loggedin);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setUser(false);
      } else {
        setUser(false);
      }
    }
  };

  useEffect(() => {
    refresh(); 
  }, []);

  return (
    <AuthContext.Provider value={{ user, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
