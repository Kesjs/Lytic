import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface ShareOfVoiceChartProps {
  data: { name: string; mentions: number }[];
}

export function ShareOfVoiceChart({ data }: ShareOfVoiceChartProps) {
  // Brand color (Yellow) and vibrant modern colors
  const COLORS = ['#eab308', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={5}
            dataKey="mentions"
            stroke="none"
            cornerRadius={6}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border))', borderRadius: '12px', padding: '8px 12px' }}
            itemStyle={{ color: 'rgb(var(--color-ink-primary))', fontWeight: 600 }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
