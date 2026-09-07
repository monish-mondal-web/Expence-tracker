import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getMonthNames } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { X, SlidersHorizontal, Plus, Trash2, Check, Sparkles } from 'lucide-react';

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
            if (Array.isArray(data.categoryBudgets) && data.categoryBudgets.length > 0) {
              const map = {};
              data.categoryBudgets.forEach((cb) => {
                if (cb && cb.category) {
                  map[cb.category] = cb.amount || '';
                }
              });
              setCategoryBudgetsMap(map);
            } else if (data.budgetAmount && data.budgetAmount > 0) {
              // Backward compatibility: if single total budget existed, default it to Food & Dining
              setCategoryBudgetsMap({
                'Food & Dining': data.budgetAmount,
              });
            } else {
              setCategoryBudgetsMap({});
            }
          } else {
            setCategoryBudgetsMap({});
          }
        })
        .catch(() => {
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

  const handleToggleCategory = (catName) => {
    setCategoryBudgetsMap((prev) => {
      const copy = { ...prev };
      if (copy[catName] !== undefined) {
        delete copy[catName];
      } else {
        copy[catName] = 1000;
      }
      return copy;
    });
  };

  const handleRemoveCategory = (catName) => {
    setCategoryBudgetsMap((prev) => {
      const copy = { ...prev };
      delete copy[catName];
      return copy;
    });
  };

  const handleAddPopularPresets = () => {
    setCategoryBudgetsMap((prev) => ({
      ...prev,
      'Food & Dining': prev['Food & Dining'] || 3000,
      'Room Rent': prev['Room Rent'] || 5000,
      'Gym': prev['Gym'] || 1500,
      'Travel': prev['Travel'] || 1000,
    }));
  };

  // Calculate live sum of all category budgets
  const calculatedTotalBudget = Object.values(categoryBudgetsMap).reduce((sum, val) => {
    const n = Number(val);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const categoryBudgetsPayload = Object.entries(categoryBudgetsMap)
      .map(([cat, amt]) => ({ category: cat, amount: Number(amt) || 0 }))
      .filter((c) => c.amount > 0);

    const totalBudget = categoryBudgetsPayload.reduce((sum, c) => sum + c.amount, 0);

    if (totalBudget <= 0) {
      showToast('Please select at least one category and assign an amount', 'error');
      return;
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
  const activeCategoryEntries = Object.keys(categoryBudgetsMap);

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
                Set budget for Food, Travel, Tour, Room Rent, Health, Gym & more
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
                  {formatCurrency(calculatedTotalBudget)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block' }}>
                  Safe Daily Target
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534' }}>
                  ~{formatCurrency(Math.round((calculatedTotalBudget / 30) * 0.7))} / day
                </span>
              </div>
            </div>

            {/* Category Picker Section */}
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                  Select Categories to Budget
                </span>
                {activeCategoryEntries.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddPopularPresets}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#10B981',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Add Popular</span>
                  </button>
                )}
              </div>

              {/* Horizontal wrapping chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(() => {
                  const FOOD_SUB_NAMES = new Set([
                    'groceries', 'meat / fish', 'meat', 'fish', 'snacks', 'breakfast',
                    'lunch', 'dinner', 'drinks', 'fruits & vegetables', 'fruits', 'vegetables',
                    'coffee', 'tea', 'beverages'
                  ]);
                  const CORE_SPACES = [
                    { name: 'Food & Dining', icon: 'Utensils', color: '#10B981' },
                    { name: 'Room Rent', icon: 'Home', color: '#6366F1' },
                    { name: 'Gym', icon: 'Dumbbell', color: '#F59E0B' },
                    { name: 'Travel', icon: 'Car', color: '#3B82F6' },
                  ];
                  const availableSpaces = [];
                  const addedSpaces = new Set();
                  CORE_SPACES.forEach((cs) => {
                    const fromCat = categories.find((c) => c.name.toLowerCase() === cs.name.toLowerCase());
                    availableSpaces.push(fromCat || cs);
                    addedSpaces.add(cs.name.toLowerCase());
                  });
                  categories.forEach((cat) => {
                    const lower = cat.name.toLowerCase().trim();
                    if (!addedSpaces.has(lower) && !FOOD_SUB_NAMES.has(lower)) {
                      availableSpaces.push(cat);
                      addedSpaces.add(lower);
                    }
                  });

                  return availableSpaces.map((cat) => {
                    const isPicked = categoryBudgetsMap[cat.name] !== undefined;
                    return (
                      <button
                        key={cat._id || cat.name}
                        type="button"
                        onClick={() => handleToggleCategory(cat.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          border: isPicked ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                          background: isPicked ? '#ECFDF5' : '#FFFFFF',
                          color: isPicked ? '#065F46' : '#334155',
                          fontSize: '0.78rem',
                          fontWeight: isPicked ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CategoryIcon name={cat.icon} size={14} color={isPicked ? '#059669' : (cat.color || '#64748B')} />
                        <span>{cat.name}</span>
                        {isPicked ? (
                          <Check size={13} color="#059669" strokeWidth={3} />
                        ) : (
                          <Plus size={12} color="#94A3B8" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Allocated Category Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                  Category Budgets ({activeCategoryEntries.length})
                </span>
                {activeCategoryEntries.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Tap +₹ to quickly add amount
                  </span>
                )}
              </div>

              {activeCategoryEntries.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <p style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                    No categories selected yet
                  </p>
                  <p style={{ margin: '0 0 0.85rem', fontSize: '0.76rem', color: '#94A3B8' }}>
                    Tap any category chip above (e.g. Food & Dining, Travel, Tour, Room Rent, Gym, Health) to set its monthly budget.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddPopularPresets}
                    style={{
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Add Food, Travel & Room Rent
                  </button>
                </div>
              ) : (
                activeCategoryEntries.map((catName) => {
                  const cat = categories.find((c) => c.name === catName) || {
                    name: catName,
                    icon: 'Utensils',
                    color: '#10B981',
                  };
                  const currentVal = categoryBudgetsMap[catName] ?? '';
                  const percent =
                    calculatedTotalBudget > 0 && Number(currentVal) > 0
                      ? Math.round((Number(currentVal) / calculatedTotalBudget) * 100)
                      : 0;

                  return (
                    <div
                      key={catName}
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
                          <div>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1E293B' }}>
                              {cat.name}
                            </span>
                            {percent > 0 && (
                              <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>
                                ({percent}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount field & delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '120px', position: 'relative' }}>
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

                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat.name)}
                            title="Remove category"
                            aria-label="Remove category"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Quick Increments */}
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                        <button
                          type="button"
                          onClick={() => handleAddIncrement(cat.name, 5000)}
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
                          +₹5,000
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
