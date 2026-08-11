"use client";

import { formatDateShort, formatNumber } from "@fihadj/shared-types";

/**
 * Graphiques en SVG écrit à la main.
 *
 * Pas de bibliothèque de charting : deux formes suffisent ici (une courbe et des
 * barres), et un SVG maison hérite naturellement des couleurs de la DA, du thème
 * clair/sombre et de l'impression, sans 200 Ko de dépendance.
 */

export function CumulativeChart({
  points,
  height = 200,
}: {
  points: { date: string; count: number }[];
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <p className="py-10 text-center text-caption text-light-muted dark:text-dark-muted">
        Pas encore assez d&apos;inscriptions pour tracer une évolution.
      </p>
    );
  }

  const width = 720;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((p) => p.count));

  const x = (index: number) => padding.left + (index / (points.length - 1)) * innerWidth;
  const y = (value: number) => padding.top + innerHeight - (value / max) * innerHeight;

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.count)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${padding.top + innerHeight} L${padding.left},${padding.top + innerHeight} Z`;

  // Quatre repères horizontaux : assez pour situer une valeur, assez peu pour
  // ne pas transformer le fond en grille.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`Évolution cumulée des inscriptions, de ${formatDateShort(points[0]!.date)} à ${formatDateShort(points[points.length - 1]!.date)}, jusqu'à ${max} inscriptions.`}
    >
      <defs>
        <linearGradient id="fihadj-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-primary))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="rgb(var(--c-primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="currentColor"
            strokeOpacity="0.12"
          />
          <text
            x={padding.left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            className="fill-current text-[10px] opacity-50"
          >
            {formatNumber(tick)}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#fihadj-area)" />
      <path d={line} fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2.5" strokeLinejoin="round" />

      {points.map((point, index) => (
        <circle key={point.date} cx={x(index)} cy={y(point.count)} r="3" fill="rgb(var(--c-secondary))">
          <title>{`${formatDateShort(point.date)} — ${point.count} inscription(s)`}</title>
        </circle>
      ))}

      <text x={padding.left} y={height - 8} className="fill-current text-[10px] opacity-50">
        {formatDateShort(points[0]!.date)}
      </text>
      <text
        x={width - padding.right}
        y={height - 8}
        textAnchor="end"
        className="fill-current text-[10px] opacity-50"
      >
        {formatDateShort(points[points.length - 1]!.date)}
      </text>
    </svg>
  );
}

/** Barres horizontales — lisibles même avec des libellés longs, à l'inverse d'un camembert. */
export function BarList({
  items,
}: {
  items: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-caption">
            <span className="truncate">{item.label}</span>
            <span className="font-medium tabular-nums">{formatNumber(item.value)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-light-surface-alt dark:bg-dark-surface-alt">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? "rgb(var(--c-primary))",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Jauge de progression vers un objectif (taux de remplissage, objectif d'impact). */
export function Gauge({
  value,
  target,
  label,
  suffix,
}: {
  value: number;
  target: number;
  label: string;
  suffix?: string;
}) {
  const ratio = target === 0 ? 0 : Math.min(1, value / target);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption text-light-muted dark:text-dark-muted">{label}</span>
        <span className="text-caption font-medium tabular-nums">
          {formatNumber(value)} / {formatNumber(target)}
          {suffix}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-light-surface-alt dark:bg-dark-surface-alt">
        <div
          className="h-full rounded-full bg-gold"
          style={{ width: `${Math.max(ratio * 100, value > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className="mt-1 text-caption text-light-muted dark:text-dark-muted">
        {Math.round(ratio * 100)} % de l&apos;objectif
      </p>
    </div>
  );
}
