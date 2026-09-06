import React from 'react';
import { formatCurrency } from '../utils/currency';

export const BudgetGaugeWidget = ({ data, onSetBudget }) => {
  const budget = data?.monthlyBudget || 0;
  const spent = data?.totalSpent || 0;
  const remaining = data?.remainingBudget || 0;
  const percent = data?.budgetUsedPercentage || 0;

  // Semi-circle SVG parameters
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  // Semicircle perimeter = Math.PI * radius
  const arcLength = Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = arcLength - (clampedPercent / 100) * arcLength;

  // Compute indicator dot position
  const angle = Math.PI * (1 - clampedPercent / 100);
  const cx = size / 2;
  const cy = size / 2 + 10;
  const dotX = cx + radius * Math.cos(angle);
  const dotY = cy - radius * Math.sin(angle);

  let gaugeColor = '#3B82F6';
  if (clampedPercent >= 90) gaugeColor = '#F43F5E';
  else if (clampedPercent >= 75) gaugeColor = '#F59E0B';

  return (
    <div className="shadcn-widget-card">
      <div className="widget-header">
        <div>
          <span className="widget-subtitle">Left to budget</span>
          <div className="widget-main-number">{formatCurrency(remaining)}</div>
        </div>
        {budget > 0 && (
          <button
            type="button"
            className="widget-mini-badge"
            onClick={onSetBudget}
            title="Update budget"
          >
            Edit Budget
          </button>
        )}
      </div>

      {budget > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ position: 'relative', width: `${size}px`, height: `${size / 2 + 25}px`, overflow: 'hidden' }}>
            <svg width={size} height={size / 2 + 25} viewBox={`0 0 ${size} ${size / 2 + 25}`}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor={gaugeColor} />
                </linearGradient>
              </defs>

              {/* Background semi-circle track */}
              <path
                d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Active filled arc */}
              <path
                d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />

              {/* Indicator Dot */}
              <circle
                cx={dotX}
                cy={dotY}
                r={strokeWidth / 2 + 1}
                fill="#FFFFFF"
                stroke={gaugeColor}
                strokeWidth={3}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'all 0.8s ease' }}
              />
            </svg>

            {/* Center percentage */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {clampedPercent}%
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Allocated {formatCurrency(budget)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.25rem 0' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            No food budget configured yet
          </p>
          <button type="button" className="btn-primary" onClick={onSetBudget} style={{ margin: '0 auto', width: 'auto', padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
            Set Budget
          </button>
        </div>
      )}
    </div>
  );
};
