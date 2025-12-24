"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";

interface AuthContextType {
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType>({ isHydrated: false });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { accessToken, refreshToken, fetchUser, refreshAuth } = useAuthStore();

  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isHydrated && accessToken) {
      // Validate the token by fetching user
      fetchUser().catch(() => {
        // Token might be expired, try refresh
        if (refreshToken) {
          refreshAuth();
        }
      });
    }
  }, [isHydrated, accessToken, refreshToken, fetchUser, refreshAuth]);

  return (
    <AuthContext.Provider value={{ isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}
