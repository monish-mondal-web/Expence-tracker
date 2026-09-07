import React from 'react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';
import { Plus, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export const SpaceSwitcher = () => {
  const {
    activeSpace,
    setActiveSpace,
    dashboardData,
    categories,
    openAddSpace,
  } = useApp();

  // Spaces list from dashboardData or categories
  const serverSpaces = dashboardData?.spaces || [];

  // Core recommended spaces in priority order
  const PRESET_SPACES = ['Food & Dining', 'Room Rent', 'Gym', 'Travel'];

  // Food subcategories that belong UNDER Food & Dining and MUST NOT appear as top-level spaces
  const FOOD_SUB_NAMES = new Set([
    'groceries', 'meat / fish', 'meat', 'fish', 'snacks', 'breakfast',
    'lunch', 'dinner', 'drinks', 'fruits & vegetables', 'fruits', 'vegetables',
    'coffee', 'tea', 'beverages'
  ]);

  // Merge spaces list
  const displaySpaces = [];
  const addedNames = new Set();

  // 1. Add preset spaces first if they exist
  PRESET_SPACES.forEach((name) => {
    const s = serverSpaces.find((x) => x.name.toLowerCase() === name.toLowerCase()) ||
              categories.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (s) {
      displaySpaces.push({
        name: s.name,
        icon: s.icon || 'Utensils',
        color: s.color || '#10B981',
        monthlyBudget: s.monthlyBudget || 0,
        hasBudget: !!s.hasBudget,
      });
      addedNames.add(s.name.toLowerCase());
    } else {
      // Provide default fallback
      let icon = 'Utensils';
      let color = '#10B981';
      if (name === 'Room Rent') { icon = 'Home'; color = '#6366F1'; }
      if (name === 'Gym') { icon = 'Dumbbell'; color = '#F59E0B'; }
      if (name === 'Travel') { icon = 'Car'; color = '#3B82F6'; }
      displaySpaces.push({
        name,
        icon,
        color,
        monthlyBudget: 0,
        hasBudget: false,
      });
      addedNames.add(name.toLowerCase());
    }
  });

  // 2. Add remaining server spaces / custom spaces (excluding food sub-categories)
  serverSpaces.forEach((s) => {
    const lower = s.name.toLowerCase().trim();
    if (!addedNames.has(lower) && !FOOD_SUB_NAMES.has(lower)) {
      displaySpaces.push({
        name: s.name,
        icon: s.icon || 'Utensils',
        color: s.color || '#64748B',
        monthlyBudget: s.monthlyBudget || 0,
        hasBudget: !!s.hasBudget,
      });
      addedNames.add(lower);
    }
  });

  return (
    <div className="space-switcher-wrapper" role="region" aria-label="Expense Spaces Switcher">
      <div className="space-switcher-scroll">
        {/* All Spaces Overview Pill */}
        <button
          type="button"
          className={`space-pill ${activeSpace === 'All' ? 'active' : ''}`}
          onClick={() => setActiveSpace('All')}
        >
          <LayoutGrid size={15} color={activeSpace === 'All' ? '#34D399' : '#94A3B8'} />
          <span className="space-pill-title">All Spaces</span>
        </button>

        {/* Dynamic Space Pills */}
        {displaySpaces.map((space) => {
          const isActive = activeSpace?.toLowerCase() === space.name.toLowerCase();
          const serverSpaceObj = serverSpaces.find((s) => s.name.toLowerCase() === space.name.toLowerCase());
          const budget = serverSpaceObj?.monthlyBudget || space.monthlyBudget || 0;

          return (
            <button
              key={space.name}
              type="button"
              className={`space-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSpace(space.name)}
              title={`${space.name} Space`}
            >
              <div
                className="space-pill-icon"
                style={{
                  background: isActive ? `${space.color}28` : `${space.color}18`,
                  color: space.color,
                }}
              >
                <CategoryIcon name={space.icon} size={14} color={space.color} />
              </div>
              <span className="space-pill-title">{space.name}</span>
              {budget > 0 && (
                <span className="space-pill-budget">
                  {formatCurrency(budget)}
                </span>
              )}
            </button>
          );
        })}

        {/* Add Custom Space Pill */}
        <button
          type="button"
          className="space-add-pill"
          onClick={openAddSpace}
          title="Add a new custom Space (e.g. Tour, Health, Pet Care)"
        >
          <Plus size={14} color="#059669" strokeWidth={2.5} />
          <span>Add Space</span>
        </button>
      </div>
    </div>
  );
};

export default SpaceSwitcher;
