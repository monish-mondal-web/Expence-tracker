import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CategoryIcon } from './CategoryIcon';
import { toLocalISODate } from '../utils/date';
import { X, Check } from 'lucide-react';

export const AddExpenseModal = () => {
  const {
    isAddExpenseOpen,
    closeAddExpense,
    editingExpense,
    preselectedDate,
    categories,
    triggerRefresh,
    showToast,
    addExpenseOptimistic,
    todayDate,
  } = useApp();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDate);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        setDate(preselectedDate || todayDate);
        setCategory(categories[0]?.name || 'Lunch');
        setNote('');
      }
      setError('');
    }
  }, [isAddExpenseOpen, editingExpense, preselectedDate, todayDate, categories]);

  if (!isAddExpenseOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0');
      return;
    }

    if (!category) {
      setError('Please select a food category');
      return;
    }

    if (!date) {
      setError('Please choose a valid date');
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
        setError(err.message || 'Failed to update expense');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // INSTANT OPTIMISTIC ADDITION (0ms)
      addExpenseOptimistic(payload);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAddExpense}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingExpense ? 'Edit Food Expense' : 'Add Food Expense'}</h3>
          <button type="button" className="modal-close-btn" onClick={closeAddExpense}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

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

          {/* Category Chips */}
          <div className="form-group">
            <label className="form-label">Category</label>
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
