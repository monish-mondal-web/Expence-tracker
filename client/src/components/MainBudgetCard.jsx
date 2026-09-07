import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';
import {
  ArrowUpRight,
  Pencil,
  CalendarDays,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Utensils,
  MoreVertical,
  SlidersHorizontal,
  Layers,
  Trash2,
} from 'lucide-react';

export const MainBudgetCard = ({
  data,
  onSetBudget,
  isExpanded: controlledExpanded,
  onToggleExpand,
}) => {
  const { requestConfirm, resetBudgetOptimistic } = useApp();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const budget = data?.monthlyBudget || 0;
  const hasBudget = data?.hasBudget && budget > 0;
  const categoryBreakdown = data?.categoryBreakdown || [];

  const totalSpent = data?.totalSpent || 0;
  const remainingBudget = data?.remainingBudget || 0;
  const remainingDays = data?.remainingDays !== undefined ? data.remainingDays : 0;
  const dynamicSafeDailyBudget = data?.dynamicSafeDailyBudget || 0;
  const safeDailyBudget = data?.safeDailyBudget || 0;
  const effectiveSafeDaily = dynamicSafeDailyBudget || safeDailyBudget || 0;
  const todaySpent = data?.todaySpent || 0;
  const smartMessage = data?.smartMessage || '';

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

  const handleResetBudget = () => {
    setIsMenuOpen(false);
    requestConfirm({
      title: 'Reset Monthly Budget',
      message: 'Are you sure you want to reset your monthly budget allocations? Your logged expenses will remain safe.',
      confirmLabel: 'Reset Budget',
      danger: true,
      onConfirm: () => {
        resetBudgetOptimistic(data?.budgetId);
      },
    });
  };

  if (!hasBudget) {
    return (
      <div className="fintech-budget-card empty">
        <div style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
          <div className="budget-empty-icon">
            <Utensils size={28} color="#34D399" />
          </div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800, margin: '0.6rem 0 0.3rem' }}>
            Set Monthly Budget
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Set or split your monthly budget across categories (Food, Travel, Shopping, Bills) to activate live pace tracking.
          </p>
          <button
            type="button"
            className="budget-edit-pill"
            onClick={onSetBudget}
            style={{ margin: '0 auto', display: 'inline-flex', padding: '0.6rem 1.4rem' }}
          >
            <Pencil size={13} />
            <span>Set / Split Budget</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fintech-budget-card ${isOverLimit ? 'over-limit' : ''} ${isApproaching ? 'approaching' : ''}`}
      onClick={toggleExpanded}
      role="region"
      aria-label="Monthly Budget and Dynamic Safe Limit Card"
    >
      {/* Top Header Row */}
      <div className="budget-card-header">
        <div className="budget-title-group">
          <div className="budget-icon-square">
            <ArrowUpRight size={22} color="#34D399" strokeWidth={2.4} />
          </div>
          <div>
            <div className="budget-card-title">Monthly Budget</div>
            <div className="budget-card-subtitle">
              {categoryBreakdown.filter((c) => c.budget > 0).length > 0
                ? `${categoryBreakdown.filter((c) => c.budget > 0).length} Categories Allocated`
                : 'Your monthly budget'}
            </div>
          </div>
        </div>

        {/* Header Action Buttons & Vertical Ellipsis */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', position: 'relative' }}
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="budget-edit-pill"
            onClick={onSetBudget}
            title="Edit / Split monthly budget"
          >
            <Pencil size={12} strokeWidth={2.2} />
            <span>Edit</span>
          </button>

          {/* Vertical Ellipsis Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="Budget Options"
            aria-label="Budget options menu"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isMenuOpen ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MoreVertical size={16} />
          </button>

          {/* Vertical Ellipsis Dropdown Menu */}
          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '38px',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                padding: '6px',
                width: '200px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSetBudget();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <SlidersHorizontal size={14} color="#34D399" />
                <span>Category Budgets (Food, Rent...)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  toggleExpanded();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <Layers size={14} color="#38BDF8" />
                <span>{isExpanded ? 'Hide Category Budgets' : 'View Category Budgets'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetBudget}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FB7185',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <Trash2 size={14} color="#FB7185" />
                <span>Reset Budget</span>
              </button>
            </div>
          )}
        </div>
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
          className={`budget-progress-fill ${isOverLimit ? 'over' : isApproaching ? 'warning' : 'safe'}`}
          style={{ width: `${Math.min(100, spentPercent)}%` }}
        />
      </div>

      {/* Pacing Stats: Safe Daily Spend Target & Average Per Day */}
      <div className="budget-pace-banner">
        <div className="pace-item">
          <span className="pace-label">
            <CalendarDays size={12} color="#94A3B8" />
            <span>Today's Safe Limit</span>
          </span>
          <span className="pace-value emerald">
            {formatCurrency(effectiveSafeDaily)}
          </span>
        </div>

        <div className="pace-divider" />

        <div className="pace-item">
          <span className="pace-label">
            <TrendingUp size={12} color="#94A3B8" />
            <span>Your Daily Avg</span>
          </span>
          <span className="pace-value">
            {formatCurrency(yourAverage)}
          </span>
        </div>
      </div>

      {/* Clickable Expand / Collapse Indicator */}
      <div className="budget-expand-hint">
        <span>{isExpanded ? 'Hide detailed breakdown' : 'Tap for daily safe limit & category budgets'}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        />
      </div>

      {/* Expandable Breakdown Drawer with Detailed Safe Zone Calculations */}
      <div
        className={`budget-breakdown-expandable ${isExpanded ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="budget-breakdown-inner">
          <div className="budget-breakdown-card">
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

            {/* Category Split Allocations Progress */}
            {categoryBreakdown && categoryBreakdown.length > 0 && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Category Budgets & Pacing
                  </span>
                  {categoryBreakdown.filter((c) => c.budget > 0).length > 0 ? (
                    <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
                      {categoryBreakdown.filter((c) => c.budget > 0).length} Budgeted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetBudget();
                      }}
                      style={{
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        borderRadius: '6px',
                        color: '#34D399',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      + Set Limits
                    </button>
                  )}
                </div>

                {categoryBreakdown.filter((c) => c.budget > 0).length === 0 && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px dashed rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      marginBottom: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      Pick categories (Food, Travel, Tour, Room Rent, Gym, Health) to track limits per activity.
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetBudget();
                      }}
                      style={{
                        background: '#34D399',
                        color: '#064E3B',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Set Budgets
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {categoryBreakdown.map((item) => {
                    const hasCatBudget = item.budget > 0;
                    const isCatOver = hasCatBudget && item.spent > item.budget;
                    return (
                      <div
                        key={item.category}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          border: isCatOver
                            ? '1px solid rgba(251, 113, 133, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasCatBudget ? '5px' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CategoryIcon name={item.icon} size={14} color={item.color || '#34D399'} />
                            <span style={{ fontSize: '0.82rem', color: '#F1F5F9', fontWeight: 600 }}>
                              {item.category}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 700 }}>
                              {formatCurrency(item.spent)}
                              {hasCatBudget && (
                                <span style={{ color: '#94A3B8', fontWeight: 500 }}> / {formatCurrency(item.budget)}</span>
                              )}
                            </div>
                            {!hasCatBudget ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSetBudget();
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '4px',
                                  color: '#94A3B8',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  cursor: 'pointer',
                                }}
                              >
                                + Limit
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: isCatOver ? '#FB7185' : '#34D399',
                                  background: isCatOver ? 'rgba(251, 113, 133, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                {isCatOver ? 'Over limit' : `${formatCurrency(item.budget - item.spent)} left`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mini progress bar */}
                        {hasCatBudget && (
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.round((item.spent / item.budget) * 100))}%`,
                                height: '100%',
                                background: isCatOver ? '#FB7185' : (item.color || '#34D399'),
                                borderRadius: '3px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainBudgetCard;
