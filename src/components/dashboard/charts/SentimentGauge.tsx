import React from 'react';

export interface SentimentGaugeProps {
  data: { positive: number; neutral: number; negative: number };
}

// Anneau (donut gauge) avec le % positif dominant au centre, plus une
// légende compacte en dessous — remplace la version "3 chiffres en ligne +
// barre linéaire", qui restait correcte mais moins immédiatement lisible
// que l'anneau (le score qui compte le plus, en gros, au centre).
export function SentimentGauge({ data }: SentimentGaugeProps) {
  const total = data.positive + data.neutral + data.negative;
  if (total === 0) {
    return (
      <div className="flex min-h-[100px] items-center justify-center text-sm text-ink-muted">
        Pas de données
      </div>
    );
  }

  const segments = [
    { key: 'positive', value: data.positive, color: 'rgb(var(--color-success))', label: 'Positif' },
    { key: 'neutral', value: data.neutral, color: 'rgb(var(--color-ink-muted))', label: 'Neutre' },
    { key: 'negative', value: data.negative, color: 'rgb(var(--color-danger))', label: 'Négatif' },
  ] as const;

  const r = 32;
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r;
  let acc = 0;
  const positivePct = Math.round((data.positive / total) * 100);

  return (
    <div className="flex w-full flex-col items-center gap-2.5 py-1">
      <svg viewBox="0 0 80 80" className="h-[92px] w-[92px]" role="img" aria-label={`${positivePct}% de tonalité positive`}>
        {segments.map((s) => {
          if (s.value === 0) return null;
          const len = (s.value / total) * circumference;
          const dashOffset = -acc;
          acc += len;
          return (
            <circle
              key={s.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="9"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 1} textAnchor="middle" className="fill-ink-primary text-[15px] font-bold">
          {positivePct}%
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" className="fill-ink-muted text-[7px] uppercase tracking-wide">
          positif
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-ink-secondary">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block size-[6px] rounded-full" style={{ backgroundColor: s.color }} />
              {s.label} {Math.round((s.value / total) * 100)}%
            </span>
          ))}
      </div>
      <p className="text-center text-[10.5px] text-ink-muted">
        Analyse sémantique basée sur les {total} dernières observations.
      </p>
    </div>
  );
}
