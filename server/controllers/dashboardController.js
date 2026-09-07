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

    // 7. Multi-Space Summary with individual metrics per space
    const allKnownSpaces = new Map();
    allCategoriesMeta.forEach((c) => {
      allKnownSpaces.set(c.name, {
        name: c.name,
        icon: c.icon || 'Utensils',
        color: c.color || '#10B981',
      });
    });

    allCategoryNames.forEach((catName) => {
      if (!allKnownSpaces.has(catName)) {
        allKnownSpaces.set(catName, {
          name: catName,
          icon: metaMap[catName]?.icon || 'Utensils',
          color: metaMap[catName]?.color || '#64748B',
        });
      }
    });

    const spaces = Array.from(allKnownSpaces.values()).map((catMeta) => {
      const catName = catMeta.name;
      const bAmount = Math.round((budgetMap[catName] || 0) * 100) / 100;
      const sAmount = Math.round((categoryTotals[catName] || 0) * 100) / 100;
      const tSpent = Math.round((todayCategoryTotals[catName] || 0) * 100) / 100;
      const sDays = new Set(
        expenses.filter((e) => (e.category || 'Other') === catName).map((e) => new Date(e.date).toISOString().slice(0, 10))
      ).size;

      const spaceMetrics = calculateMetrics({
        monthlyBudgetAmount: bAmount,
        totalSpent: sAmount,
        todaySpent: tSpent,
        elapsedDays,
        daysTracked: sDays,
      });

      return {
        name: catName,
        icon: catMeta.icon,
        color: catMeta.color,
        hasBudget: bAmount > 0,
        monthlyBudget: bAmount,
        totalSpent: sAmount,
        todaySpent: tSpent,
        remainingBudget: bAmount > 0 ? Math.round((bAmount - sAmount) * 100) / 100 : 0,
        count: categoryCounts[catName] || 0,
        ...spaceMetrics,
      };
    });

    // 8. Space Filtering
    const qSpace = req.query.space;
    let activeSpaceData = null;
    let filteredRecentExpenses = expenses.slice(0, 8);

    if (qSpace && qSpace !== 'All') {
      const activeSpaceObj = spaces.find((s) => s.name.toLowerCase() === qSpace.toLowerCase());
      if (activeSpaceObj) {
        activeSpaceData = activeSpaceObj;
        filteredRecentExpenses = expenses.filter((e) => (e.category || 'Other').toLowerCase() === qSpace.toLowerCase()).slice(0, 8);
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
        spaces,
        activeSpace: qSpace || null,
        activeSpaceData,
      },
    });
  } catch (error) {
    next(error);
  }
};
