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
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];

  // Core recommended spaces
  const PRESET_SPACES = ['Food & Dining', 'Room Rent', 'Gym', 'Travel'];

  // Food subcategories that belong UNDER Food & Dining and MUST NOT appear as top-level spaces
  const FOOD_SUB_NAMES = new Set([
    'groceries', 'meat / fish', 'meat', 'fish', 'snacks', 'breakfast',
    'lunch', 'dinner', 'drinks', 'fruits & vegetables', 'fruits', 'vegetables',
    'coffee', 'tea', 'beverages'
  ]);

  // Aggregate and sort spaces:
  // 1. Food & Dining is ALWAYS 1st right after "All Spaces"
  // 2. Spaces with money added (monthlyBudget > 0 or totalSpent > 0) come next (sorted descending)
  // 3. Unbudgeted spaces come after that
  const spaceMap = new Map();

  // Find Food & Dining data
  const foodServer = serverSpaces.find((s) => String(s?.name || '').toLowerCase() === 'food & dining');
  const foodBreakdown = categoryBreakdown.find((c) => String(c?.category || '').toLowerCase() === 'food & dining');
  const foodBudget = foodServer?.monthlyBudget || foodBreakdown?.budget || dashboardData?.monthlyBudget || 0;
  const foodSpent = foodServer?.totalSpent || foodBreakdown?.spent || dashboardData?.totalSpent || 0;

  spaceMap.set('food & dining', {
    name: 'Food & Dining',
    icon: foodServer?.icon || 'Utensils',
    color: foodServer?.color || '#10B981',
    monthlyBudget: foodBudget,
    totalSpent: foodSpent,
    hasBudget: foodBudget > 0,
    hasMoney: foodBudget > 0 || foodSpent > 0,
  });

  // Collect from serverSpaces
  serverSpaces.forEach((s) => {
    if (!s || !s.name) return;
    const lower = String(s.name).toLowerCase().trim();
    if (lower === 'food & dining' || FOOD_SUB_NAMES.has(lower)) return;
    const b = s.monthlyBudget || 0;
    const sp = s.totalSpent || 0;
    spaceMap.set(lower, {
      name: s.name,
      icon: s.icon || 'Utensils',
      color: s.color || '#6366F1',
      monthlyBudget: b,
      totalSpent: sp,
      hasBudget: b > 0,
      hasMoney: b > 0 || sp > 0,
    });
  });

  // Collect from categoryBreakdown
  categoryBreakdown.forEach((cb) => {
    if (!cb || !cb.category) return;
    const lower = String(cb.category).toLowerCase().trim();
    if (lower === 'food & dining' || FOOD_SUB_NAMES.has(lower)) return;
    const b = cb.budget || 0;
    const sp = cb.spent || 0;
    const existing = spaceMap.get(lower);
    if (existing) {
      existing.monthlyBudget = existing.monthlyBudget || b;
      existing.totalSpent = existing.totalSpent || sp;
      existing.hasBudget = existing.hasBudget || b > 0;
      existing.hasMoney = existing.monthlyBudget > 0 || existing.totalSpent > 0;
    } else {
      spaceMap.set(lower, {
        name: cb.category,
        icon: cb.icon || 'Sparkles',
        color: cb.color || '#EC4899',
        monthlyBudget: b,
        totalSpent: sp,
        hasBudget: b > 0,
        hasMoney: b > 0 || sp > 0,
      });
    }
  });

  // Add preset spaces fallback if not already added
  PRESET_SPACES.forEach((name) => {
    const lower = String(name).toLowerCase();
    if (!spaceMap.has(lower)) {
      let icon = 'Utensils';
      let color = '#10B981';
      if (name === 'Room Rent') { icon = 'Home'; color = '#6366F1'; }
      if (name === 'Gym') { icon = 'Dumbbell'; color = '#F59E0B'; }
      if (name === 'Travel') { icon = 'Car'; color = '#3B82F6'; }
      spaceMap.set(lower, {
        name,
        icon,
        color,
        monthlyBudget: 0,
        totalSpent: 0,
        hasBudget: false,
        hasMoney: false,
      });
    }
  });

  // Add custom categories if not present
  if (Array.isArray(categories)) {
    categories.forEach((c) => {
      if (!c || !c.name) return;
      const lower = String(c.name).toLowerCase().trim();
      if (!spaceMap.has(lower) && !FOOD_SUB_NAMES.has(lower)) {
        spaceMap.set(lower, {
          name: c.name,
          icon: c.icon || 'Sparkles',
          color: c.color || '#8B5CF6',
          monthlyBudget: 0,
          totalSpent: 0,
          hasBudget: false,
          hasMoney: false,
        });
      }
    });
  }

  // Separate Food & Dining from other spaces
  const spacesList = Array.from(spaceMap.values()).filter((s) => s && s.name);
  const foodSpace = spacesList.find((s) => String(s.name).toLowerCase() === 'food & dining');
  const otherSpaces = spacesList.filter((s) => String(s.name).toLowerCase() !== 'food & dining');

  // Sort other spaces:
  // 1. Those with money (monthlyBudget > 0 or totalSpent > 0) come first, sorted by amount descending
  // 2. Spaces without money come after
  otherSpaces.sort((a, b) => {
    const aVal = Math.max(a?.monthlyBudget || 0, a?.totalSpent || 0);
    const bVal = Math.max(b?.monthlyBudget || 0, b?.totalSpent || 0);

    if (aVal > 0 && bVal === 0) return -1;
    if (aVal === 0 && bVal > 0) return 1;
    if (aVal > 0 && bVal > 0) return bVal - aVal;

    const aIsPreset = PRESET_SPACES.some((p) => p.toLowerCase() === String(a?.name || '').toLowerCase());
    const bIsPreset = PRESET_SPACES.some((p) => p.toLowerCase() === String(b?.name || '').toLowerCase());
    if (aIsPreset && !bIsPreset) return -1;
    if (!aIsPreset && bIsPreset) return 1;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });

  const displaySpaces = foodSpace ? [foodSpace, ...otherSpaces] : otherSpaces;

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
          if (!space || !space.name) return null;
          const isActive = String(activeSpace || '').toLowerCase() === String(space.name).toLowerCase();
          const serverSpaceObj = serverSpaces.find((s) => String(s?.name || '').toLowerCase() === String(space.name).toLowerCase());
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
