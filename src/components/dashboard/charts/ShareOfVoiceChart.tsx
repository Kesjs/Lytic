import React from 'react';

export interface ShareOfVoiceChartProps {
  data: { name: string; mentions: number }[];
}

// Ex-donut (pie chart) : remplacé par des barres horizontales, comme pour
// Moteurs IA. Les valeurs de `mentions` sont des comptages indépendants,
// pas des parts d'un tout qui somment à 100 — un donut suggérait à tort
// une répartition, alors qu'une barre par marque (normalisée sur la valeur
// max du set) représente fidèlement la donnée et reste lisible à toute
// largeur, contrairement à la légende du donut qui se compressait.
export function ShareOfVoiceChart({ data }: ShareOfVoiceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] w-full items-center justify-center text-center text-xs text-ink-muted">
        Aucune donnée de part de voix.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.mentions), 1);

  return (
    <div className="flex w-full flex-col justify-center gap-2.5 py-1">
      {data.map((d, i) => (
        <div
          key={d.name}
          className="flex items-center gap-2"
          title={`${d.name} — ${d.mentions} mention${d.mentions > 1 ? 's' : ''}`}
        >
          <span className="w-14 shrink-0 truncate text-xs text-ink-secondary sm:w-[70px]" title={d.name}>
            {d.name}
          </span>
          <div className="h-[7px] min-w-[24px] flex-1 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                // Première entrée = "Your Brand" (voir computeLatestRunInsights) → mise en avant en jaune brand.
                width: `${Math.max(4, Math.round((d.mentions / max) * 100))}%`,
                backgroundColor: i === 0 ? 'rgb(var(--color-brand))' : 'rgb(var(--color-ink-muted))',
              }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-primary">
            {d.mentions}
          </span>
        </div>
      ))}
    </div>
  );
}
