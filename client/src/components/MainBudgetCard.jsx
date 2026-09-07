import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import {
  ArrowUpRight,
  Pencil,
  CalendarDays,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Utensils,
} from 'lucide-react';

export const MainBudgetCard = ({
  data,
  onSetBudget,
  isExpanded: controlledExpanded,
  onToggleExpand,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const budget = data?.monthlyBudget || 0;
  const hasBudget = data?.hasBudget && budget > 0;

  const totalSpent = data?.totalSpent || 0;
  const remainingBudget = data?.remainingBudget || 0;
  const remainingDays = data?.remainingDays !== undefined ? data.remainingDays : 0;
  const dynamicSafeDailyBudget = data?.dynamicSafeDailyBudget || 0;
  const safeDailyBudget = data?.safeDailyBudget || 0;
  const effectiveSafeDaily = dynamicSafeDailyBudget || safeDailyBudget || 0;
  const todaySpent = data?.todaySpent || 0;

  // Remaining in today's daily limit (negative if over limit)
  const safeRemainingToday =
    data?.safeRemainingToday !== undefined
      ? data.safeRemainingToday
      : Math.round((effectiveSafeDaily - todaySpent) * 100) / 100;

  // Days elapsed in current month for pacing analytics
  const now = new Date();
  const currentMonth = data?.month || now.getMonth() + 1;
  const currentYear = data?.year || now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysElapsed = Math.max(1, Math.min(now.getDate(), daysInMonth));

  // Dynamic average spend per day (distinct metric)
  const yourAverage =
    data?.averageDailySpend || (daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0);

  // Dynamic percentages
  const spentPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const remainingPercent = Math.max(0, 100 - spentPercent);

  // Status badge logic: ONLY show 'TODAY LIMIT EXPIRED' when today's spending has reached or crossed the daily safe limit!
  const isDailyLimitExpired =
    (effectiveSafeDaily > 0 && todaySpent >= effectiveSafeDaily) ||
    (budget > 0 && remainingBudget <= 0 && todaySpent > 0);

  const isDailyLimitApproaching =
    !isDailyLimitExpired &&
    effectiveSafeDaily > 0 &&
    todaySpent >= effectiveSafeDaily * 0.85;

  let statusText = 'ON TRACK';
  let statusDotColor = '#34D399'; // Emerald

  if (isDailyLimitExpired) {
    statusText = 'TODAY LIMIT EXPIRED';
    statusDotColor = '#FB7185'; // Rose
  } else if (isDailyLimitApproaching) {
    statusText = 'APPROACHING LIMIT';
    statusDotColor = '#FBBF24'; // Amber
  } else {
    statusText = 'ON TRACK';
    statusDotColor = '#34D399'; // Emerald
  }

  const isOverLimit = isDailyLimitExpired;
  const isApproaching = isDailyLimitApproaching;

  if (!hasBudget) {
    return (
      <div className="fintech-budget-card empty">
        <div style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
          <div className="budget-empty-icon">
            <Utensils size={28} color="#34D399" />
          </div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800, margin: '0.6rem 0 0.3rem' }}>
            Set Food Budget
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Set your monthly food budget to activate live pace tracking, daily limits, and dynamic safe zone recommendations.
          </p>
          <button
            type="button"
            className="budget-edit-pill"
            onClick={onSetBudget}
            style={{ margin: '0 auto', display: 'inline-flex', padding: '0.6rem 1.4rem' }}
          >
            <Pencil size={13} />
            <span>Set Monthly Budget</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fintech-budget-card">
      {/* Top Row: Food Budget Header & Edit Pill Button */}
      <div className="budget-card-header">
        <div className="budget-title-group">
          <div className="budget-icon-square">
            <ArrowUpRight size={22} color="#34D399" strokeWidth={2.4} />
          </div>
          <div>
            <div className="budget-card-title">Monthly Food Budget</div>
            <div className="budget-card-subtitle">Your monthly budget</div>
          </div>
        </div>

        <button
          type="button"
          className="budget-edit-pill"
          onClick={onSetBudget}
          title="Edit monthly food budget"
        >
          <Pencil size={12} strokeWidth={2.2} />
          <span>Edit</span>
        </button>
      </div>

      {/* Main Budget Amount & Dynamic Status Pill */}
      <div className="budget-amount-row">
        <div className="budget-main-amount">
          {formatCurrency(budget)}
        </div>

        <div className="budget-status-pill">
          <div className="budget-status-badge">
            <span className="status-dot-pulse" style={{ background: statusDotColor }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem' }}>
              {statusText}
            </span>
          </div>
          <span className="budget-days-text">{remainingDays} days left</span>
        </div>
      </div>

      {/* Spending Breakdown Numbers */}
      <div className="budget-split-row">
        <div className="budget-split-item left">
          <div className="split-amount-line">
            <span className="split-num">{formatCurrency(totalSpent)}</span>
            <span className="split-tag">spent</span>
          </div>
          <div className="split-subtext">{spentPercent}% of budget</div>
        </div>

        <div className="budget-split-item right">
          <div className="split-amount-line">
            <span className="split-num">{formatCurrency(remainingBudget)}</span>
            <span className="split-tag">remaining</span>
          </div>
          <div className="split-subtext">{remainingPercent}% left</div>
        </div>
      </div>

      {/* Modern Progress Bar */}
      <div className="budget-progress-track">
        <div
          className="budget-progress-fill"
          style={{
            width: `${spentPercent}%`,
            background: isOverLimit ? '#FB7185' : isApproaching ? '#FBBF24' : '#10B981',
          }}
        />
      </div>

      {/* 3 Metric Columns Row (Distinct Overview - Click to toggle breakdown) */}
      <div
        className="budget-metrics-row"
        onClick={toggleExpanded}
        title="Click to view Dynamic Safe Limit breakdown"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        {/* Metric 1: Daily Limit & Today's Remaining / -Over */}
        <div className="budget-metric-col">
          <div className={`metric-col-icon ${safeRemainingToday < 0 ? 'pink' : ''}`}>
            <CalendarDays size={15} color={safeRemainingToday < 0 ? '#FB7185' : '#34D399'} />
          </div>
          <div className="metric-col-content">
            <div className="metric-col-val" style={{ color: safeRemainingToday < 0 ? '#FDA4AF' : '#FFFFFF' }}>
              {formatCurrency(effectiveSafeDaily)}/day
            </div>
            <div
              className="metric-col-label"
              style={{
                color: safeRemainingToday < 0 ? '#FB7185' : '#34D399',
                fontWeight: 600,
              }}
            >
              {safeRemainingToday < 0
                ? `-${formatCurrency(Math.abs(safeRemainingToday))} over`
                : `${formatCurrency(safeRemainingToday)} left today`}
            </div>
          </div>
        </div>

        {/* Metric 2: Your Average */}
        <div className="budget-metric-col">
          <div className="metric-col-icon">
            <TrendingUp size={15} color="#34D399" />
          </div>
          <div className="metric-col-content">
            <div className="metric-col-val">{formatCurrency(yourAverage)}/day</div>
            <div className="metric-col-label">Your average</div>
          </div>
        </div>

        {/* Dynamic Safe Limit breakdown toggle */}
        <div className="budget-metric-col-toggle" title="View safe limit formula and breakdown">
          <ChevronDown
            size={16}
            className={`metric-chevron ${isExpanded ? 'rotated' : ''}`}
          />
        </div>
      </div>

      {/* Dynamic Safe Limit Breakdown Drawer with Smooth Accordion Animation */}
      <div className={`card-dynamic-breakdown-wrapper ${isExpanded ? 'open' : ''}`}>
        <div className="card-dynamic-breakdown-inner">
          <div className="card-dynamic-breakdown">
            <div className="breakdown-header">
              <div className="breakdown-title">
                <ShieldCheck size={14} color="#34D399" />
                <span>DYNAMIC SAFE LIMIT BREAKDOWN</span>
              </div>
              <button
                type="button"
                className="breakdown-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                title="Close breakdown"
                aria-label="Close breakdown"
              >
                ✕
              </button>
            </div>

            <div className="breakdown-grid">
              <div className="breakdown-cell highlight">
                <span className="breakdown-label">Safe Daily Spend</span>
                <span className="breakdown-val highlight">
                  {formatCurrency(effectiveSafeDaily)}
                </span>
              </div>

              <div className="breakdown-cell">
                <span className="breakdown-label">Spent Today</span>
                <span
                  className="breakdown-val"
                  style={{
                    color:
                      safeRemainingToday < 0
                        ? '#FB7185'
                        : todaySpent > 0
                        ? '#FCD34D'
                        : '#34D399',
                  }}
                >
                  {formatCurrency(todaySpent)}
                </span>
              </div>

              <div className={`breakdown-cell ${safeRemainingToday < 0 ? 'expired' : ''}`}>
                <span className="breakdown-label">
                  {safeRemainingToday < 0 ? "Today's Over Limit" : "Today's Remaining"}
                </span>
                <span
                  className="breakdown-val"
                  style={{
                    color: safeRemainingToday < 0 ? '#FB7185' : '#34D399',
                  }}
                >
                  {safeRemainingToday < 0
                    ? `-${formatCurrency(Math.abs(safeRemainingToday))}`
                    : formatCurrency(safeRemainingToday)}
                </span>
              </div>

              <div className="breakdown-cell">
                <span className="breakdown-label">Safe Buffer Left</span>
                <span className="breakdown-val emerald">
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
            </div>

            {smartMessage && (
              <div className="breakdown-message">
                <ShieldCheck size={14} color="#34D399" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{smartMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
