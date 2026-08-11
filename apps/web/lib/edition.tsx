"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Edition } from "@fihadj/shared-types";
import { api } from "./api-client";
import { useResource } from "./use-resource";

/**
 * Édition sur laquelle travaille le back-office.
 *
 * Sans ce contexte, tous les modules interrogeaient l'API sans `editionId` et
 * portaient donc forcément sur l'édition COURANTE : impossible de préparer
 * l'année suivante pendant que le site public affiche encore l'année en cours.
 *
 * ⚠️ Le choix se propage aux LECTURES **et aux ÉCRITURES**. C'est le point
 * délicat : les endpoints de création retombent sur l'édition courante quand le
 * corps ne précise rien, si bien qu'ajouter une ligne en consultant 2026 l'aurait
 * silencieusement écrite dans 2025. Toute création d'une entité rattachée à une
 * édition doit passer `editionId: editionId` — d'où le helper `editionPayload`.
 */
const STORAGE_KEY = "fihadj:admin-edition";

interface EditionContextValue {
  editions: Edition[];
  edition: Edition | null;
  editionId: string | null;
  /** Faux quand on travaille sur une autre édition que celle publiée. */
  isCurrent: boolean;
  loading: boolean;
  setEditionId: (id: string) => void;
  reloadEditions: () => Promise<void>;
  /** Ajoute `editionId` à un chemin d'API, en respectant une query déjà présente. */
  withEdition: (path: string) => string;
  /** À fusionner dans le corps de toute création rattachée à une édition. */
  editionPayload: () => { editionId: string } | Record<string, never>;
}

const EditionContext = createContext<EditionContextValue>({
  editions: [],
  edition: null,
  editionId: null,
  isCurrent: true,
  loading: true,
  setEditionId: () => undefined,
  reloadEditions: async () => undefined,
  withEdition: (path) => path,
  editionPayload: () => ({}),
});

export function EditionProvider({ children }: { children: React.ReactNode }) {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await api.get<Edition[]>("/editions");
    setEditions(list);

    setEditionIdState((current) => {
      if (current && list.some((edition) => edition.id === current)) return current;
      // Choix mémorisé d'une session précédente, sinon l'édition courante.
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && list.some((edition) => edition.id === stored)) return stored;
      return list.find((edition) => edition.isCurrent)?.id ?? list[0]?.id ?? null;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load().catch(() => setLoading(false));
  }, [load]);

  const setEditionId = useCallback((id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id);
    setEditionIdState(id);
  }, []);

  const edition = useMemo(
    () => editions.find((item) => item.id === editionId) ?? null,
    [editions, editionId],
  );

  const withEdition = useCallback(
    (path: string) => {
      if (!editionId) return path;
      return `${path}${path.includes("?") ? "&" : "?"}editionId=${editionId}`;
    },
    [editionId],
  );

  const editionPayload = useCallback(
    () => (editionId ? { editionId } : ({} as Record<string, never>)),
    [editionId],
  );

  return (
    <EditionContext.Provider
      value={{
        editions,
        edition,
        editionId,
        isCurrent: edition?.isCurrent ?? true,
        loading,
        setEditionId,
        reloadEditions: load,
        withEdition,
        editionPayload,
      }}
    >
      {children}
    </EditionContext.Provider>
  );
}

export const useEdition = () => useContext(EditionContext);

/**
 * Charge une ressource rattachée à l'édition sélectionnée.
 *
 * Tant que l'édition n'est pas connue, on passe `null` à `useResource` : la
 * requête n'est pas lancée et la page reste en chargement, au lieu d'appeler
 * d'abord l'édition courante puis de tout recharger.
 */
export function useEditionResource<T>(path: string | null) {
  const { withEdition, editionId, loading } = useEdition();
  const resolved = loading || !editionId || path === null ? null : withEdition(path);
  return useResource<T>(resolved);
}
