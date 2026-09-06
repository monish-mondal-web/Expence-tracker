import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';

export const SpendingTrendWidget = ({ todaySpent = 0, safeDailyBudget = 0, recentData = [] }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  const diff = safeDailyBudget > 0 ? ((todaySpent - safeDailyBudget) / safeDailyBudget) * 100 : 0;
  const isOver = todaySpent > safeDailyBudget;
  const diffFormatted = Math.abs(Math.round(diff * 10) / 10);

  // Default curve data points if recentData is empty or short
  const points = recentData.length >= 4
    ? recentData.map((d) => d.amount)
    : [
        Math.max(0, todaySpent * 0.4),
        Math.max(0, todaySpent * 0.8),
        Math.max(0, todaySpent * 0.5),
        Math.max(0, todaySpent * 1.1),
        Math.max(0, todaySpent * 0.9),
        todaySpent,
      ];

  const maxVal = Math.max(...points, safeDailyBudget || 100, 10);
  const width = 240;
  const height = 75;

  const stepX = width / (points.length - 1);
  const coords = points.map((p, idx) => ({
    x: idx * stepX,
    y: height - 10 - (p / maxVal) * (height - 24),
    val: p,
  }));

  const pathD = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const activePoint = hoverIndex !== null ? coords[hoverIndex] : coords[coords.length - 1];

  return (
    <div className="shadcn-widget-card">
      <div className="widget-header">
        <div>
          <span className="widget-subtitle">Today's Food Spend</span>
          <div className="widget-main-number">{formatCurrency(todaySpent)}</div>
        </div>

        <div className={`widget-delta-badge ${isOver ? 'negative' : 'positive'}`}>
          <span className="delta-dot" />
          <span>
            {isOver ? `+${diffFormatted}% vs safe` : `-${diffFormatted}% vs safe`}
          </span>
        </div>
      </div>

      {/* Interactive Trend Curve with Tooltip Box */}
      <div style={{ position: 'relative', width: '100%', height: `${height + 25}px`, marginTop: '0.4rem' }}>
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(width - 60, Math.max(0, activePoint.x - 30))}px`,
              top: `${Math.max(0, activePoint.y - 32)}px`,
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              pointerEvents: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {formatCurrency(activePoint.val)}
          </div>
        )}

        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Shaded Area */}
          <path d={areaD} fill="url(#trendAreaGrad)" />

          {/* Smooth Line */}
          <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive touch/hover points */}
          {coords.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? 5 : 3.5}
              fill={hoverIndex === i ? '#6366F1' : '#FFFFFF'}
              stroke="#6366F1"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
