"use client";

import { useEffect, useState } from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingFrom(target: number): Remaining | null {
  const delta = target - Date.now();
  if (delta <= 0) return null;
  return {
    days: Math.floor(delta / 86_400_000),
    hours: Math.floor((delta / 3_600_000) % 24),
    minutes: Math.floor((delta / 60_000) % 60),
    seconds: Math.floor((delta / 1000) % 60),
  };
}

/**
 * Compte à rebours jusqu'à l'ouverture.
 *
 * ⚠️ Rien n'est calculé au rendu serveur : l'écart entre l'horloge du serveur et
 * celle du visiteur produirait une erreur d'hydratation. Le composant reste vide
 * jusqu'au premier effet côté client.
 *
 * Une fois la date passée, il ne s'affiche pas du tout — un « J-0 » figé sur une
 * édition écoulée donne l'impression d'un site abandonné.
 */
export function Countdown({ startDate }: { startDate: string }) {
  const target = new Date(startDate).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRemaining(remainingFrom(target));
    const timer = setInterval(() => setRemaining(remainingFrom(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (!mounted || !remaining) return null;

  const units: [number, string][] = [
    [remaining.days, remaining.days > 1 ? "jours" : "jour"],
    [remaining.hours, "heures"],
    [remaining.minutes, "minutes"],
    [remaining.seconds, "secondes"],
  ];

  return (
    <div className="flex flex-wrap gap-3" role="timer" aria-label="Temps restant avant l'ouverture">
      {units.map(([value, label]) => (
        <div
          key={label}
          className="min-w-[74px] rounded-md border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur"
        >
          <div className="font-display text-2xl font-bold tabular-nums text-white">
            {String(value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/70">{label}</div>
        </div>
      ))}
    </div>
  );
}
