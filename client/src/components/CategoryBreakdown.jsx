import React from 'react';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

export const CategoryBreakdown = ({ breakdown = [], totalSpent = 0 }) => {
  if (!breakdown || breakdown.length === 0 || totalSpent <= 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
        No category breakdown available yet. Add food expenses to see where your money goes.
      </div>
    );
  }

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Donut Chart */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '1rem auto' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {/* Segment arcs */}
          {breakdown.map((item, idx) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercent / 100) * circumference);
            cumulativePercent += item.percentage;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Food
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {/* Categories Legend list */}
      <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {breakdown.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                  display: 'inline-block',
                }}
              />
              <CategoryIcon name={item.icon} size={16} color={item.color} />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.category}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  {formatCurrency(item.total)}
                  {item.budget > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      {' '}/ {formatCurrency(item.budget)}
                    </span>
                  )}
                </strong>
                {item.budget > 0 && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: item.remaining < 0 ? '#FB7185' : '#10B981',
                    }}
                  >
                    {item.remaining < 0
                      ? `${formatCurrency(Math.abs(item.remaining))} over`
                      : `${formatCurrency(item.remaining)} left`}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
