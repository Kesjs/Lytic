import React from 'react';

export interface SentimentGaugeProps {
  data: { positive: number; neutral: number; negative: number };
}

export function SentimentGauge({ data }: SentimentGaugeProps) {
  const total = data.positive + data.neutral + data.negative;
  if (total === 0) {
    return <div className="h-[250px] flex items-center justify-center text-text-muted">Pas de données</div>;
  }

  const chartData = [
    { name: 'Positif', value: data.positive, color: '#10b981' }, // emerald-500
    { name: 'Neutre', value: data.neutral, color: '#94a3b8' },   // slate-400
    { name: 'Négatif', value: data.negative, color: '#ef4444' }  // red-500
  ];

  return (
    <div className="h-[250px] w-full flex flex-col items-center justify-center px-4">
      <div className="w-full flex justify-between mb-8">
        {chartData.map((d, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-light tracking-tight" style={{ color: d.color }}>
              {Math.round((d.value / total) * 100)}<span className="text-lg">%</span>
            </div>
            <div className="text-sm text-text-muted mt-1 uppercase tracking-wider font-medium">{d.name}</div>
          </div>
        ))}
      </div>
      
      {/* Progress Bar Gauge */}
      <div className="w-full h-6 flex rounded-full overflow-hidden shadow-inner bg-canvas">
        {chartData.map((d, i) => (
          <div 
            key={i} 
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }} 
            className="h-full transition-all duration-1000 ease-out hover:opacity-90"
            title={`${d.name}: ${d.value} mentions`}
          />
        ))}
      </div>
      
      <div className="mt-6 text-sm text-text-muted text-center max-w-[80%]">
        Analyse sémantique basée sur les {total} dernières observations.
      </div>
    </div>
  );
}
