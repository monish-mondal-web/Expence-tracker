import React from 'react';
import { formatCurrency } from '../utils/currency';
import { Compass, Calendar, TrendingUp } from 'lucide-react';

export const DailyRecommendation = ({ data }) => {
  if (!data || !data.hasBudget || data.monthlyBudget <= 0) return null;

  const {
    dynamicSafeDailyBudget,
    dynamicDailyBudget,
    remainingBudget,
    remainingDays,
  } = data;

  const isBudgetExhausted = remainingBudget <= 0;

  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <Compass size={18} color="#6366F1" />
        <h3>RECOMMENDED DAILY SPEND</h3>
      </div>

      <div className="recommendation-amount">
        {isBudgetExhausted ? '₹0' : formatCurrency(dynamicSafeDailyBudget)}
      </div>

      <p className="recommendation-subtitle">
        {isBudgetExhausted
          ? 'Monthly budget reached.'
          : 'Based on your remaining budget and remaining days.'}
      </p>

      {!isBudgetExhausted && (
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F1F5F9', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <Calendar size={13} />
            {remainingDays} days remaining
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#EEF2FF', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: '#4F46E5', fontWeight: 600 }}>
            <TrendingUp size={13} />
            Full daily budget: {formatCurrency(dynamicDailyBudget)}
          </span>
        </div>
      )}
    </div>
  );
};
