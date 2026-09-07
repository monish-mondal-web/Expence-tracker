import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear } from '../utils/date';
import { SpendingChart } from '../components/SpendingChart';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { Skeleton } from '../components/Skeleton';
import {
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';

export const AnalyticsPage = () => {
  const { currentMonth, currentYear, todayDate, refreshKey } = useApp();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getAnalytics(currentMonth, currentYear, todayDate)
      .then((res) => {
        if (isMounted && res.success) {
          setAnalyticsData(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load analytics', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMonth, currentYear, todayDate, refreshKey]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton height="140px" borderRadius="var(--radius-xl)" />
        <Skeleton height="260px" borderRadius="var(--radius-xl)" />
        <Skeleton height="260px" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  const {
    monthlyBudget = 0,
    totalSpent = 0,
    remainingBudget = 0,
    averageDailySpend = 0,
    safeDailyBudget = 0,
    daysTracked = 0,
    remainingDays = 0,
    budgetUsedPercentage = 0,
    dailyChartData = [],
    categoryBreakdown = [],
    peakDay,
  } = analyticsData || {};

  const hasData = totalSpent > 0 || monthlyBudget > 0;

  if (!hasData) {
    return (
      <div className="empty-state-box">
        <div className="empty-state-icon">
          <PieIcon size={32} />
        </div>
        <h3>Not enough data yet</h3>
        <p>Set a monthly budget and log daily food expenses to view detailed spending analytics and charts.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Overview Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="summary-card">
          <div className="summary-card-label">Monthly Budget</div>
          <div className="summary-card-value">{formatCurrency(monthlyBudget)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Total Spent</div>
          <div className="summary-card-value">{formatCurrency(totalSpent)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Remaining</div>
          <div className="summary-card-value" style={{ color: remainingBudget <= 0 ? 'var(--danger-primary)' : 'inherit' }}>
            {formatCurrency(remainingBudget)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Budget Used</div>
          <div className="summary-card-value">{budgetUsedPercentage}%</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Avg Daily Spend</div>
          <div className="summary-card-value">{formatCurrency(averageDailySpend)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Safe Daily Limit</div>
          <div className="summary-card-value">{formatCurrency(safeDailyBudget)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Days Tracked</div>
          <div className="summary-card-value">{daysTracked}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Remaining Days</div>
          <div className="summary-card-value">{remainingDays}</div>
        </div>
      </div>

      {/* Peak Day Highlight Banner if present */}
      {peakDay && peakDay.amount > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Highest Spending Day
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Day {peakDay.day} ({peakDay.date})
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(peakDay.amount)}
          </div>
        </div>
      )}

      {/* Daily Spending Chart Section */}
      <div className="transactions-section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h2>Daily Spending Chart</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {formatMonthYear(currentMonth, currentYear)}
          </span>
        </div>
        <SpendingChart dailyData={dailyChartData} safeLimit={safeDailyBudget} />
      </div>

      {/* Category Breakdown (Donut Chart & Percentages) */}
      <div className="transactions-section">
        <div className="section-header">
          <h2>Food Category Breakdown</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Where your food budget goes
          </span>
        </div>
        <CategoryBreakdown breakdown={categoryBreakdown} totalSpent={totalSpent} />
      </div>
    </div>
  );
};
