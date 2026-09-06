import React from 'react';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear } from '../utils/date';
import { useApp } from '../context/AppContext';
import { Edit3, Wallet } from 'lucide-react';

export const BudgetCard = ({ data, isLoading }) => {
  const { openSetBudget, currentMonth, currentYear } = useApp();

  if (isLoading) {
    return (
      <div className="hero-budget-card" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ opacity: 0.5 }}>Loading food budget...</div>
      </div>
    );
  }

  const hasBudget = data?.hasBudget && data?.monthlyBudget > 0;

  if (!hasBudget) {
    return (
      <div className="hero-budget-card" style={{ textAlign: 'center', padding: '2.5rem 1.75rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Wallet size={24} color="#34D399" strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem', color: '#FFFFFF' }}>
          Set your monthly food budget
        </h2>
        <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '0.92rem', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
          Choose your budget to start tracking your daily food expenses.
        </p>
        <button
          type="button"
          onClick={openSetBudget}
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'transform 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Set Budget
        </button>
      </div>
    );
  }

  const { monthlyBudget, totalSpent, remainingBudget, budgetUsedPercentage } = data;

  let progressStatusClass = '';
  if (budgetUsedPercentage >= 90) {
    progressStatusClass = 'danger';
  } else if (budgetUsedPercentage >= 70) {
    progressStatusClass = 'warning';
  }

  return (
    <div className="hero-budget-card">
      <div className="hero-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="hero-card-tag">FOOD BUDGET</span>
          <button
            type="button"
            onClick={openSetBudget}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-on-dark-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
            title="Edit monthly budget"
          >
            <Edit3 size={14} />
          </button>
        </div>
        <div className="hero-card-month-badge">
          {formatMonthYear(currentMonth, currentYear)}
        </div>
      </div>

      <div className="hero-balance-label">Total Monthly Budget</div>
      <div className="hero-balance-amount">{formatCurrency(monthlyBudget)}</div>

      <div className="hero-metrics-row">
        <div className="hero-metric-col">
          <span>Spent</span>
          <strong>{formatCurrency(totalSpent)}</strong>
        </div>
        <div className="hero-metric-col">
          <span>Remaining</span>
          <strong style={{ color: remainingBudget <= 0 ? '#FB7185' : '#FFFFFF' }}>
            {formatCurrency(remainingBudget)}
          </strong>
        </div>
      </div>

      <div className="hero-progress-area">
        <div className="hero-progress-meta">
          <span>Progress</span>
          <span>{budgetUsedPercentage}% used</span>
        </div>
        <div className="hero-progress-bar-bg">
          <div
            className={`hero-progress-bar-fill ${progressStatusClass}`}
            style={{ width: `${Math.min(100, budgetUsedPercentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
