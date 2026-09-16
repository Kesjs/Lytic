import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface ShareOfVoiceChartProps {
  data: { name: string; mentions: number }[];
}

export function ShareOfVoiceChart({ data }: ShareOfVoiceChartProps) {
  // Assuming the first item is "Your Brand" (from our query)
  const COLORS = ['#00E5FF', '#3b4252', '#4c566a', '#d8dee9']; // Brand color, then neutral shades

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="mentions"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border))', borderRadius: '8px' }}
            itemStyle={{ color: 'rgb(var(--color-text))' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
