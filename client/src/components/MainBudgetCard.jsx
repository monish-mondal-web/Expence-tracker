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
  ChevronUp,
  AlertCircle,
  Utensils,
  MoreVertical,
  SlidersHorizontal,
  Layers,
  Trash2,
  Receipt,
} from 'lucide-react';

export const MainBudgetCard = ({
  data,
  onSetBudget,
  isExpanded: controlledExpanded,
  onToggleExpand,
}) => {
  const { requestConfirm, resetBudgetOptimistic, activeSpace } = useApp();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleCategory = (catName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

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

  // Determine if viewing a specific space or all spaces
  const isSpaceMode = activeSpace && activeSpace !== 'All';
  const spaceObj = isSpaceMode
    ? (data?.spaces?.find((s) => s?.name && activeSpace && s.name.toLowerCase() === activeSpace.toLowerCase()) || data?.activeSpaceData)
    : null;

  const cardTitle = isSpaceMode ? `${activeSpace} Budget` : 'Monthly Budget';
  const cardSubtitle = isSpaceMode
    ? 'Dedicated Space'
    : (data?.categoryBreakdown?.filter((c) => c.budget > 0).length > 0
        ? `${data.categoryBreakdown.filter((c) => c.budget > 0).length} Categories Allocated`
        : 'Overview across all spaces');
  const cardIcon = isSpaceMode ? (spaceObj?.icon || 'Utensils') : 'ArrowUpRight';
  const cardColor = isSpaceMode ? (spaceObj?.color || '#34D399') : '#34D399';

  const budget = isSpaceMode ? (spaceObj?.monthlyBudget || 0) : (data?.monthlyBudget || 0);
  const hasBudget = isSpaceMode ? (spaceObj?.hasBudget && budget > 0) : (data?.hasBudget && budget > 0);
  const categoryBreakdown = data?.categoryBreakdown || [];

  const totalSpent = isSpaceMode ? (spaceObj?.totalSpent || 0) : (data?.totalSpent || 0);
  const remainingBudget = isSpaceMode ? (spaceObj?.remainingBudget || 0) : (data?.remainingBudget || 0);
  const remainingDays = data?.remainingDays !== undefined ? data.remainingDays : 0;
  const dynamicSafeDailyBudget = isSpaceMode
    ? (spaceObj?.dynamicSafeDailyBudget || spaceObj?.safeDailyBudget || 0)
    : (data?.dynamicSafeDailyBudget || 0);
  const safeDailyBudget = isSpaceMode
    ? (spaceObj?.safeDailyBudget || 0)
    : (data?.safeDailyBudget || 0);
  const effectiveSafeDaily = dynamicSafeDailyBudget || safeDailyBudget || 0;

  const dynamicDailyBudget = isSpaceMode
    ? (spaceObj?.dynamicDailyBudget || 0)
    : (data?.dynamicDailyBudget || 0);
  const baseDailyBudget = isSpaceMode
    ? (spaceObj?.baseDailyBudget || 0)
    : (data?.baseDailyBudget || 0);

  const maxDailyLimit = remainingBudget <= 0
    ? 0
    : (dynamicDailyBudget > 0
        ? dynamicDailyBudget
        : (remainingDays > 0 && remainingBudget > 0
            ? Math.round((remainingBudget / remainingDays) * 100) / 100
            : (baseDailyBudget > 0
                ? baseDailyBudget
                : (budget > 0 ? Math.round((budget / 30) * 100) / 100 : 0))));

  const todaySpent = isSpaceMode ? (spaceObj?.todaySpent || 0) : (data?.todaySpent || 0);
  const smartMessage = isSpaceMode ? (spaceObj?.smartMessage || '') : (data?.smartMessage || '');

  // Remaining in today's daily limit (negative if over limit)
  const safeRemainingToday =
    data?.safeRemainingToday !== undefined && !isSpaceMode
      ? data.safeRemainingToday
      : Math.round((effectiveSafeDaily - todaySpent) * 100) / 100;

  // Days elapsed in current month for pacing analytics
  const now = new Date();
  const currentMonth = data?.month || now.getMonth() + 1;
  const currentYear = data?.year || now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysElapsed = Math.max(1, Math.min(now.getDate(), daysInMonth));

  // Dynamic average spend per day (distinct metric)
  const yourAverage = isSpaceMode
    ? (spaceObj?.averageDailySpend || (daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0))
    : (data?.averageDailySpend || (daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0));

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

  // Dynamic progress bar color strictly based on Total Budget and Remaining Budget
  let progressColor = '#34D399'; // Default Green (safe / on track)
  let progressStatusClass = 'safe';

  if (budget > 0) {
    if (remainingBudget <= 0 || totalSpent >= budget) {
      // 100% or over budget -> Red
      progressColor = '#FB7185';
      progressStatusClass = 'over';
    } else if (spentPercent >= 90) {
      // 90% - 99% of total budget spent -> Red (critical)
      progressColor = '#FB7185';
      progressStatusClass = 'over';
    } else if (spentPercent >= 75) {
      // 75% - 89% of total budget spent -> Yellow / Amber (warning)
      progressColor = '#FBBF24';
      progressStatusClass = 'warning';
    } else {
      // Under 75% of total budget spent -> Green (safe / healthy)
      progressColor = '#34D399';
      progressStatusClass = 'safe';
    }
  }

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
          <div
            className="budget-empty-icon"
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: `${cardColor}22`,
              border: `1px solid ${cardColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <CategoryIcon name={cardIcon} size={28} color={cardColor} />
          </div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800, margin: '0.8rem 0 0.3rem' }}>
            Set {cardTitle}
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {isSpaceMode
              ? `Set a monthly budget for ${activeSpace} to activate live daily safe limits and pace tracking.`
              : 'Set your monthly budget for categories (Food, Travel, Room Rent, Gym) to activate live pace tracking.'}
          </p>
          <button
            type="button"
            className="budget-edit-pill"
            onClick={onSetBudget}
            style={{ margin: '0 auto', display: 'inline-flex', padding: '0.6rem 1.4rem' }}
          >
            <Pencil size={13} />
            <span>Set {isSpaceMode ? `${activeSpace} Budget` : 'Monthly Budget'}</span>
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
          <div
            className="budget-icon-square"
            style={{
              background: `${cardColor}22`,
              border: `1px solid ${cardColor}44`,
            }}
          >
            {isSpaceMode ? (
              <CategoryIcon name={cardIcon} size={20} color={cardColor} />
            ) : (
              <ArrowUpRight size={22} color="#34D399" strokeWidth={2.4} />
            )}
          </div>
          <div>
            <div className="budget-card-title">{cardTitle}</div>
            <div className="budget-card-subtitle">{cardSubtitle}</div>
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
            title="Edit monthly budget"
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
          className={`budget-progress-fill ${progressStatusClass}`}
          style={{
            width: `${Math.min(100, spentPercent)}%`,
            backgroundColor: progressColor,
            transition: 'width 0.4s ease, background-color 0.3s ease',
          }}
        />
      </div>

      {/* Pacing Stats: Safe Daily Spend Target & Today's Over Limit / Safe Left */}
      <div className="budget-pace-banner">
        <div className="pace-item left">
          <span className="pace-label">
            <CalendarDays size={12} color="#94A3B8" />
            <span>Today's Safe Limit</span>
          </span>
          <span className="pace-value emerald">
            {formatCurrency(effectiveSafeDaily)}
          </span>
        </div>

        <div className="pace-divider" />

        <div className="pace-item right">
          <span className="pace-label">
            {isDailyLimitExpired ? (
              <>
                <AlertCircle size={12} color="#FB7185" />
                <span style={{ color: '#FB7185' }}>Today's Over Limit</span>
              </>
            ) : (
              <>
                <Receipt size={12} color="#34D399" />
                <span style={{ color: '#34D399' }}>Today Used</span>
              </>
            )}
          </span>
          <span
            className="pace-value"
            style={{ color: isDailyLimitExpired ? '#FB7185' : '#34D399' }}
          >
            {isDailyLimitExpired
              ? `-${formatCurrency(Math.abs(safeRemainingToday))}`
              : formatCurrency(todaySpent)}
          </span>
        </div>
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
                title="Collapse breakdown"
                aria-label="Collapse breakdown"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                }}
              >
                <ChevronUp size={16} />
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
                <span className="breakdown-label">Maximum Daily Limit</span>
                <span className="breakdown-val emerald">
                  {formatCurrency(maxDailyLimit)}
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
                    const hasSub = Array.isArray(item.subCategories) && item.subCategories.length > 0;
                    const isSubExpanded = !!expandedCategories[item.category];

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
                          transition: 'border-color 0.2s ease, background 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: hasCatBudget ? '6px' : '0',
                            cursor: hasSub ? 'pointer' : 'default',
                            userSelect: 'none',
                            gap: '6px',
                          }}
                          onClick={() => {
                            if (hasSub) toggleCategory(item.category);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flexShrink: 1 }}>
                            <CategoryIcon name={item.icon} size={14} color={item.color || '#34D399'} />
                            <span style={{ fontSize: '0.82rem', color: '#F1F5F9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.category}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.76rem', color: '#E2E8F0', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {formatCurrency(item.spent)}
                              {hasCatBudget && (
                                <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.7rem' }}> / {formatCurrency(item.budget)}</span>
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
                                  whiteSpace: 'nowrap',
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
                                  whiteSpace: 'nowrap',
                                  color: isCatOver ? '#FB7185' : '#34D399',
                                  background: isCatOver ? 'rgba(251, 113, 133, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  flexShrink: 0,
                                }}
                              >
                                {isCatOver ? 'Over' : `${formatCurrency(item.budget - item.spent)} left`}
                              </span>
                            )}

                            {hasSub && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#94A3B8',
                                  flexShrink: 0,
                                  transform: isSubExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.25s ease',
                                }}
                              >
                                <ChevronDown size={14} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Working Mini progress bar */}
                        {hasCatBudget && (
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              cursor: hasSub ? 'pointer' : 'default',
                            }}
                            onClick={() => {
                              if (hasSub) toggleCategory(item.category);
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Math.round((item.spent / item.budget) * 100))}%`,
                                height: '100%',
                                background: isCatOver
                                  ? '#FB7185'
                                  : Math.round((item.spent / item.budget) * 100) >= 75
                                  ? '#FBBF24'
                                  : '#34D399',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease, background-color 0.3s ease',
                              }}
                            />
                          </div>
                        )}

                        {/* Smooth Animated Accordion for Sub-categories */}
                        {hasSub && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateRows: isSubExpanded ? '1fr' : '0fr',
                              transition: 'grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            <div style={{ minHeight: 0, overflow: 'hidden' }}>
                              <div
                                style={{
                                  marginTop: '8px',
                                  paddingTop: '8px',
                                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '5px',
                                }}
                              >
                                {item.subCategories.map((sub) => {
                                  const subPercentOfSpace =
                                    item.spent > 0 ? Math.round((sub.spent / item.spent) * 100) : 0;
                                  return (
                                    <div
                                      key={sub.category}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '5px 8px',
                                        background: 'rgba(0, 0, 0, 0.22)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.04)',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <CategoryIcon name={sub.icon} size={12} color={sub.color || '#94A3B8'} />
                                        <span style={{ fontSize: '0.76rem', color: '#CBD5E1', fontWeight: 500 }}>
                                          {sub.category}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontSize: '0.74rem', color: '#F1F5F9', fontWeight: 600 }}>
                                          {formatCurrency(sub.spent)}
                                        </div>
                                        <span
                                          style={{
                                            fontSize: '0.62rem',
                                            color: '#94A3B8',
                                            background: 'rgba(255, 255, 255, 0.07)',
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {subPercentOfSpace}%
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
            )}
          </div>
        </div>
      </div>

      {/* Clickable Expand / Collapse Indicator - Positioned at the bottom of the card */}
      <div
        className="budget-expand-hint"
        onClick={(e) => {
          e.stopPropagation();
          toggleExpanded();
        }}
      >
        <span>{isExpanded ? 'Hide detailed breakdown' : 'Tap for daily safe limit & category budgets'}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        />
      </div>
    </div>
  );
};

export default MainBudgetCard;
