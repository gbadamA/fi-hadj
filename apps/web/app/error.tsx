"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button, ButtonLink, Container } from "@/components/ui/primitives";

/**
 * Filet de sécurité global. En pratique, la cause la plus fréquente sur ce projet
 * est une API arrêtée : le message le dit explicitement plutôt que d'afficher une
 * trace technique à un visiteur.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FI-HADJ] rendu interrompu :", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-diplomatic-deep">
      <div className="pattern-islamic absolute inset-0" aria-hidden />
      <Container size="narrow" className="relative text-center">
        <h1 className="font-display text-h1 text-white">Le contenu n&apos;a pas pu être chargé</h1>
        <p className="mx-auto mt-4 max-w-lg text-body text-white/75">
          Le site n&apos;a pas réussi à joindre le service de contenu du forum. Réessayez dans un
          instant ; si le problème persiste, signalez-le au Commissariat Général.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-caption text-white/50">Référence : {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={reset}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer
          </Button>
          <ButtonLink
            href="/"
            variant="ghost"
            className="border-white/40 text-white hover:border-secondary hover:text-secondary"
          >
            Retour à l&apos;accueil
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
