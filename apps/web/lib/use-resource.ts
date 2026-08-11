"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type ApiClientError } from "./api-client";

interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Mise à jour locale immédiate, sans aller-retour réseau. */
  set: (value: T) => void;
}

/**
 * Chargement d'une ressource du back-office.
 *
 * Le `path` sert de dépendance : changer de filtre ou d'édition relance la
 * requête sans qu'on ait à câbler un effet supplémentaire dans chaque page.
 *
 * ⚠️ `path === null` signifie « pas encore prêt », pas « rien à charger » :
 * l'état reste en chargement. C'est ce qui évite qu'une page clignote en
 * « aucune donnée » le temps que l'édition sélectionnée soit connue.
 */
export function useResource<T>(path: string | null): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.get<T>(path));
    } catch (caught) {
      const apiError = caught as ApiClientError;
      setError(
        apiError.status === 403
          ? "Votre rôle ne donne pas accès à ces données."
          : (apiError.message ?? "Chargement impossible"),
      );
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, set: setData };
}
