import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { ChevronDown } from 'lucide-react';

const SUB_PALETTE = [
  '#10B981', '#6366F1', '#F59E0B', '#EC4899', 
  '#06B6D4', '#8B5CF6', '#14B8A6', '#F97316', '#3B82F6'
];

export const CategoryBreakdown = ({ breakdown = [], totalSpent = 0 }) => {
  // Default expanded to 'Food & Dining' as requested
  const [expandedCategory, setExpandedCategory] = useState('Food & Dining');

  const toggleCategory = (catName) => {
    setExpandedCategory((prev) => (prev?.toLowerCase() === catName?.toLowerCase() ? null : catName));
  };

  if (!breakdown || breakdown.length === 0 || totalSpent <= 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
        No category breakdown available yet. Add expenses to see where your money goes.
      </div>
    );
  }

  // Determine active focused space for the Donut Circle
  const activeSpaceItem = expandedCategory
    ? breakdown.find((item) => item.category?.toLowerCase() === expandedCategory?.toLowerCase())
    : null;

  let chartSegments = [];
  let chartCenterTitle = 'Total Spent';
  let chartCenterAmount = totalSpent;

  if (activeSpaceItem && activeSpaceItem.total > 0) {
    chartCenterTitle = activeSpaceItem.category;
    chartCenterAmount = activeSpaceItem.total;

    if (Array.isArray(activeSpaceItem.subCategories) && activeSpaceItem.subCategories.length > 0) {
      const spaceTotal = activeSpaceItem.total;
      chartSegments = activeSpaceItem.subCategories.map((sub, idx) => {
        const subPercent = spaceTotal > 0 ? (sub.total / spaceTotal) * 100 : 0;
        const color = (sub.color && sub.color !== activeSpaceItem.color)
          ? sub.color
          : SUB_PALETTE[idx % SUB_PALETTE.length];

        return {
          name: sub.category,
          total: sub.total,
          percentage: subPercent,
          color,
          icon: sub.icon,
        };
      });
    } else {
      chartSegments = [
        {
          name: activeSpaceItem.category,
          total: activeSpaceItem.total,
          percentage: 100,
          color: activeSpaceItem.color || '#10B981',
          icon: activeSpaceItem.icon,
        },
      ];
    }
  } else {
    // When no space is expanded or focused, show overall breakdown of all spaces
    chartCenterTitle = 'Total Spent';
    chartCenterAmount = totalSpent;
    chartSegments = breakdown
      .filter((item) => item.total > 0)
      .map((item) => ({
        name: item.category,
        total: item.total,
        percentage: item.percentage,
        color: item.color,
        icon: item.icon,
      }));
  }

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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
          {chartSegments.map((item, idx) => {
            const strokeDasharray = `${(Math.min(item.percentage, 100) / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercent / 100) * circumference);
            cumulativePercent += item.percentage;

            return (
              <circle
                key={item.name || idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap={chartSegments.length === 1 ? 'butt' : 'round'}
                style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
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
            textAlign: 'center',
            padding: '0 0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {chartCenterTitle}
          </span>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginTop: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCurrency(chartCenterAmount)}
          </span>
        </div>
      </div>

      {/* Categories Legend list */}
      <div style={{ width: '100%', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {breakdown.map((item, idx) => {
          const hasSub = Array.isArray(item.subCategories) && item.subCategories.length > 0;
          const isSubExpanded = expandedCategory?.toLowerCase() === item.category?.toLowerCase();

          return (
            <div
              key={idx}
              style={{
                borderRadius: 'var(--radius-md)',
                background: isSubExpanded ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface-subtle)',
                border: isSubExpanded ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  gap: '0.5rem',
                }}
                onClick={() => toggleCategory(item.category)}
              >
                {/* Left side: dot + icon + category name (nowrap, no (3) badge) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flexShrink: 1 }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <CategoryIcon name={item.icon} size={15} color={item.color} />
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Right side: Amount / Budget, Left/Over, Percentage, Chevron (strictly nowrap) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(item.total)}
                      {item.budget > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                          {' '}/ {formatCurrency(item.budget)}
                        </span>
                      )}
                    </div>
                    {item.budget > 0 && (
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: item.remaining < 0 ? '#FB7185' : '#10B981',
                          whiteSpace: 'nowrap',
                          marginTop: '1px',
                        }}
                      >
                        {item.remaining < 0
                          ? `${formatCurrency(Math.abs(item.remaining))} over`
                          : `${formatCurrency(item.remaining)} left`}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      minWidth: '32px',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                    }}
                  >
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
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Nested Sub-Categories Accordion */}
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
                        padding: '0.4rem 0.85rem 0.75rem 1.8rem',
                        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                        background: 'rgba(0, 0, 0, 0.015)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      {item.subCategories.map((sub, sIdx) => {
                        const subPercent = item.total > 0 ? Math.round((sub.total / item.total) * 100) : 0;
                        const subColor = (sub.color && sub.color !== item.color)
                          ? sub.color
                          : SUB_PALETTE[sIdx % SUB_PALETTE.length];

                        return (
                          <div
                            key={sub.category}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              border: '1px solid rgba(0, 0, 0, 0.04)',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: subColor,
                                  flexShrink: 0,
                                }}
                              />
                              <CategoryIcon name={sub.icon} size={13} color={subColor} />
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--text-primary)',
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {sub.category}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--text-primary)',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {formatCurrency(sub.total)}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  color: 'var(--text-secondary)',
                                  background: '#F1F5F9',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
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
