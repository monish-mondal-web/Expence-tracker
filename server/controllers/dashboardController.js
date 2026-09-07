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

    // 6. Category breakdown combining budgeted and spent categories
    const categoryTotals = {};
    const categoryCounts = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const todayCategoryTotals = {};
    todayExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      todayCategoryTotals[cat] = (todayCategoryTotals[cat] || 0) + e.amount;
    });

    // Categories metadata for icons and colors
    const allCategoriesMeta = await Category.find({
      $or: [{ userId: user._id }, { userId: null }],
    });
    const metaMap = {};
    allCategoriesMeta.forEach((c) => {
      metaMap[c.name] = { color: c.color, icon: c.icon };
    });

    // Union of categories that either have an expense or a budget
    const allCategoryNames = new Set([
      ...Object.keys(categoryTotals),
      ...Object.keys(budgetMap),
    ]);

    const fallbackColors = [
      '#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#EF4444', '#6366F1', '#D97706', '#64748B',
    ];

    const categoryBreakdown = Array.from(allCategoryNames).map((catName, idx) => {
      const spent = Math.round((categoryTotals[catName] || 0) * 100) / 100;
      const budget = Math.round((budgetMap[catName] || 0) * 100) / 100;
      const remaining = budget > 0 ? Math.round((budget - spent) * 100) / 100 : null;
      const percent = budget > 0
        ? Math.min(100, Math.round((spent / budget) * 100))
        : (totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0);

      const meta = metaMap[catName] || {};
      return {
        category: catName,
        spent,
        budget,
        remaining,
        percent,
        count: categoryCounts[catName] || 0,
        color: meta.color || fallbackColors[idx % fallbackColors.length],
        icon: meta.icon || 'Utensils',
      };
    }).sort((a, b) => (b.budget || b.spent) - (a.budget || a.spent));

    // 7. Space Hierarchy: Group food subcategories into "Food & Dining" space, separate Room Rent, Gym, Travel
    const FOOD_SUB_CATEGORIES = [
      'breakfast', 'lunch', 'dinner', 'snacks', 'groceries', 'fruits',
      'vegetables', 'meat / fish', 'meat', 'fish', 'drinks', 'coffee', 'tea'
    ];

    const isFoodSubCategory = (catName = '') => {
      const lower = catName.toLowerCase().trim();
      return lower === 'food & dining' || lower === 'food' || FOOD_SUB_CATEGORIES.some((f) => lower.includes(f));
    };

    // Calculate aggregated Food & Dining totals from all food subcategories
    const foodExpenses = expenses.filter((e) => isFoodSubCategory(e.category || 'Other'));
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

    // Combine all top spaces and calculate individual metrics for non-food spaces
    const allTopSpaces = [...defaultTopSpaces.slice(0, 1), ...defaultTopSpaces.slice(1).map((s) => {
      const bAmount = Math.round((budgetMap[s.name] || 0) * 100) / 100;
      const sExpenses = expenses.filter((e) => (e.category || 'Other').toLowerCase() === s.name.toLowerCase());
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
      const sExpenses = expenses.filter((e) => (e.category || 'Other').toLowerCase() === s.name.toLowerCase());
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

    // 8. Space Filtering
    const qSpace = req.query.space;
    let activeSpaceData = null;
    let filteredRecentExpenses = expenses.slice(0, 8);

    if (qSpace && qSpace !== 'All') {
      const activeSpaceObj = allTopSpaces.find((s) => s.name.toLowerCase() === qSpace.toLowerCase());
      if (activeSpaceObj) {
        activeSpaceData = activeSpaceObj;
        if (isFoodSubCategory(qSpace)) {
          filteredRecentExpenses = foodExpenses.slice(0, 8);
        } else {
          filteredRecentExpenses = expenses.filter((e) => (e.category || 'Other').toLowerCase() === qSpace.toLowerCase()).slice(0, 8);
        }
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
