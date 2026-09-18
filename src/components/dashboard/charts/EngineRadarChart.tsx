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
} from 'recharts';

export interface EngineRadarChartProps {
  data: { engine: string; mentioned: number; recommended: number; total: number }[];
}

export function EngineRadarChart({ data }: EngineRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center text-sm text-ink-muted">
        Aucune donnée par moteur pour la dernière mesure.
      </div>
    );
  }

  // Brand color (Yellow) and vibrant modern colors
  const COLORS = ['#eab308', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];

  const engines = data.map(d => d.engine);
  
  // Transform data so metrics are on the X axis, and AIs are the bars
  const mentionsData: any = { metric: 'Mentions' };
  const recomData: any = { metric: 'Recommandations' };
  
  data.forEach(d => {
    mentionsData[d.engine] = Math.round((d.mentioned / d.total) * 100) || 0;
    recomData[d.engine] = Math.round((d.recommended / d.total) * 100) || 0;
  });
  
  const chartData = [mentionsData, recomData];
  const percentLabel = (value: number) => `${value}%`;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          barGap={6}
          barCategoryGap="25%"
        >
          <CartesianGrid vertical={false} stroke="rgb(var(--color-border))" strokeDasharray="3 3" />
          <XAxis
            dataKey="metric"
            tick={{ fill: 'rgb(var(--color-ink-primary))', fontSize: 13, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'rgb(var(--color-ink-muted))', fontSize: 11 }}
            tickFormatter={percentLabel}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--color-surface))',
              borderColor: 'rgb(var(--color-border))',
              borderRadius: '12px',
              padding: '8px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            formatter={(value: number) => percentLabel(value)}
            itemStyle={{ fontWeight: 600 }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
          {engines.map((engine, index) => (
            <Bar 
              key={engine} 
              name={engine} 
              dataKey={engine} 
              fill={COLORS[index % COLORS.length]} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
