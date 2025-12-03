
import React, { useMemo, useState } from 'react';
import { DailyReport } from '../../types';

interface Props {
  reports: DailyReport[];
  isLight: boolean;
}

export const EmotionalTimeline: React.FC<Props> = ({ reports, isLight }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter and sort reports by date (oldest first for graph)
  const data = useMemo(() => {
    return [...reports]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-7); // Last 7 entries
  }, [reports]);

  if (data.length < 2) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${isLight ? 'bg-white/50 border-black/5' : 'bg-white/5 border-white/5'}`}>
        <p className="opacity-50 text-sm">Registre mais dias para ver sua linha do tempo.</p>
      </div>
    );
  }

  // Graph Dimensions
  const width = 300;
  const height = 150;
  const padding = 20;

  // Scales
  const getX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);
  const getY = (value: number) => height - padding - (value / 10) * (height - padding * 2);

  // Generate Path
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.positivityLevel || 5),
    ...d
  }));

  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    // Bezier control points for smooth curve
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
  }, "");

  // Gradient Area
  const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <div className={`p-4 rounded-3xl border ${isLight ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/5'}`}>
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Fluxo Emocional (7 dias)</h3>
      
      <div className="relative w-full aspect-[2/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#gradientLine)" className="transition-all duration-500 ease-in-out" />

          {/* Line Stroke */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#06b6d4" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500 ease-in-out"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={isLight ? '#fff' : '#000'}
                stroke={p.moodColor || '#06b6d4'}
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 bg-black text-white text-[10px] px-2 py-1 rounded-full pointer-events-none whitespace-nowrap z-10"
            style={{ left: `${(hoveredIndex / (data.length - 1)) * 100}%` }}
          >
            {data[hoveredIndex].emotion}
          </div>
        )}
      </div>
    </div>
  );
};
