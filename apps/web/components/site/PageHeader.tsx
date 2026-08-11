import { Container, Eyebrow } from "@/components/ui/primitives";

/**
 * Bandeau d'en-tête des pages intérieures — version compacte du hero, pour que
 * chaque page s'ouvre sur la même signature visuelle sans répéter la hauteur de
 * la page d'accueil.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-diplomatic-deep">
      <div className="pattern-islamic absolute inset-0" aria-hidden />
      <Container size="wide" className="relative py-14 sm:py-20">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(1.8rem,4.4vw,3rem)] font-bold leading-tight text-white">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-3xl text-body text-white/80">{intro}</p>}
        {children}
      </Container>
      <div className="rule-gold" />
    </section>
  );
}
