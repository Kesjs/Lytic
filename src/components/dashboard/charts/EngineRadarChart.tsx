import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface EngineRadarChartProps {
  data: { engine: string; mentioned: number; recommended: number; total: number }[];
}

// Vrai radar (spider chart) — un axe par moteur IA, deux séries superposées
// (Mentions / Recommandations en %). L'ancienne version de ce composant
// était en réalité un bar chart malgré son nom ; ce rendu correspond à la
// maquette (forme en losange, axes = moteurs).
export function EngineRadarChart({ data }: EngineRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] w-full items-center justify-center text-center text-xs text-ink-muted">
        Aucune donnée par moteur pour la dernière mesure.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    engine: d.engine,
    Mentions: Math.round((d.mentioned / d.total) * 100) || 0,
    Recommandations: Math.round((d.recommended / d.total) * 100) || 0,
  }));

  const percentLabel = (value: number) => `${value}%`;

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="65%">
          <PolarGrid stroke="rgb(var(--color-border))" />
          <PolarAngleAxis
            dataKey="engine"
            tick={{ fill: 'rgb(var(--color-ink-secondary))', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'rgb(var(--color-ink-muted))', fontSize: 9 }}
            tickFormatter={percentLabel}
            axisLine={false}
          />
          <Radar
            name="Mentions"
            dataKey="Mentions"
            stroke="#eab308"
            fill="#eab308"
            fillOpacity={0.25}
          />
          <Radar
            name="Recommandations"
            dataKey="Recommandations"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--color-surface))',
              borderColor: 'rgb(var(--color-border))',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => percentLabel(value)}
            itemStyle={{ fontWeight: 600 }}
          />
          <Legend
            verticalAlign="bottom"
            height={24}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
