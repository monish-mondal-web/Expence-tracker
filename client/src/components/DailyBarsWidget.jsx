import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';

export const DailyBarsWidget = ({ totalSpent = 0, safeDailyBudget = 0, bars = [] }) => {
  const [activeBar, setActiveBar] = useState(null);

  // Take the last 7-10 days of data
  const sliceBars = bars.length > 0 ? bars.slice(-8) : [
    { day: 1, amount: 150 },
    { day: 2, amount: 320 },
    { day: 3, amount: 210 },
    { day: 4, amount: 480 },
    { day: 5, amount: 190 },
    { day: 6, amount: 280 },
    { day: 7, amount: totalSpent > 0 ? totalSpent : 250 },
  ];

  const maxVal = Math.max(...sliceBars.map((b) => b.amount), safeDailyBudget || 100, 10);
  const widgetHeight = 75;

  return (
    <div className="shadcn-widget-card">
      <div className="widget-header">
        <div>
          <span className="widget-subtitle">Safe Daily Limit</span>
          <div className="widget-main-number">{formatCurrency(safeDailyBudget)}</div>
        </div>

        <div className="widget-delta-badge positive">
          <span className="delta-dot" />
          <span>70% Rule</span>
        </div>
      </div>

      {/* Bars Chart Area with Tooltip */}
      <div style={{ position: 'relative', width: '100%', height: `${widgetHeight + 25}px`, marginTop: '0.4rem' }}>
        {activeBar && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(180, Math.max(0, activeBar.x - 25))}px`,
              top: '-6px',
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
            {formatCurrency(activeBar.amount)}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '6px',
            height: `${widgetHeight}px`,
            width: '100%',
            paddingBottom: '4px',
          }}
        >
          {sliceBars.map((b, idx) => {
            const barHeight = b.amount > 0 ? Math.max(8, (b.amount / maxVal) * (widgetHeight - 10)) : 4;
            const isHovered = activeBar?.idx === idx;
            const isOverSafe = safeDailyBudget > 0 && b.amount > safeDailyBudget;

            let barBg = '#A7F3D0'; // soft mint
            if (idx === sliceBars.length - 1) {
              barBg = isOverSafe ? '#F43F5E' : '#10B981'; // rich vibrant green or red for current
            } else if (isOverSafe) {
              barBg = '#FECDD3';
            }

            return (
              <div
                key={idx}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveBar({ idx, amount: b.amount, x: idx * 26 });
                }}
                onMouseLeave={() => setActiveBar(null)}
                style={{
                  flex: 1,
                  height: `${barHeight}px`,
                  background: isHovered ? '#0F172A' : barBg,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isHovered ? 'scaleY(1.06)' : 'scaleY(1)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
