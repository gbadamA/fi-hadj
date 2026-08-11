"use client";

/**
 * Accès à l'API depuis le NAVIGATEUR : formulaires publics et back-office.
 *
 * Le jeton d'accès vit uniquement en MÉMOIRE (variable de module). Il n'est ni
 * dans le localStorage ni dans un cookie lisible par JavaScript : un script
 * injecté ne peut pas le voler. Au rechargement de la page il est perdu, et
 * `refresh()` en obtient un nouveau grâce au cookie httpOnly posé à la connexion.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3051";

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export interface ApiClientError extends Error {
  status: number;
  /** Erreurs par champ renvoyées par la validation Zod de l'API. */
  fieldErrors?: Record<string, string[]>;
}

function buildError(status: number, body: unknown): ApiClientError {
  const payload = body as { message?: string | string[]; errors?: Record<string, string[]> };
  const message = Array.isArray(payload?.message)
    ? payload.message.join(", ")
    : (payload?.message ?? "Une erreur est survenue");
  const error = new Error(message) as ApiClientError;
  error.status = status;
  error.fieldErrors = payload?.errors;
  return error;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Ne pas tenter de rafraîchir la session sur un 401 (évite une boucle). */
  skipRefresh?: boolean;
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const { body, skipRefresh: _skip, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  return fetch(`${API_URL}${path}`, {
    ...rest,
    // `credentials: include` est indispensable : sans lui le navigateur n'envoie
    // pas le cookie de rafraîchissement vers une origine différente.
    credentials: "include",
    headers: {
      ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(body !== undefined && {
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    }),
  });
}

/**
 * Rafraîchissement en cours, partagé par tous les appelants simultanés.
 *
 * ⚠️ Indispensable, pas une optimisation. L'API applique une ROTATION STRICTE :
 * chaque jeton de rafraîchissement est révoqué dès qu'il sert, et le voir passer
 * une seconde fois est interprété comme un vol de jeton — l'API révoque alors
 * TOUTES les sessions de l'utilisateur. Deux appels concurrents partent donc avec
 * le même cookie et détruisent la session.
 *
 * Le cas se produit sans rien faire d'exotique : double montage d'effet de React
 * en développement, deux onglets ouverts, ou plusieurs requêtes qui expirent
 * ensemble et déclenchent chacune un renouvellement.
 */
let inFlightRefresh: Promise<{ accessToken: string; user: unknown } | null> | null = null;

/**
 * Renouvelle le jeton d'accès. Exposée pour que le fournisseur d'authentification
 * puisse restaurer une session au chargement de la page.
 */
export function refreshSession(): Promise<{ accessToken: string; user: unknown } | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        accessToken = null;
        return null;
      }
      const body = (await response.json()) as { accessToken: string; user: unknown };
      accessToken = body.accessToken;
      return body;
    } catch {
      // Réseau injoignable : on traite comme une absence de session plutôt que
      // de propager, sinon l'appelant reste bloqué sur son écran de chargement.
      accessToken = null;
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await rawRequest(path, options);

  // Jeton d'accès expiré (15 min) : on le renouvelle une seule fois et on rejoue
  // la requête. Sans cela l'utilisateur serait déconnecté toutes les 15 minutes.
  if (response.status === 401 && !options.skipRefresh) {
    const renewed = await refreshSession();
    if (renewed) response = await rawRequest(path, { ...options, skipRefresh: true });
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw buildError(response.status, payload);
  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

/**
 * Téléchargement d'un fichier produit par l'API (CSV, PDF).
 *
 * ⚠️ L'ancre DOIT être insérée dans le DOM avant `click()` : certains navigateurs
 * ignorent silencieusement un clic sur un élément détaché, et le téléchargement
 * ne part jamais sans la moindre erreur en console.
 */
export async function downloadFromApi(path: string, fallbackName: string): Promise<void> {
  let response = await rawRequest(path, {});
  if (response.status === 401) {
    const renewed = await refreshSession();
    if (renewed) response = await rawRequest(path, { skipRefresh: true });
  }
  if (!response.ok) throw buildError(response.status, await response.json().catch(() => null));

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = match?.[1] ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Révocation différée : révoquer immédiatement annule le téléchargement sur
  // certains navigateurs, qui n'ont pas encore lu le blob.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export { API_URL };
