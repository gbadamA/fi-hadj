"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { modulesFor, type AdminModule, type AuthUser } from "@fihadj/shared-types";
import { api, refreshSession, setAccessToken } from "./api-client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Modules ouverts au rôle courant, dans l'ordre canonique. */
  modules: AdminModule[];
  can: (module: AdminModule) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => undefined,
  signOut: async () => undefined,
  modules: [],
  can: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Le jeton d'accès ne survit pas à un rechargement de page (il vit en mémoire).
   * On tente donc systématiquement une reprise de session via le cookie httpOnly :
   * sans cela, un simple F5 déconnecterait l'utilisateur.
   */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await refreshSession();
        if (!cancelled) setUser((session?.user as AuthUser) ?? null);
      } finally {
        // `finally` et non le chemin nominal : si la reprise de session échoue
        // pour une raison imprévue, l'écran doit basculer sur la connexion, pas
        // rester indéfiniment sur « Ouverture de la session… ».
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ accessToken: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    // L'échec de l'appel serveur ne doit pas empêcher la déconnexion locale :
    // l'utilisateur qui clique « se déconnecter » doit être déconnecté.
    await api.post("/auth/logout").catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  const modules = useMemo(() => modulesFor(user?.role), [user?.role]);
  const can = useCallback((module: AdminModule) => modules.includes(module), [modules]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, modules, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
