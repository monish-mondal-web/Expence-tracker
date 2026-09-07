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

  const [chosenSpace, setChosenSpace] = useState('Food & Dining');

  const FOOD_SUBCATEGORIES = [
    { name: 'Groceries', icon: 'ShoppingCart', color: '#14B8A6' },
    { name: 'Breakfast', icon: 'Coffee', color: '#F59E0B' },
    { name: 'Lunch', icon: 'Utensils', color: '#10B981' },
    { name: 'Dinner', icon: 'Utensils', color: '#6366F1' },
    { name: 'Snacks', icon: 'Cookie', color: '#EC4899' },
    { name: 'Meat / Fish', icon: 'Fish', color: '#EA580C' },
    { name: 'Drinks & Beverages', icon: 'Wine', color: '#06B6D4' },
    { name: 'Fruits & Veg', icon: 'Apple', color: '#84CC16' },
    { name: 'Other Food', icon: 'Utensils', color: '#64748B' },
  ];

  const SPACE_QUICK_NOTES = {
    'Room Rent': ['Monthly Rent', 'Electricity Bill', 'Maintenance', 'Water Bill', 'Internet / Wi-Fi'],
    'Gym': ['Monthly Membership', 'Protein / Supplements', 'Personal Trainer', 'Gym Gear / Shoes'],
    'Travel': ['Daily Commute', 'Fuel / Petrol', 'Metro / Train', 'Uber / Cab / Auto', 'Bus Fare'],
  };

  const isFoodSub = (cat = '') => {
    const l = cat.toLowerCase();
    return l.includes('food') || l.includes('grocer') || l.includes('snack') ||
           l.includes('lunch') || l.includes('dinner') || l.includes('breakfast') ||
           l.includes('meat') || l.includes('fish') || l.includes('drink') ||
           l.includes('fruit') || l.includes('vegetable');
  };

  // Synchronize state when modal opens or editingExpense changes
  useEffect(() => {
    if (isAddExpenseOpen) {
      if (editingExpense) {
        setAmount(String(editingExpense.amount));
        setDate(toLocalISODate(editingExpense.date));
        setCategory(editingExpense.category);
        setNote(editingExpense.note || '');

        const catLower = (editingExpense.category || '').toLowerCase();
        if (catLower.includes('rent')) {
          setChosenSpace('Room Rent');
        } else if (catLower.includes('gym')) {
          setChosenSpace('Gym');
        } else if (catLower.includes('travel')) {
          setChosenSpace('Travel');
        } else if (isFoodSub(editingExpense.category)) {
          setChosenSpace('Food & Dining');
        } else {
          setChosenSpace(editingExpense.category);
        }
      } else {
        setAmount('');
        setDate(preselectedDate || todayDate);
        setNote('');

        const targetSpace = (activeSpace && activeSpace !== 'All') ? activeSpace : 'Food & Dining';
        setChosenSpace(targetSpace);

        if (targetSpace === 'Food & Dining') {
          setCategory('Lunch');
        } else {
          setCategory(targetSpace);
        }
      }
    }
  }, [isAddExpenseOpen, editingExpense, preselectedDate, todayDate, activeSpace]);

  // When chosenSpace changes (for a new expense), update category
  const handleSpaceChange = (sp) => {
    setChosenSpace(sp);
    if (sp === 'Food & Dining') {
      if (!isFoodSub(category)) {
        setCategory('Lunch');
      }
    } else {
      setCategory(sp);
    }
  };

  if (!isAddExpenseOpen) return null;

  // Available spaces list
  const CORE_SPACES = [
    { name: 'Food & Dining', icon: 'Utensils', color: '#10B981' },
    { name: 'Room Rent', icon: 'Home', color: '#6366F1' },
    { name: 'Gym', icon: 'Dumbbell', color: '#F59E0B' },
    { name: 'Travel', icon: 'Car', color: '#3B82F6' },
  ];

  const availableSpaces = [...CORE_SPACES];
  const added = new Set(CORE_SPACES.map((s) => s.name.toLowerCase()));

  (dashboardData?.spaces || []).forEach((s) => {
    const l = s.name.toLowerCase().trim();
    if (!added.has(l) && !isFoodSub(s.name)) {
      availableSpaces.push({
        name: s.name,
        icon: s.icon || 'Sparkles',
        color: s.color || '#EC4899',
      });
      added.add(l);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid expense amount greater than 0', 'error');
      return;
    }

    const finalCategory = chosenSpace === 'Food & Dining' ? (category || 'Food & Dining') : chosenSpace;

    if (!finalCategory) {
      showToast('Please select a category or space', 'error');
      return;
    }

    if (!date) {
      showToast('Please choose a valid date', 'error');
      return;
    }

    const payload = {
      amount: numAmount,
      date: new Date(date).toISOString(),
      category: finalCategory,
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
              Select space & category to track spending
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeAddExpense}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Space Selector Tabs */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Expense Space (Part)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.4rem' }}>
              {availableSpaces.map((sp) => {
                const isSelected = chosenSpace.toLowerCase() === sp.name.toLowerCase();
                return (
                  <button
                    key={sp.name}
                    type="button"
                    onClick={() => handleSpaceChange(sp.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${sp.color}` : '1px solid #E2E8F0',
                      background: isSelected ? `${sp.color}15` : '#FFFFFF',
                      color: isSelected ? '#0F172A' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      justifyContent: 'center',
                    }}
                  >
                    <CategoryIcon name={sp.icon} size={15} color={sp.color} />
                    <span>{sp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* If Food & Dining Space: Show Food Sub-part Category Chips */}
          {chosenSpace === 'Food & Dining' ? (
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Food & Dining Sub-part</label>
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
                          : `${formatCurrency(catItem.remaining)} left`}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="category-chips-grid">
                {FOOD_SUBCATEGORIES.map((cat) => {
                  const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.name}
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
          ) : (
            /* Quick note tags for Room Rent, Gym, Travel */
            SPACE_QUICK_NOTES[chosenSpace] && (
              <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                <label className="form-label">Quick Tag</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {SPACE_QUICK_NOTES[chosenSpace].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNote(tag)}
                      style={{
                        background: note === tag ? '#0F172A' : '#F1F5F9',
                        color: note === tag ? '#FFFFFF' : '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Optional Note */}
          <div className="form-group">
            <label className="form-label">Note (Optional)</label>
            <input
              type="text"
              placeholder={
                chosenSpace === 'Food & Dining'
                  ? 'e.g. Swiggy order, groceries from supermarket'
                  : chosenSpace === 'Room Rent'
                  ? 'e.g. March rent, owner GPay'
                  : chosenSpace === 'Gym'
                  ? 'e.g. 3 months renewal, whey protein'
                  : 'e.g. Metro recharge, petrol bunk'
              }
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
