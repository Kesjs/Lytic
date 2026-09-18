import React from 'react';

export interface ThemesCloudProps {
  data: { text: string; count: number }[];
}

export function ThemesCloud({ data }: ThemesCloudProps) {
  if (!data || data.length === 0) {
    return <div className="flex min-h-[100px] items-center justify-center text-sm text-ink-muted">Pas de données</div>;
  }
  
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="flex min-h-[100px] w-full flex-wrap content-center justify-center gap-3 px-2 py-2">
      {data.map((theme, i) => {
        const ratio = theme.count / maxCount;
        // Size between 14px and 28px based on frequency
        const fontSize = 14 + (ratio * 14); 
        // Opacity mapping (more frequent = more opaque)
        const opacity = 0.5 + (ratio * 0.5); 

        return (
          <span 
            key={i} 
            title={`${theme.count} mentions`}
            style={{ 
              fontSize: `${fontSize}px`, 
              opacity,
              animationDelay: `${i * 100}ms`
            }}
            className="px-4 py-1.5 bg-surface rounded-full text-brand whitespace-nowrap transition-all duration-300 hover:scale-110 hover:opacity-100 cursor-default shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-border animate-fade-in"
          >
            #{theme.text.toLowerCase()}
          </span>
        );
      })}
    </div>
  );
}
