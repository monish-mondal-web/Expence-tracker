import React from 'react';
import { formatCurrency } from '../utils/currency';
import { Lightbulb } from 'lucide-react';

export const SpendingInsight = ({ data }) => {
  const budget = data?.monthlyBudget || 0;
  const totalSpent = data?.totalSpent || 0;

  // Days elapsed in current month
  const now = new Date();
  const currentMonth = data?.month || now.getMonth() + 1;
  const currentYear = data?.year || now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysElapsed = Math.max(1, Math.min(now.getDate(), daysInMonth));

  // Dynamic calculations
  const spentPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const expectedSpending = budget > 0 ? Math.round((budget / daysInMonth) * daysElapsed) : 0;
  const diffFromExpected = expectedSpending - totalSpent;
  const isUnderExpected = diffFromExpected >= 0;
  const diffAmount = Math.abs(diffFromExpected);

  let headline = "On track this week!";
  let detailText = `Spent ${spentPercent}% in ${daysElapsed}d · ${formatCurrency(diffAmount)} under expected pace.`;

  if (budget <= 0) {
    headline = "Set food budget";
    detailText = "Set a monthly budget to unlock daily pace insights.";
  } else if (!isUnderExpected) {
    headline = "Ahead of expected pace";
    detailText = `Spent ${spentPercent}% in ${daysElapsed}d · ${formatCurrency(diffAmount)} over expected pace.`;
  }

  return (
    <div className="spending-insight-card">
      {/* Left Lightbulb Icon Circle */}
      <div className="insight-icon-circle">
        <Lightbulb size={18} color="#059669" strokeWidth={2.4} />
      </div>

      {/* Center Text Content */}
      <div className="insight-body">
        <div className="insight-badge-tag">Spending Insight</div>
        <h4 className="insight-headline">{headline}</h4>
        <p className="insight-description">{detailText}</p>
      </div>

      {/* Right Graphic: Modern Ascending Green Bars */}
      <div className="insight-bars-graphic">
        <span className="insight-bar bar-1" />
        <span className="insight-bar bar-2" />
        <span className="insight-bar bar-3" />
        <span className="insight-bar bar-4" />
        <span className="insight-bar bar-5" />
      </div>
    </div>
  );
};
