import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getMonthNames } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { X, SlidersHorizontal, Calculator } from 'lucide-react';

export const SetBudgetModal = () => {
  const {
    isSetBudgetOpen,
    closeSetBudget,
    currentMonth,
    currentYear,
    categories,
    showToast,
    setBudgetOptimistic,
  } = useApp();

  const [mode, setMode] = useState('split'); // 'split' | 'total'
  const [singleBudgetAmount, setSingleBudgetAmount] = useState('');
  const [categoryBudgetsMap, setCategoryBudgetsMap] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When modal opens, load existing budget for selected month if available
  useEffect(() => {
    if (isSetBudgetOpen) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);

      api.getBudget(currentMonth, currentYear)
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data;
            if (data.budgetAmount) {
              setSingleBudgetAmount(String(data.budgetAmount));
            } else {
              setSingleBudgetAmount('');
            }

            if (Array.isArray(data.categoryBudgets) && data.categoryBudgets.length > 0) {
              const map = {};
              data.categoryBudgets.forEach((cb) => {
                if (cb && cb.category) {
                  map[cb.category] = cb.amount || '';
                }
              });
              setCategoryBudgetsMap(map);
              setMode('split');
            } else {
              setCategoryBudgetsMap({});
            }
          } else {
            setSingleBudgetAmount('');
            setCategoryBudgetsMap({});
          }
        })
        .catch(() => {
          setSingleBudgetAmount('');
          setCategoryBudgetsMap({});
        });
    }
  }, [isSetBudgetOpen, currentMonth, currentYear]);

  if (!isSetBudgetOpen) return null;

  const handleCategoryAmountChange = (catName, val) => {
    setCategoryBudgetsMap((prev) => ({
      ...prev,
      [catName]: val === '' ? '' : Math.max(0, Number(val)),
    }));
  };

  const handleAddIncrement = (catName, inc) => {
    setCategoryBudgetsMap((prev) => {
      const current = Number(prev[catName]) || 0;
      return {
        ...prev,
        [catName]: current + inc,
      };
    });
  };

  // Calculate live sum of all category splits
  const calculatedTotalFromSplits = Object.values(categoryBudgetsMap).reduce((sum, val) => {
    const n = Number(val);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let totalBudget = 0;
    let categoryBudgetsPayload = [];

    if (mode === 'split') {
      categoryBudgetsPayload = Object.entries(categoryBudgetsMap)
        .map(([cat, amt]) => ({ category: cat, amount: Number(amt) || 0 }))
        .filter((c) => c.amount > 0);

      totalBudget = categoryBudgetsPayload.reduce((sum, c) => sum + c.amount, 0);

      if (totalBudget <= 0) {
        showToast('Please allocate an amount to at least one category', 'error');
        return;
      }
    } else {
      totalBudget = Number(singleBudgetAmount);
      if (!singleBudgetAmount || isNaN(totalBudget) || totalBudget <= 0) {
        showToast('Please enter a valid monthly budget greater than 0', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await setBudgetOptimistic({
        budgetAmount: totalBudget,
        categoryBudgets: categoryBudgetsPayload,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });
    } catch {
      // Error handled by optimistic sync
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthNames = getMonthNames();

  return (
    <div className="modal-overlay" onClick={closeSetBudget}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SlidersHorizontal size={18} color="#0F172A" strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Set Monthly Budget</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Split by category or set total budget
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeSetBudget}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ overflowY: 'auto', paddingRight: '0.2rem', flex: 1 }}>
          <form onSubmit={handleSubmit} id="budget-modal-form">
            {/* Target Month & Year Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
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

            {/* Mode Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                background: '#F8FAFC',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '1rem',
                border: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setMode('split')}
                style={{
                  padding: '0.55rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'split' ? '#0F172A' : 'transparent',
                  color: mode === 'split' ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Split by Category</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('total')}
                style={{
                  padding: '0.55rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'total' ? '#0F172A' : 'transparent',
                  color: mode === 'total' ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Calculator size={14} />
                <span>Single Total</span>
              </button>
            </div>

            {/* Live Total Header Banner */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                marginBottom: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Monthly Budget
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D', lineHeight: 1.2 }}>
                  {formatCurrency(mode === 'split' ? calculatedTotalFromSplits : (Number(singleBudgetAmount) || 0))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block' }}>
                  Safe Daily Target
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534' }}>
                  ~{formatCurrency(Math.round(((mode === 'split' ? calculatedTotalFromSplits : (Number(singleBudgetAmount) || 0)) / 30) * 0.7))} / day
                </span>
              </div>
            </div>

            {/* MODE 1: SPLIT BY CATEGORY */}
            {mode === 'split' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  Allocate Category Limits
                </span>

                {categories.map((cat) => {
                  const currentVal = categoryBudgetsMap[cat.name] ?? '';
                  return (
                    <div
                      key={cat._id || cat.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        {/* Category identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${cat.color || '#3B82F6'}18`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CategoryIcon name={cat.icon} size={16} color={cat.color || '#3B82F6'} />
                          </div>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1E293B' }}>
                            {cat.name}
                          </span>
                        </div>

                        {/* Amount field */}
                        <div style={{ width: '130px', position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '0.85rem',
                              color: '#64748B',
                              fontWeight: 600,
                            }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            className="form-input"
                            style={{
                              paddingLeft: '24px',
                              paddingRight: '8px',
                              paddingTop: '0.45rem',
                              paddingBottom: '0.45rem',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              textAlign: 'right',
                            }}
                            value={currentVal}
                            onChange={(e) => handleCategoryAmountChange(cat.name, e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Quick Increments */}
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleAddIncrement(cat.name, 500)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          +₹500
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddIncrement(cat.name, 1000)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          +₹1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddIncrement(cat.name, 2000)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          +₹2,000
                        </button>
                        {Number(currentVal) > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCategoryAmountChange(cat.name, '')}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              borderRadius: '6px',
                              border: '1px solid #FEE2E2',
                              background: '#FEF2F2',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MODE 2: SINGLE TOTAL */
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Total Monthly Budget Amount</label>
                <div className="amount-input-wrapper">
                  <span className="amount-prefix">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 15000"
                    autoFocus
                    className="form-input amount-field"
                    value={singleBudgetAmount}
                    onChange={(e) => setSingleBudgetAmount(e.target.value)}
                    required
                  />
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem', display: 'block' }}>
                  Base daily limit will be calculated as budget ÷ 30. Safe daily limit will be 70% of base.
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Footer Submit Button */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
          <button
            type="submit"
            form="budget-modal-form"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Saving...' : 'Save Monthly Budget'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetBudgetModal;
