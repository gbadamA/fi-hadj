import type { ReactNode } from "react";

/**
 * Rendu des blocs de texte du back-office.
 *
 * Volontairement minimal : paragraphes séparés par une ligne vide et **gras**.
 * Pas de moteur Markdown complet — le contenu vient d'un champ texte du
 * back-office, pas d'un éditeur riche, et faire passer du HTML arbitraire
 * ouvrirait une porte à l'injection.
 */
export function RichText({ body, className }: { body: string; className?: string }) {
  const blocks = body.split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <p key={index} className="mb-4 whitespace-pre-line leading-relaxed last:mb-0">
          {renderBold(block)}
        </p>
      ))}
    </div>
  );
}

function renderBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-light-text dark:text-dark-text">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
