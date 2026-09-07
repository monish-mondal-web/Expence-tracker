import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CategoryIcon } from './CategoryIcon';
import { toLocalISODate } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { X, Check } from 'lucide-react';

export const AddExpenseModal = () => {
  const {
    isAddExpenseOpen,
    closeAddExpense,
    editingExpense,
    preselectedDate,
    categories,
    dashboardData,
    triggerRefresh,
    showToast,
    addExpenseOptimistic,
    todayDate,
    activeSpace,
  } = useApp();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDate);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize state when modal opens or editingExpense changes
  useEffect(() => {
    if (isAddExpenseOpen) {
      if (editingExpense) {
        setAmount(String(editingExpense.amount));
        setDate(toLocalISODate(editingExpense.date));
        setCategory(editingExpense.category);
        setNote(editingExpense.note || '');
      } else {
        setAmount('');
        const defaultCat = (activeSpace && activeSpace !== 'All' && categories.some((c) => c.name === activeSpace))
          ? activeSpace
          : (categories[0]?.name || 'Food & Dining');
        setCategory(defaultCat);
        setNote('');
      }
    }
  }, [isAddExpenseOpen, editingExpense, preselectedDate, todayDate, categories, activeSpace]);

  if (!isAddExpenseOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid expense amount greater than 0', 'error');
      return;
    }

    if (!category) {
      showToast('Please select a food category', 'error');
      return;
    }

    if (!date) {
      showToast('Please choose a valid date', 'error');
      return;
    }

    const payload = {
      amount: numAmount,
      date: new Date(date).toISOString(),
      category,
      note: note.trim(),
    };

    if (editingExpense) {
      try {
        setIsSubmitting(true);
        await api.updateExpense(editingExpense._id, payload);
        showToast('Expense updated');
        triggerRefresh();
        closeAddExpense();
      } catch (err) {
        showToast(err.message || 'Failed to update expense', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Optimistic create
      addExpenseOptimistic(payload);
      closeAddExpense();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAddExpense}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
          <button type="button" className="modal-close-btn" onClick={closeAddExpense}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount Field */}
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                autoFocus
                className="form-input amount-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Category Chips with Live Budget Info */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Category</label>
              {(() => {
                const catItem = dashboardData?.categoryBreakdown?.find((c) => c.category === category);
                if (catItem && catItem.budget > 0) {
                  const isOver = catItem.remaining !== null && catItem.remaining < 0;
                  return (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: isOver ? '#FB7185' : '#10B981',
                        background: isOver ? '#FFF1F2' : '#F0FDF4',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${isOver ? '#FECDD3' : '#BBF7D0'}`,
                      }}
                    >
                      {isOver
                        ? `${formatCurrency(Math.abs(catItem.remaining))} over budget`
                        : `${formatCurrency(catItem.remaining)} left of ${formatCurrency(catItem.budget)}`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
            <div className="category-chips-grid">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat._id || cat.name}
                    type="button"
                    className={`category-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.name)}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : cat.color || '#64748B'}
                    />
                    <span>{cat.name}</span>
                    {isSelected && <Check size={12} style={{ marginLeft: '2px' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div className="form-group">
            <label className="form-label">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Swiggy order, groceries from supermarket"
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};
