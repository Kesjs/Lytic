import React from 'react';
import { getEngineLabel, getEngineColor } from '~/lib/engine-labels';

export interface EngineRadarChartProps {
  data: { engine: string; mentioned: number; recommended: number; total: number }[];
}

// Ex-radar (spider chart) : remplacé par des barres horizontales. Le radar
// n'avait jamais assez de largeur dans une colonne étroite pour afficher
// ses 4 labels d'axes sans les tronquer ("Clauc", "pilot") — une barre par
// moteur reste lisible à n'importe quelle largeur de conteneur, y compris
// en dessous de 190px.
export function EngineRadarChart({ data }: EngineRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] w-full items-center justify-center text-center text-xs text-ink-muted">
        Aucune donnée par moteur pour la dernière mesure.
      </div>
    );
  }

  const rows = data
    .map((d, i) => ({
      engine: d.engine,
      engineLabel: getEngineLabel(d.engine),
      mentionedPct: d.total > 0 ? Math.round((d.mentioned / d.total) * 100) : 0,
      recommendedPct: d.total > 0 ? Math.round((d.recommended / d.total) * 100) : 0,
      color: getEngineColor(d.engine, i),
    }))
    .sort((a, b) => b.mentionedPct - a.mentionedPct);

  return (
    <div className="flex w-full flex-col justify-center gap-2.5 py-1">
      {rows.map((r) => (
        <div
          key={r.engine}
          className="flex items-center gap-2"
          title={`${r.engineLabel} — Mentionné ${r.mentionedPct}%, Recommandé ${r.recommendedPct}%`}
        >
          <span className="w-14 shrink-0 truncate text-xs text-ink-secondary sm:w-[70px]" title={r.engineLabel}>
            {r.engineLabel}
          </span>
          <div className="h-[7px] min-w-[24px] flex-1 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${r.mentionedPct}%`, backgroundColor: r.color }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-primary">
            {r.mentionedPct}%
          </span>
        </div>
      ))}
    </div>
  );
}
