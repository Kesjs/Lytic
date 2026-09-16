import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface EngineRadarChartProps {
  data: { engine: string; mentioned: number; recommended: number; total: number }[];
}

export function EngineRadarChart({ data }: EngineRadarChartProps) {
  // Normalize data for radar
  const chartData = data.map(d => ({
    engine: d.engine,
    mentionsPct: Math.round((d.mentioned / d.total) * 100) || 0,
    recommendPct: Math.round((d.recommended / d.total) * 100) || 0,
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgb(var(--color-border))" />
          <PolarAngleAxis dataKey="engine" tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Mentions (%)" dataKey="mentionsPct" stroke="#4c566a" fill="#4c566a" fillOpacity={0.3} />
          <Radar name="Recommandations (%)" dataKey="recommendPct" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.6} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border))', borderRadius: '8px' }}
            itemStyle={{ color: 'rgb(var(--color-text))' }}
          />
          <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
