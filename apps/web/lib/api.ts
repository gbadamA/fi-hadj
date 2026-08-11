/**
 * Accès à l'API depuis le SERVEUR Next (composants serveur, métadonnées).
 *
 * `API_URL` est distincte de `NEXT_PUBLIC_API_URL` : en production le rendu
 * serveur peut joindre l'API par le réseau interne, sans repasser par le nom de
 * domaine public.
 */
const API_URL = process.env.API_URL ?? "http://localhost:3051";

/** Le contenu institutionnel change rarement : 60 s de cache suffisent. */
const DEFAULT_REVALIDATE = 60;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(
  path: string,
  options: { revalidate?: number | false } = {},
): Promise<T> {
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE;
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    ...(revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate } }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, path, `GET ${path} → ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * Variante tolérante : renvoie `null` au lieu de lever.
 *
 * Une section secondaire (actualités, exposants) ne doit pas faire tomber toute
 * la page d'accueil parce que son endpoint a hoqueté. Les données essentielles,
 * elles, passent par `apiGet` — leur absence doit bien casser le rendu.
 */
export async function apiGetSafe<T>(
  path: string,
  options: { revalidate?: number | false } = {},
): Promise<T | null> {
  try {
    return await apiGet<T>(path, options);
  } catch {
    return null;
  }
}
