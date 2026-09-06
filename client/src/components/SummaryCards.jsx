import React from 'react';
import { formatCurrency } from '../utils/currency';
import { Clock, Shield, BarChart2, CalendarDays } from 'lucide-react';

export const SummaryCards = ({ data }) => {
  if (!data || !data.hasBudget || data.monthlyBudget <= 0) return null;

  const {
    todaySpent,
    safeDailyBudget,
    averageDailySpend,
    remainingDays,
  } = data;

  const cards = [
    {
      label: "Today's Spent",
      value: formatCurrency(todaySpent),
      icon: Clock,
      color: '#3B82F6',
    },
    {
      label: 'Safe Daily Limit',
      value: formatCurrency(safeDailyBudget),
      icon: Shield,
      color: '#10B981',
    },
    {
      label: 'Average Daily Spend',
      value: formatCurrency(averageDailySpend),
      icon: BarChart2,
      color: '#F59E0B',
    },
    {
      label: 'Remaining Days',
      value: `${remainingDays}`,
      icon: CalendarDays,
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="summary-card">
            <div className="summary-card-label">
              <Icon size={14} color={card.color} />
              <span>{card.label}</span>
            </div>
            <div className="summary-card-value">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
};
