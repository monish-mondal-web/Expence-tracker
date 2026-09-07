import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { ChevronDown } from 'lucide-react';

export const CategoryBreakdown = ({ breakdown = [], totalSpent = 0 }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (catName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  if (!breakdown || breakdown.length === 0 || totalSpent <= 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
        No category breakdown available yet. Add expenses to see where your money goes.
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
            Total Spent
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {/* Categories Legend list */}
      <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {breakdown.map((item, idx) => {
          const hasSub = Array.isArray(item.subCategories) && item.subCategories.length > 0;
          const isSubExpanded = !!expandedCategories[item.category];

          return (
            <div
              key={idx}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  cursor: hasSub ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
                onClick={() => {
                  if (hasSub) toggleCategory(item.category);
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
                      flexShrink: 0,
                    }}
                  />
                  <CategoryIcon name={item.icon} size={16} color={item.color} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {item.category}
                    </span>
                    {hasSub && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        ({item.subCategories.length})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap' }}>
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.remaining < 0
                          ? `${formatCurrency(Math.abs(item.remaining))} over`
                          : `${formatCurrency(item.remaining)} left`}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '36px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {item.percentage}%
                  </span>
                  {hasSub && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-tertiary)',
                        transform: isSubExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    >
                      <ChevronDown size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Nested Sub-Categories with Smooth CSS Grid Accordion */}
              {hasSub && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isSubExpanded ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ minHeight: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '0.4rem 0.85rem 0.75rem 2.2rem',
                        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                        background: 'rgba(0, 0, 0, 0.015)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      {item.subCategories.map((sub) => {
                        const subPercent = item.total > 0 ? Math.round((sub.total / item.total) * 100) : 0;
                        return (
                          <div
                            key={sub.category}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              border: '1px solid rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <CategoryIcon name={sub.icon} size={13} color={sub.color || '#64748B'} />
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {sub.category}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                {formatCurrency(sub.total)}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  color: 'var(--text-secondary)',
                                  background: '#F1F5F9',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                }}
                              >
                                {subPercent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
