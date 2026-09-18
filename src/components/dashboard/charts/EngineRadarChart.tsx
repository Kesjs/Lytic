import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';

export interface EngineRadarChartProps {
  data: { engine: string; mentioned: number; recommended: number; total: number }[];
}

// Remplace l'ancien radar à 4 axes (illisible en dessous de 5-6 catégories,
// se réduisait à un losange décoratif sans info exploitable) par des barres
// horizontales groupées : une ligne par moteur, deux barres (Mentions /
// Recommandations) avec le pourcentage affiché directement au bout. Lisible
// en un coup d'œil, sans avoir à décoder une forme géométrique.
export function EngineRadarChart({ data }: EngineRadarChartProps) {
  const chartData = data.map((d) => ({
    engine: d.engine,
    mentionsPct: Math.round((d.mentioned / d.total) * 100) || 0,
    recommendPct: Math.round((d.recommended / d.total) * 100) || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[140px] w-full items-center justify-center text-sm text-ink-muted">
        Aucune donnée par moteur pour la dernière mesure.
      </div>
    );
  }

  // Hauteur proportionnelle au nombre de moteurs plutôt que fixe (240px) :
  // évite le vide sous 3-4 lignes et s'adapte si un moteur est ajouté.
  const height = Math.max(140, chartData.length * 48 + 40);
  const percentLabel = (value: number) => `${value}%`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
          barGap={4}
          barCategoryGap="32%"
        >
          <CartesianGrid horizontal={false} stroke="rgb(var(--color-border))" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
            tickFormatter={percentLabel}
          />
          <YAxis
            type="category"
            dataKey="engine"
            tick={{ fill: 'rgb(var(--color-text))', fontSize: 12 }}
            width={78}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--color-surface))',
              borderColor: 'rgb(var(--color-border))',
              borderRadius: '8px',
            }}
            itemStyle={{ color: 'rgb(var(--color-text))' }}
            formatter={(value: number) => percentLabel(value)}
          />
          <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          <Bar name="Mentions" dataKey="mentionsPct" fill="#4c566a" radius={[0, 4, 4, 0]} barSize={10}>
            <LabelList
              dataKey="mentionsPct"
              position="right"
              formatter={percentLabel}
              style={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
            />
          </Bar>
          <Bar name="Recommandations" dataKey="recommendPct" fill="#00E5FF" radius={[0, 4, 4, 0]} barSize={10}>
            <LabelList
              dataKey="recommendPct"
              position="right"
              formatter={percentLabel}
              style={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
