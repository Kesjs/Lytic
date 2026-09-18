import React from 'react';

export interface SentimentGaugeProps {
  data: { positive: number; neutral: number; negative: number };
}

// Ce composant n'affiche que 3 chiffres + une barre : il n'a pas besoin
// d'une hauteur figée à 250px (ça créait un grand vide sous le contenu).
// La hauteur suit maintenant le contenu réel.
export function SentimentGauge({ data }: SentimentGaugeProps) {
  const total = data.positive + data.neutral + data.negative;
  if (total === 0) {
    return (
      <div className="flex min-h-[100px] items-center justify-center text-sm text-ink-muted">
        Pas de données
      </div>
    );
  }

  const chartData = [
    { name: 'Positif', value: data.positive, color: '#10b981' }, // emerald-500
    { name: 'Neutre', value: data.neutral, color: '#94a3b8' },   // slate-400
    { name: 'Négatif', value: data.negative, color: '#ef4444' }, // red-500
  ];

  return (
    <div className="w-full px-1">
      <div className="flex w-full justify-between">
        {chartData.map((d, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl font-light tracking-tight" style={{ color: d.color }}>
              {Math.round((d.value / total) * 100)}
              <span className="text-base">%</span>
            </div>
            <div className="mt-0.5 text-xs uppercase tracking-wider font-medium text-ink-muted">
              {d.name}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar Gauge */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-canvas shadow-inner">
        {chartData.map((d, i) => (
          <div
            key={i}
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }}
            className="h-full transition-all duration-1000 ease-out hover:opacity-90"
            title={`${d.name}: ${d.value} mentions`}
          />
        ))}
      </div>

      <div className="mt-2.5 text-center text-xs text-ink-muted">
        Analyse sémantique basée sur les {total} dernières observations.
      </div>
    </div>
  );
}
