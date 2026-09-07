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

  let headline = "You're on track this week!";
  let detailText = `You've spent ${spentPercent}% of your food budget in ${daysElapsed} days. That's ${formatCurrency(diffAmount)} under your expected spending.`;

  if (budget <= 0) {
    headline = "Ready to plan your food budget?";
    detailText = "Set a monthly food budget to unlock daily spending pace recommendations and smart alerts.";
  } else if (!isUnderExpected) {
    headline = "Spending slightly ahead of pace";
    detailText = `You've spent ${spentPercent}% of your budget in ${daysElapsed} days. That's ${formatCurrency(diffAmount)} above even pacing.`;
  }

  return (
    <div className="spending-insight-card">
      {/* Left Lightbulb Icon Circle */}
      <div className="insight-icon-circle">
        <Lightbulb size={20} color="#059669" strokeWidth={2.4} />
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
