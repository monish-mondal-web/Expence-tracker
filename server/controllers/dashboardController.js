const MonthlyBudget = require('../models/MonthlyBudget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { getOrCreateDefaultUser } = require('../services/userService');
const { calculateMetrics, getMonthYearRange } = require('../services/budgetService');

// GET /api/dashboard
exports.getDashboardData = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { month: qMonth, year: qYear, today: qToday } = req.query;

    const { month, year, startOfMonth, endOfMonth, elapsedDays } = getMonthYearRange(qMonth, qYear, qToday);

    // 1. Fetch budget for this month
    const budgetDoc = await MonthlyBudget.findOne({
      userId: user._id,
      month,
      year,
    });

    const monthlyBudgetAmount = budgetDoc ? budgetDoc.budgetAmount : 0;
    const categoryBudgets = budgetDoc && Array.isArray(budgetDoc.categoryBudgets)
      ? budgetDoc.categoryBudgets
      : [];

    // Map of budgeted categories
    const budgetMap = {};
    categoryBudgets.forEach((cb) => {
      if (cb && cb.category) {
        budgetMap[cb.category] = Number(cb.amount) || 0;
      }
    });

    // 2. Fetch expenses for this month
    const expenses = await Expense.find({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: -1, createdAt: -1 });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. Compute today's spent using client today or server date
    let todayStart, todayEnd;
    if (qToday) {
      // Expecting YYYY-MM-DD
      const [ty, tm, td] = qToday.split('-').map(Number);
      todayStart = new Date(Date.UTC(ty, tm - 1, td, 0, 0, 0, 0));
      todayEnd = new Date(Date.UTC(ty, tm - 1, td, 23, 59, 59, 999));
    } else {
      const now = new Date();
      todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    }

    const todayExpenses = expenses.filter((e) => {
      const eDate = new Date(e.date);
      return eDate >= todayStart && eDate <= todayEnd;
    });

    const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Days tracked (unique dates with expenses)
    const trackedDates = new Set(
      expenses.map((e) => new Date(e.date).toISOString().slice(0, 10))
    );
    const daysTracked = trackedDates.size;

    // 5. Calculate all business logic metrics
    const metrics = calculateMetrics({
      monthlyBudgetAmount,
      totalSpent,
      todaySpent,
      elapsedDays,
      daysTracked,
    });

    // 6. Space Hierarchy and Category Helpers
    const FOOD_SUB_CATEGORIES = [
      'breakfast', 'lunch', 'dinner', 'snacks', 'groceries', 'fruits',
      'vegetables', 'meat / fish', 'meat', 'fish', 'drinks', 'coffee', 'tea'
    ];

    const isFoodSubCategory = (catName = '') => {
      const lower = (catName || '').toLowerCase().trim();
      return lower === 'food & dining' || lower === 'food' || FOOD_SUB_CATEGORIES.some((f) => lower.includes(f));
    };

    const isCategoryInSpace = (catName = '', spaceName = '') => {
      const cat = (catName || '').toLowerCase().trim();
      const space = (spaceName || '').toLowerCase().trim();

      if (cat === space) return true;

      if (space === 'food & dining' || space === 'food') {
        return isFoodSubCategory(cat);
      }
      if (space === 'room rent') {
        return cat.includes('rent') || cat.includes('flat') || cat.includes('maintenance') || cat.includes('water bill') || cat.includes('electricity bill') || cat.includes('maid');
      }
      if (space === 'gym') {
        return cat.includes('gym') || cat.includes('fitness') || cat.includes('workout') || cat.includes('trainer') || cat.includes('supplement');
      }
      if (space === 'travel') {
        return cat.includes('travel') || cat.includes('commute') || cat.includes('petrol') || cat.includes('fuel') || cat.includes('metro') || cat.includes('cab') || cat.includes('auto') || cat.includes('bus') || cat.includes('flight');
      }
      if (space === 'tour') {
        return cat.includes('tour') || cat.includes('sightseeing') || cat.includes('hotel') || cat.includes('stay');
      }
      if (space === 'health') {
        return cat.includes('health') || cat.includes('medicine') || cat.includes('doctor') || cat.includes('clinic') || cat.includes('hospital') || cat.includes('test');
      }
      if (space === 'shopping') {
        return cat.includes('shopping') || cat.includes('cloth') || cat.includes('gadget') || cat.includes('footwear') || cat.includes('beauty');
      }
      if (space === 'bills & utilities' || space === 'bills') {
        return cat.includes('bill') || cat.includes('recharge') || cat.includes('wifi') || cat.includes('gas') || cat.includes('dth');
      }
      return false;
    };

    // Calculate aggregated Food & Dining totals from all food subcategories
    const foodExpenses = expenses.filter((e) => {
      if (e.space && (e.space.toLowerCase() === 'food & dining' || e.space.toLowerCase() === 'food')) return true;
      return isFoodSubCategory(e.category || 'Other');
    });
    const foodTotalSpent = foodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const foodTodaySpent = foodExpenses.filter((e) => {
      const eDate = new Date(e.date);
      return eDate >= todayStart && eDate <= todayEnd;
    }).reduce((sum, e) => sum + e.amount, 0);
    const foodDaysTracked = new Set(foodExpenses.map((e) => new Date(e.date).toISOString().slice(0, 10))).size;

    const foodBudgetAmount = budgetMap['Food & Dining'] || budgetMap['Food'] || (
      // If no explicit Food & Dining key, default to monthly budget or sum of food subcategory budgets
      monthlyBudgetAmount > 0 && !budgetMap['Room Rent'] && !budgetMap['Gym'] ? monthlyBudgetAmount : 0
    );

    const foodSpaceMetrics = calculateMetrics({
      monthlyBudgetAmount: foodBudgetAmount,
      totalSpent: foodTotalSpent,
      todaySpent: foodTodaySpent,
      elapsedDays,
      daysTracked: foodDaysTracked,
    });

    // Core top-level spaces
    const defaultTopSpaces = [
      {
        name: 'Food & Dining',
        icon: 'Utensils',
        color: '#10B981',
        hasBudget: foodBudgetAmount > 0,
        monthlyBudget: foodBudgetAmount,
        totalSpent: foodTotalSpent,
        todaySpent: foodTodaySpent,
        remainingBudget: foodBudgetAmount > 0 ? Math.round((foodBudgetAmount - foodTotalSpent) * 100) / 100 : 0,
        count: foodExpenses.length,
        ...foodSpaceMetrics,
      },
      {
        name: 'Room Rent',
        icon: 'Home',
        color: '#6366F1',
      },
      {
        name: 'Gym',
        icon: 'Dumbbell',
        color: '#F59E0B',
      },
      {
        name: 'Travel',
        icon: 'Car',
        color: '#3B82F6',
      },
    ];

    // Categories metadata for icons and colors
    const allCategoriesMeta = await Category.find({
      $or: [{ userId: user._id }, { userId: null }],
    });
    const metaMap = {};
    allCategoriesMeta.forEach((c) => {
      metaMap[c.name] = { color: c.color, icon: c.icon };
    });

    // Collect custom spaces (anything that is NOT a food subcategory and not in default top spaces)
    const knownTopNames = new Set(defaultTopSpaces.map((s) => s.name.toLowerCase()));
    const customSpaces = [];

    allCategoriesMeta.forEach((c) => {
      const lower = c.name.toLowerCase().trim();
      if (!isFoodSubCategory(lower) && !knownTopNames.has(lower)) {
        customSpaces.push({
          name: c.name,
          icon: c.icon || 'Sparkles',
          color: c.color || '#EC4899',
        });
        knownTopNames.add(lower);
      }
    });

    Object.keys(budgetMap).forEach((bName) => {
      const lower = bName.toLowerCase().trim();
      if (!isFoodSubCategory(lower) && !knownTopNames.has(lower)) {
        const meta = metaMap[bName] || {};
        customSpaces.push({
          name: bName,
          icon: meta.icon || 'Sparkles',
          color: meta.color || '#8B5CF6',
        });
        knownTopNames.add(lower);
      }
    });

    // Combine all top spaces and calculate individual metrics for non-food spaces
    const allTopSpaces = [...defaultTopSpaces.slice(0, 1), ...defaultTopSpaces.slice(1).map((s) => {
      const bAmount = Math.round((budgetMap[s.name] || 0) * 100) / 100;
      const sExpenses = expenses.filter((e) => {
        if (e.space && e.space.toLowerCase() === s.name.toLowerCase()) return true;
        return isCategoryInSpace(e.category || 'Other', s.name);
      });
      const sAmount = sExpenses.reduce((sum, e) => sum + e.amount, 0);
      const tSpent = sExpenses.filter((e) => {
        const eDate = new Date(e.date);
        return eDate >= todayStart && eDate <= todayEnd;
      }).reduce((sum, e) => sum + e.amount, 0);
      const sDays = new Set(sExpenses.map((e) => new Date(e.date).toISOString().slice(0, 10))).size;

      const spaceMetrics = calculateMetrics({
        monthlyBudgetAmount: bAmount,
        totalSpent: sAmount,
        todaySpent: tSpent,
        elapsedDays,
        daysTracked: sDays,
      });

      return {
        ...s,
        hasBudget: bAmount > 0,
        monthlyBudget: bAmount,
        totalSpent: sAmount,
        todaySpent: tSpent,
        remainingBudget: bAmount > 0 ? Math.round((bAmount - sAmount) * 100) / 100 : 0,
        count: sExpenses.length,
        ...spaceMetrics,
      };
    }), ...customSpaces.map((s) => {
      const bAmount = Math.round((budgetMap[s.name] || 0) * 100) / 100;
      const sExpenses = expenses.filter((e) => {
        if (e.space && e.space.toLowerCase() === s.name.toLowerCase()) return true;
        return isCategoryInSpace(e.category || 'Other', s.name);
      });
      const sAmount = sExpenses.reduce((sum, e) => sum + e.amount, 0);
      const tSpent = sExpenses.filter((e) => {
        const eDate = new Date(e.date);
        return eDate >= todayStart && eDate <= todayEnd;
      }).reduce((sum, e) => sum + e.amount, 0);
      const sDays = new Set(sExpenses.map((e) => new Date(e.date).toISOString().slice(0, 10))).size;

      const spaceMetrics = calculateMetrics({
        monthlyBudgetAmount: bAmount,
        totalSpent: sAmount,
        todaySpent: tSpent,
        elapsedDays,
        daysTracked: sDays,
      });

      return {
        ...s,
        hasBudget: bAmount > 0,
        monthlyBudget: bAmount,
        totalSpent: sAmount,
        todaySpent: tSpent,
        remainingBudget: bAmount > 0 ? Math.round((bAmount - sAmount) * 100) / 100 : 0,
        count: sExpenses.length,
        ...spaceMetrics,
      };
    })];

    // 7. Space-Aware Category Breakdown with Nested Sub-Categories
    const categoryBreakdown = allTopSpaces.map((spaceItem) => {
      const sExpenses = spaceItem.name === 'Food & Dining'
        ? foodExpenses
        : expenses.filter((e) => {
            if (e.space && e.space.toLowerCase() === spaceItem.name.toLowerCase()) return true;
            return isCategoryInSpace(e.category || 'Other', spaceItem.name);
          });

      // Group sub-category spending
      const subTotals = {};
      const subCounts = {};
      sExpenses.forEach((e) => {
        const subCat = e.category || spaceItem.name;
        subTotals[subCat] = (subTotals[subCat] || 0) + e.amount;
        subCounts[subCat] = (subCounts[subCat] || 0) + 1;
      });

      const subCategories = Object.entries(subTotals).map(([catName, amt]) => {
        const subSpent = Math.round(amt * 100) / 100;
        const subMeta = metaMap[catName] || {};
        return {
          category: catName,
          spent: subSpent,
          count: subCounts[catName] || 0,
          color: subMeta.color || spaceItem.color,
          icon: subMeta.icon || spaceItem.icon,
        };
      }).sort((a, b) => b.spent - a.spent);

      const spent = spaceItem.totalSpent || 0;
      const budget = spaceItem.monthlyBudget || 0;
      const remaining = budget > 0 ? Math.round((budget - spent) * 100) / 100 : null;
      const percent = budget > 0
        ? Math.min(100, Math.round((spent / budget) * 100))
        : (totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0);

      return {
        category: spaceItem.name,
        spent,
        budget,
        remaining,
        percent,
        count: spaceItem.count || 0,
        color: spaceItem.color,
        icon: spaceItem.icon,
        subCategories,
      };
    }).filter((item) => item.budget > 0 || item.spent > 0)
      .sort((a, b) => (b.budget || b.spent) - (a.budget || a.spent));

    // 8. Space Filtering
    const qSpace = req.query.space;
    let activeSpaceData = null;
    let filteredRecentExpenses = expenses.slice(0, 8);

    if (qSpace && qSpace !== 'All') {
      const activeSpaceObj = allTopSpaces.find((s) => s.name.toLowerCase() === qSpace.toLowerCase());
      if (activeSpaceObj) {
        activeSpaceData = activeSpaceObj;
        filteredRecentExpenses = expenses.filter((e) => {
          if (e.space && e.space.toLowerCase() === qSpace.toLowerCase()) return true;
          return isCategoryInSpace(e.category || 'Other', qSpace);
        }).slice(0, 8);
      }
    }

    res.json({
      success: true,
      data: {
        hasBudget: !!budgetDoc,
        budgetId: budgetDoc ? budgetDoc._id : null,
        month,
        year,
        ...metrics,
        categoryBudgets,
        categoryBreakdown,
        recentExpenses: filteredRecentExpenses,
        spaces: allTopSpaces,
        activeSpace: qSpace || null,
        activeSpaceData,
      },
    });
  } catch (error) {
    next(error);
  }
};
