import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';

export const SpendingChart = ({ dailyData = [], safeLimit = 0 }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  if (!dailyData || dailyData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        No chart data available yet.
      </div>
    );
  }

  const maxExpense = Math.max(...dailyData.map((d) => d.amount), safeLimit || 100);
  const chartHeight = 160;

  return (
    <div style={{ position: 'relative', width: '100%', padding: '1rem 0' }}>
      {/* Safe limit indicator legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10B981', display: 'inline-block' }}></span>
          <span>Within Safe Zone</span>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#F43F5E', display: 'inline-block', marginLeft: '0.5rem' }}></span>
          <span>Exceeded Safe Limit</span>
        </div>
        {safeLimit > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--safe-text)', fontWeight: 600 }}>
            <span>Safe Daily Limit: {formatCurrency(safeLimit)}</span>
          </div>
        )}
      </div>

      {/* Hover Info Tooltip Banner */}
      <div style={{ minHeight: '28px', marginBottom: '0.75rem' }}>
        {hoveredDay ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#0F172A', color: '#FFFFFF', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>Day {hoveredDay.day} ({hoveredDay.date}):</span>
            <span style={{ color: hoveredDay.isOverSafeLimit ? '#FB7185' : '#34D399' }}>
              {formatCurrency(hoveredDay.amount)}
            </span>
            {hoveredDay.isOverSafeLimit && <span>⚠️ Over Limit</span>}
          </div>
        ) : (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            Hover or tap on any day to inspect daily food spending
          </span>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div
        style={{
          position: 'relative',
          height: `${chartHeight}px`,
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '3px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {/* Safe Limit Dashed Guideline */}
        {safeLimit > 0 && maxExpense > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: `${20 + (safeLimit / maxExpense) * (chartHeight - 30)}px`,
              left: 0,
              right: 0,
              borderTop: '1px dashed #10B981',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.7,
            }}
          />
        )}

        {/* Daily Bars */}
        {dailyData.map((d) => {
          const barHeight = d.amount > 0 ? Math.max(6, (d.amount / maxExpense) * (chartHeight - 30)) : 2;
          const isOver = d.isOverSafeLimit;
          const isHovered = hoveredDay?.day === d.day;

          let barBg = '#E2E8F0';
          if (d.amount > 0) {
            barBg = isOver ? 'linear-gradient(180deg, #F43F5E, #E11D48)' : 'linear-gradient(180deg, #10B981, #059669)';
          }

          return (
            <div
              key={d.day}
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => setHoveredDay(d)}
              style={{
                flex: 1,
                height: `${barHeight}px`,
                background: barBg,
                borderRadius: '3px 3px 0 0',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, opacity 0.15s ease',
                transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                opacity: isHovered ? 1 : 0.85,
                position: 'relative',
              }}
            />
          );
        })}
      </div>

      {/* Day numbers labels (sample markers) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
        <span>Day 1</span>
        <span>Day 10</span>
        <span>Day 20</span>
        <span>Day {dailyData.length}</span>
      </div>
    </div>
  );
};
