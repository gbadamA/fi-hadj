import { ButtonLink, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-diplomatic-deep">
      <div className="pattern-islamic absolute inset-0" aria-hidden />
      <Container size="narrow" className="relative text-center">
        <p className="font-display text-[clamp(4rem,12vw,7rem)] font-bold leading-none text-secondary">
          404
        </p>
        <h1 className="mt-4 font-display text-h1 text-white">Cette page n&apos;existe pas</h1>
        <p className="mx-auto mt-4 max-w-md text-body text-white/75">
          Le lien est peut-être obsolète, ou la page a été déplacée depuis une précédente édition
          du forum.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="secondary">
            Retour à l&apos;accueil
          </ButtonLink>
          <ButtonLink
            href="/contact"
            variant="ghost"
            className="border-white/40 text-white hover:border-secondary hover:text-secondary"
          >
            Nous signaler le problème
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
