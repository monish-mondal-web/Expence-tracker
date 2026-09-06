import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatMonthYear, getMonthNames } from '../utils/date';
import { X, Target } from 'lucide-react';

export const SetBudgetModal = () => {
  const {
    isSetBudgetOpen,
    closeSetBudget,
    currentMonth,
    currentYear,
    triggerRefresh,
    showToast,
    setBudgetOptimistic,
  } = useApp();

  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // When modal opens, load existing budget for selected month if available
  useEffect(() => {
    if (isSetBudgetOpen) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
      setError('');

      api.getBudget(currentMonth, currentYear)
        .then((res) => {
          if (res.success && res.data && res.data.budgetAmount) {
            setBudgetAmount(String(res.data.budgetAmount));
          } else {
            setBudgetAmount('');
          }
        })
        .catch(() => {
          setBudgetAmount('');
        });
    }
  }, [isSetBudgetOpen, currentMonth, currentYear]);

  if (!isSetBudgetOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const num = Number(budgetAmount);
    if (!budgetAmount || isNaN(num) || num <= 0) {
      setError('Please enter a valid monthly food budget greater than 0');
      return;
    }

    // INSTANT OPTIMISTIC BUDGET UPDATE (0ms)
    setBudgetOptimistic({
      budgetAmount: num,
      month: Number(selectedMonth),
      year: Number(selectedYear),
    });
  };

  const monthNames = getMonthNames();

  return (
    <div className="modal-overlay" onClick={closeSetBudget}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} color="#0F172A" />
            </div>
            <h3>Monthly Food Budget</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeSetBudget}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Target Period */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label">Month</label>
              <select
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {monthNames.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                min={2020}
                max={2035}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Monthly Food Budget Amount</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 15000"
                autoFocus
                className="form-input amount-field"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.4rem', display: 'block' }}>
              Base daily limit will be calculated as budget ÷ 30. Safe daily limit will be 70% of base.
            </span>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Budget'}
          </button>
        </form>
      </div>
    </div>
  );
};
