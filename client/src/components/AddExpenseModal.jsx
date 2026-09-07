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

  const SPACE_CATEGORIES = {
    'Food & Dining': [
      { name: 'Lunch', icon: 'Utensils', color: '#10B981' },
      { name: 'Dinner', icon: 'Utensils', color: '#6366F1' },
      { name: 'Breakfast', icon: 'Coffee', color: '#F59E0B' },
      { name: 'Snacks', icon: 'Cookie', color: '#EC4899' },
      { name: 'Groceries', icon: 'ShoppingCart', color: '#14B8A6' },
      { name: 'Meat / Fish', icon: 'Fish', color: '#EA580C' },
      { name: 'Drinks & Beverages', icon: 'Wine', color: '#06B6D4' },
      { name: 'Fruits & Veg', icon: 'Apple', color: '#84CC16' },
      { name: 'Other Food', icon: 'Utensils', color: '#64748B' },
    ],
    'Room Rent': [
      { name: 'Room Rent', icon: 'Home', color: '#6366F1' },
      { name: 'Electricity Bill', icon: 'Zap', color: '#EAB308' },
      { name: 'Maintenance', icon: 'Wrench', color: '#06B6D4' },
      { name: 'Water Bill', icon: 'Droplets', color: '#3B82F6' },
      { name: 'Wi-Fi / Internet', icon: 'Wifi', color: '#8B5CF6' },
      { name: 'Maid / Cook', icon: 'Home', color: '#10B981' },
      { name: 'Other Rent', icon: 'MoreHorizontal', color: '#64748B' },
    ],
    'Gym': [
      { name: 'Gym Membership', icon: 'CreditCard', color: '#F59E0B' },
      { name: 'Protein & Supplements', icon: 'Flame', color: '#EF4444' },
      { name: 'Personal Trainer', icon: 'Award', color: '#8B5CF6' },
      { name: 'Gym Gear & Clothes', icon: 'ShoppingBag', color: '#EC4899' },
      { name: 'Diet & Shakes', icon: 'Coffee', color: '#10B981' },
      { name: 'Other Fitness', icon: 'Dumbbell', color: '#64748B' },
    ],
    'Travel': [
      { name: 'Fuel & Petrol', icon: 'Fuel', color: '#EF4444' },
      { name: 'Daily Commute', icon: 'Car', color: '#3B82F6' },
      { name: 'Metro / Train', icon: 'Train', color: '#06B6D4' },
      { name: 'Cab & Auto', icon: 'Car', color: '#F59E0B' },
      { name: 'Bus Fare', icon: 'Bus', color: '#10B981' },
      { name: 'Flight / Long Trip', icon: 'Plane', color: '#8B5CF6' },
      { name: 'Other Travel', icon: 'Compass', color: '#64748B' },
    ],
    'Tour': [
      { name: 'Hotel & Stay', icon: 'Home', color: '#6366F1' },
      { name: 'Tickets & Booking', icon: 'Plane', color: '#06B6D4' },
      { name: 'Tour Dining', icon: 'Utensils', color: '#10B981' },
      { name: 'Sightseeing & Entry', icon: 'Compass', color: '#F59E0B' },
      { name: 'Tour Shopping', icon: 'ShoppingBag', color: '#EC4899' },
      { name: 'Other Tour', icon: 'Plane', color: '#64748B' },
    ],
    'Health': [
      { name: 'Medicines', icon: 'HeartPulse', color: '#EF4444' },
      { name: 'Doctor Consultation', icon: 'HeartPulse', color: '#06B6D4' },
      { name: 'Lab Tests & Reports', icon: 'Activity', color: '#8B5CF6' },
      { name: 'Health Insurance', icon: 'ShieldCheck', color: '#10B981' },
      { name: 'Dental & Eye Care', icon: 'Sparkles', color: '#3B82F6' },
      { name: 'Other Health', icon: 'HeartPulse', color: '#64748B' },
    ],
    'Shopping': [
      { name: 'Clothing & Fashion', icon: 'ShoppingBag', color: '#EC4899' },
      { name: 'Electronics & Gadgets', icon: 'Laptop', color: '#3B82F6' },
      { name: 'Footwear', icon: 'ShoppingBag', color: '#F59E0B' },
      { name: 'Home & Kitchen', icon: 'Home', color: '#10B981' },
      { name: 'Beauty & Personal Care', icon: 'Sparkles', color: '#8B5CF6' },
      { name: 'Other Shopping', icon: 'ShoppingBag', color: '#64748B' },
    ],
    'Bills & Utilities': [
      { name: 'Electricity', icon: 'Zap', color: '#EAB308' },
      { name: 'Mobile Recharge', icon: 'Smartphone', color: '#3B82F6' },
      { name: 'Internet / Wi-Fi', icon: 'Wifi', color: '#6366F1' },
      { name: 'Gas Cylinder', icon: 'Flame', color: '#EF4444' },
      { name: 'DTH / OTT', icon: 'Tv', color: '#EC4899' },
      { name: 'Other Bills', icon: 'Zap', color: '#64748B' },
    ],
    'Other': [
      { name: 'Personal', icon: 'Sparkles', color: '#10B981' },
      { name: 'Gifts & Donations', icon: 'Gift', color: '#EC4899' },
      { name: 'Emergency', icon: 'AlertCircle', color: '#EF4444' },
      { name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#64748B' },
    ],
  };

  const getCategoriesForSpace = (spName) => {
    if (SPACE_CATEGORIES[spName]) return SPACE_CATEGORIES[spName];
    return [
      { name: `${spName} Main`, icon: 'Sparkles', color: '#10B981' },
      { name: 'Supplies & Items', icon: 'ShoppingBag', color: '#3B82F6' },
      { name: 'Fees & Services', icon: 'CreditCard', color: '#6366F1' },
      { name: 'Maintenance', icon: 'Wrench', color: '#F59E0B' },
      { name: `Other ${spName}`, icon: 'MoreHorizontal', color: '#64748B' },
    ];
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

        if (editingExpense.space) {
          setChosenSpace(editingExpense.space);
        } else {
          // Detect space from category
          const catLower = (editingExpense.category || '').toLowerCase();
          let detected = 'Food & Dining';
          for (const [sName, sCats] of Object.entries(SPACE_CATEGORIES)) {
            if (sCats.some((c) => c.name.toLowerCase() === catLower)) {
              detected = sName;
              break;
            }
          }
          if (detected === 'Food & Dining' && !isFoodSub(editingExpense.category)) {
            detected = catLower.includes('rent') ? 'Room Rent'
                     : catLower.includes('gym') ? 'Gym'
                     : catLower.includes('travel') ? 'Travel'
                     : 'Food & Dining';
          }
          setChosenSpace(detected);
        }
      } else {
        setAmount('');
        setDate(preselectedDate || todayDate);
        setNote('');

        const targetSpace = (activeSpace && activeSpace !== 'All') ? activeSpace : 'Food & Dining';
        setChosenSpace(targetSpace);
        const cats = getCategoriesForSpace(targetSpace);
        setCategory(cats[0]?.name || targetSpace);
      }
    }
  }, [isAddExpenseOpen, editingExpense, preselectedDate, todayDate, activeSpace]);

  // When chosenSpace changes (for a new expense), update category
  const handleSpaceChange = (sp) => {
    setChosenSpace(sp);
    const cats = getCategoriesForSpace(sp);
    setCategory(cats[0]?.name || sp);
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

    const finalCategory = category || chosenSpace;

    if (!finalCategory) {
      showToast('Please select a category', 'error');
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
      space: chosenSpace,
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

  const currentSpaceCategories = getCategoriesForSpace(chosenSpace);

  return (
    <div className="modal-overlay" onClick={closeAddExpense}>
      <div className="modal-content custom-scrollbar" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
            <label className="form-label">Expense Space</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {availableSpaces.map((sp) => {
                const isSelected = chosenSpace.toLowerCase() === sp.name.toLowerCase();
                return (
                  <button
                    key={sp.name}
                    type="button"
                    onClick={() => handleSpaceChange(sp.name)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${sp.color}` : '1px solid #E2E8F0',
                      background: isSelected ? `${sp.color}15` : '#FFFFFF',
                      color: isSelected ? '#0F172A' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flex: '1 1 auto',
                      minWidth: 'fit-content',
                      justifyContent: 'center',
                    }}
                  >
                    <CategoryIcon name={sp.icon} size={15} color={sp.color} />
                    <span style={{ whiteSpace: 'nowrap' }}>{sp.name}</span>
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
                        : `${formatCurrency(catItem.remaining)} left`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
            <div className="category-chips-grid">
              {currentSpaceCategories.map((cat) => {
                const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.name}
                    type="button"
                    className={`category-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.name)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : cat.color || '#64748B'}
                    />
                    <span style={{ whiteSpace: 'nowrap' }}>{cat.name}</span>
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
