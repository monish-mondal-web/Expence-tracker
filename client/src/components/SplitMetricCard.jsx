import React from 'react';
import { formatCurrency } from '../utils/currency';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const SplitMetricCard = ({ data }) => {
  const remaining = data?.remainingBudget || 0;
  const spent = data?.totalSpent || 0;

  return (
    <div className="tim-split-card">
      <div className="tim-split-blob-top" />
      <div className="tim-split-blob-bottom" />

      {/* Left: Remaining Budget (Income Style) */}
      <div className="tim-split-col left">
        <div className="tim-split-icon-circle up">
          <ArrowUp size={20} color="#10B981" strokeWidth={2.5} />
        </div>
        <div>
          <span className="tim-split-label">Remaining</span>
          <div className="tim-split-amount">{formatCurrency(remaining)}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="tim-split-divider" />

      {/* Right: Spent (Expenses Style) */}
      <div className="tim-split-col right">
        <div className="tim-split-icon-circle down">
          <ArrowDown size={20} color="#F43F5E" strokeWidth={2.5} />
        </div>
        <div>
          <span className="tim-split-label">Expenses</span>
          <div className="tim-split-amount">{formatCurrency(spent)}</div>
        </div>
      </div>
    </div>
  );
};
