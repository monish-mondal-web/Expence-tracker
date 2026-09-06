import React from 'react';
import { formatCurrency } from '../utils/currency';
import { getRelativeDateLabel } from '../utils/date';
import { CategoryIcon } from './CategoryIcon';
import { useApp } from '../context/AppContext';
import { Edit2, Trash2 } from 'lucide-react';

export const ExpenseItem = ({ expense, categoryMeta, onDelete }) => {
  const { openEditExpense } = useApp();

  const iconName = categoryMeta?.icon || 'Utensils';
  const iconColor = categoryMeta?.color || '#0F172A';
  const relativeDate = getRelativeDateLabel(expense.date);

  return (
    <div className="transaction-item">
      <div className="transaction-left">
        <div
          className="transaction-icon-badge"
          style={{
            background: `${iconColor}15`,
          }}
        >
          <CategoryIcon name={iconName} size={20} color={iconColor} />
        </div>
        <div className="transaction-info">
          <h4>{expense.category}</h4>
          <p>
            {relativeDate} {expense.note ? `• ${expense.note}` : ''}
          </p>
        </div>
      </div>

      <div className="transaction-right">
        <div className="transaction-amount">{formatCurrency(expense.amount)}</div>
        <div className="transaction-actions">
          <button
            type="button"
            className="action-icon-btn"
            onClick={() => openEditExpense(expense)}
            title="Edit expense"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            className="action-icon-btn delete"
            onClick={() => onDelete(expense)}
            title="Delete expense"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
