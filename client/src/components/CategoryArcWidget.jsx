import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';

export const CategoryArcWidget = ({ totalSpent = 0, breakdown = [] }) => {
  const [hoveredCat, setHoveredCat] = useState(null);

  const defaultCategories = breakdown.length > 0 ? breakdown.slice(0, 4) : [
    { category: 'Lunch', percentage: 40, total: totalSpent * 0.4, color: '#F59E0B' }, // warm yellow
    { category: 'Dinner', percentage: 30, total: totalSpent * 0.3, color: '#F43F5E' }, // coral/pink
    { category: 'Groceries', percentage: 20, total: totalSpent * 0.2, color: '#10B981' }, // mint
    { category: 'Snacks', percentage: 10, total: totalSpent * 0.1, color: '#818CF8' }, // soft purple
  ];

  // Semicircle arc SVG
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const arcLength = Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="shadcn-widget-card">
      <div className="widget-header">
        <div>
          <span className="widget-subtitle">Category Distribution</span>
          <div className="widget-main-number">{formatCurrency(totalSpent)}</div>
        </div>

        <div className="widget-delta-badge neutral">
          <span>Top Categories</span>
        </div>
      </div>

      {/* Semicircular Arc with Tooltip */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.4rem' }}>
        <div style={{ position: 'relative', width: `${size}px`, height: `${size / 2 + 20}px` }}>
          {hoveredCat && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
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
              {hoveredCat.category}: {formatCurrency(hoveredCat.total)} ({hoveredCat.percentage}%)
            </div>
          )}

          <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
            {/* Background track */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 5}`}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Arcs for each category */}
            {defaultCategories.map((cat, idx) => {
              const segLength = (cat.percentage / 100) * arcLength;
              const segOffset = arcLength - (cumulativePercent / 100) * arcLength;
              cumulativePercent += cat.percentage;

              return (
                <path
                  key={idx}
                  d={`M ${strokeWidth / 2} ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 5}`}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segLength} ${arcLength}`}
                  strokeDashoffset={segOffset}
                  strokeLinecap="round"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: hoveredCat && hoveredCat.category !== cat.category ? 0.4 : 1,
                  }}
                  onMouseEnter={() => setHoveredCat(cat)}
                  onMouseLeave={() => setHoveredCat(null)}
                />
              );
            })}
          </svg>
        </div>

        {/* Categories Dots Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.4rem' }}>
          {defaultCategories.map((c, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredCat(c)}
              onMouseLeave={() => setHoveredCat(null)}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
              <span>{c.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
