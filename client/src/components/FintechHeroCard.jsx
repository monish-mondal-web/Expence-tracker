import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import {
  ShieldCheck,
  Compass,
  Clock,
  Wallet,
  AlertTriangle,
  AlertCircle,
  Pencil,
  Plus,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const FintechHeroCard = ({
  data,
  onSetBudget,
  onAddExpense,
  onNavigateCalendar,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const budget = data?.monthlyBudget || 0;
  const hasBudget = data?.hasBudget && budget > 0;

  if (!hasBudget) {
    return (
      <div className="salung-wallet-card empty-state">
        <div className="salung-watermark-traces" />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '1rem 0' }}>
          <div className="salung-empty-icon-wrap">
            <Wallet size={28} color="#38BDF8" strokeWidth={2} />
          </div>
          <h2 className="salung-empty-title">Set your monthly food budget</h2>
          <p className="salung-empty-desc">
            Activate dynamic safe zones, daily spending limits, and automated recommendations.
          </p>
          <button
            type="button"
            className="salung-empty-btn"
            onClick={onSetBudget}
          >
            <Wallet size={16} strokeWidth={2.2} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    safeDailyBudget = 0,
    todaySpent = 0,
    safeZoneStatus = 'Safe Zone',
    safeZoneKey = 'safe',
    dynamicSafeDailyBudget = 0,
    dynamicDailyBudget = 0,
    remainingDays = 0,
    remainingBudget = 0,
    totalSpent = 0,
    smartMessage = '',
  } = data || {};

  const spentPercent = Math.min(
    Math.max(Math.round((totalSpent / (budget || 1)) * 100), 0),
    100
  );

  const renderStatusIcon = () => {
    switch (safeZoneKey) {
      case 'exceeded':
        return <AlertCircle size={12} color="#FB7185" />;
      case 'approaching':
        return <AlertTriangle size={12} color="#FBBF24" />;
      default:
        return <ShieldCheck size={12} color="#34D399" />;
    }
  };

  return (
    <div className="salung-wallet-card">
      {/* Decorative subtle circuit trace watermark */}
      <div className="salung-watermark-traces" />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Top Meta Row: Days remaining, Center Status Chip, and Edit Button */}
        <div className="salung-card-topbar">
          <div className="salung-days-pill">
            <Clock size={11} />
            <span>{remainingDays} days left</span>
          </div>

          <div className={`salung-status-pill ${safeZoneKey}`}>
            <span className="salung-status-dot" />
            <span>{(safeZoneStatus || 'SAFE ZONE').replace(/[✓✔\u2713]/g, '').trim()}</span>
          </div>

          <button
            type="button"
            className="salung-edit-pill"
            onClick={onSetBudget}
            title="Edit monthly budget"
          >
            <Pencil size={11} strokeWidth={2.2} />
            <span>Edit</span>
          </button>
        </div>

        {/* Center Main Balance Block */}
        <div className="salung-balance-block">
          <span className="salung-balance-label">Total Food Budget</span>
          <div className="salung-balance-amount">{formatCurrency(budget)}</div>
        </div>

        {/* Minimal Progress Bar & Budget vs Spent Breakdown */}
        <div className="salung-progress-wrap">
          <div className="salung-progress-bar">
            <div
              className={`salung-progress-fill ${safeZoneKey}`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
          <div className="salung-progress-meta">
            <div className="meta-pill remaining">
              <span className="pill-dot emerald" />
              <span>Remaining:</span>
              <strong style={{ color: '#34D399' }}>{formatCurrency(remainingBudget)}</strong>
            </div>
            <div className="meta-pill spent">
              <span className="pill-dot gray" />
              <span>Spent:</span>
              <strong>{formatCurrency(totalSpent)}</strong>
              <span className="pill-pct">({spentPercent}%)</span>
            </div>
          </div>
        </div>

        {/* 4 Circular Action Buttons (Matching reference design 1:1) */}
        <div className="salung-actions-row">
          {/* Button 1: Add Expense */}
          <button
            type="button"
            className="salung-action-btn"
            onClick={onAddExpense}
            title="Add Expense"
          >
            <div className="salung-circle-icon primary">
              <Plus size={20} strokeWidth={2.6} />
            </div>
            <span className="salung-circle-label">Add Expense</span>
          </button>

          {/* Button 2: Set Budget */}
          <button
            type="button"
            className="salung-action-btn"
            onClick={onSetBudget}
            title="Set Food Budget"
          >
            <div className="salung-circle-icon secondary">
              <ArrowUpRight size={19} strokeWidth={2.4} />
            </div>
            <span className="salung-circle-label">Set Budget</span>
          </button>

          {/* Button 3: Daily Safe Limit / Insight Toggle */}
          <button
            type="button"
            className={`salung-action-btn ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded((prev) => !prev)}
            title="Dynamic Recommended Spend"
          >
            <div className="salung-circle-icon accent">
              <Compass size={19} strokeWidth={2.3} />
            </div>
            <span className="salung-circle-label">
              Daily {formatCurrency(dynamicSafeDailyBudget)}
            </span>
          </button>

          {/* Button 4: Calendar */}
          <button
            type="button"
            className="salung-action-btn"
            onClick={onNavigateCalendar}
            title="View Food Expense Calendar"
          >
            <div className="salung-circle-icon secondary">
              <CalendarDays size={18} strokeWidth={2.2} />
            </div>
            <span className="salung-circle-label">Calendar</span>
          </button>
        </div>

        {/* Expandable Daily Insight Drawer */}
        {isExpanded && (
          <div className="salung-insight-drawer">
            <div className="drawer-header">
              <div className="drawer-title">
                <span>DYNAMIC SAFE LIMIT BREAKDOWN</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsExpanded(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-grid">
              <div className="drawer-item">
                <span className="drawer-label">Safe Daily Spend</span>
                <span className="drawer-val highlight">
                  {formatCurrency(dynamicSafeDailyBudget)}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Full Daily Budget</span>
                <span className="drawer-val">
                  {formatCurrency(dynamicDailyBudget)}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Spent Today</span>
                <span className="drawer-val" style={{ color: todaySpent > 0 ? '#FCD34D' : '#34D399' }}>
                  {formatCurrency(todaySpent)}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Safe Buffer Left</span>
                <span className="drawer-val" style={{ color: '#34D399' }}>
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
            </div>

            {smartMessage && (
              <div className="drawer-message">
                <ShieldCheck size={14} color="#10B981" style={{ flexShrink: 0 }} />
                <span>{smartMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
