import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/currency';
import { X, Sparkles, Plus } from 'lucide-react';

const SUGGESTED_ICONS = [
  'Plane',
  'Dumbbell',
  'Home',
  'Car',
  'HeartPulse',
  'ShoppingBag',
  'Film',
  'GraduationCap',
  'Utensils',
  'Coffee',
  'Sparkles',
  'Zap',
];

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#14B8A6', // Teal
  '#64748B', // Slate
];

export const AddSpaceModal = () => {
  const {
    isAddSpaceOpen,
    closeAddSpace,
    setActiveSpace,
    triggerRefresh,
    showToast,
    currentMonth,
    currentYear,
  } = useApp();

  const [spaceName, setSpaceName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Plane');
  const [selectedColor, setSelectedColor] = useState('#06B6D4');
  const [budgetAmount, setBudgetAmount] = useState('2000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddSpaceOpen) return null;

  const handleQuickBudget = (inc) => {
    setBudgetAmount((prev) => {
      const current = Number(prev) || 0;
      return String(current + inc);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = spaceName.trim();
    if (!trimmed) {
      showToast('Please enter a space name', 'error');
      return;
    }

    const numBudget = Number(budgetAmount) || 0;

    setIsSubmitting(true);
    try {
      const res = await api.createCategory({
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
        initialBudget: numBudget,
        month: currentMonth,
        year: currentYear,
      });

      if (res.success) {
        showToast(
          numBudget > 0
            ? `Space "${trimmed}" created with ${formatCurrency(numBudget)} budget!`
            : `Space "${trimmed}" created!`
        );
        setActiveSpace(trimmed);
        triggerRefresh();
        closeAddSpace();
        setSpaceName('');
        setBudgetAmount('2000');
      }
    } catch (err) {
      showToast(err.message || 'Failed to create space', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAddSpace}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color="#059669" strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Add Custom Space</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Set up a dedicated space for any activity with its own budget
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeAddSpace}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ overflowY: 'auto', paddingRight: '0.2rem', flex: 1 }}>
          <form onSubmit={handleSubmit} id="add-space-form">
            {/* Live Preview Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0d2822 0%, #081a16 100%)',
                borderRadius: '16px',
                padding: '14px 16px',
                color: '#FFFFFF',
                border: `1px solid ${selectedColor}40`,
                marginBottom: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${selectedColor}22`,
                    border: `1px solid ${selectedColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CategoryIcon name={selectedIcon} size={18} color={selectedColor} />
                </div>
                <div>
                  <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', display: 'block' }}>
                    {spaceName.trim() || 'New Space'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                    Dedicated Monthly Space
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'block' }}>
                  Budget
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34D399' }}>
                  {formatCurrency(Number(budgetAmount) || 0)}
                </span>
              </div>
            </div>

            {/* Space Name Input */}
            <div className="form-group">
              <label className="form-label">Space Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Tour, Health, Office, Gaming..."
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Monthly Budget for this Space */}
            <div className="form-group">
              <label className="form-label">Monthly Budget for this Space</label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input amount-field"
                  placeholder="2000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                />
              </div>

              {/* Quick Add Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickBudget(500)}
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
                  onClick={() => handleQuickBudget(1000)}
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
                  onClick={() => handleQuickBudget(2000)}
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
                  onClick={() => handleQuickBudget(5000)}
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

            {/* Icon Picker */}
            <div className="form-group">
              <label className="form-label">Choose Space Icon</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '0.45rem',
                }}
              >
                {SUGGESTED_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      style={{
                        height: '42px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${selectedColor}` : '1px solid #E2E8F0',
                        background: isSelected ? `${selectedColor}14` : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CategoryIcon
                        name={iconName}
                        size={18}
                        color={isSelected ? selectedColor : '#64748B'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Color Picker */}
            <div className="form-group">
              <label className="form-label">Theme Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {PRESET_COLORS.map((colorHex) => {
                  const isSelected = selectedColor === colorHex;
                  return (
                    <button
                      key={colorHex}
                      type="button"
                      onClick={() => setSelectedColor(colorHex)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: colorHex,
                        border: isSelected ? '3px solid #0F172A' : '2px solid #FFFFFF',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                      }}
                      title={colorHex}
                    />
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Submit Button */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
          <button
            type="submit"
            form="add-space-form"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Creating Space...' : 'Create Space'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSpaceModal;
