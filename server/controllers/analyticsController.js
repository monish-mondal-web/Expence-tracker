const MonthlyBudget = require('../models/MonthlyBudget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { getOrCreateDefaultUser } = require('../services/userService');
const { calculateMetrics, getMonthYearRange } = require('../services/budgetService');

// GET /api/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { month: qMonth, year: qYear, today: qToday } = req.query;

    const { month, year, startOfMonth, endOfMonth, elapsedDays } = getMonthYearRange(qMonth, qYear, qToday);

    // 1. Monthly Budget
    const budgetDoc = await MonthlyBudget.findOne({
      userId: user._id,
      month,
      year,
    });
    const monthlyBudgetAmount = budgetDoc ? budgetDoc.budgetAmount : 0;

    // 2. Fetch expenses in this month
    const expenses = await Expense.find({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. Tracked dates
    const trackedDates = new Set(
      expenses.map((e) => new Date(e.date).toISOString().slice(0, 10))
    );
    const daysTracked = trackedDates.size;

    // 4. Base calculations
    const metrics = calculateMetrics({
      monthlyBudgetAmount,
      totalSpent,
      todaySpent: 0, // not primary focus here, but included
      elapsedDays,
      daysTracked,
    });

    // 5. Daily Spending Chart Data (Day 1 through Days in Month)
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }

    expenses.forEach((e) => {
      const expDate = new Date(e.date);
      // Use UTC date as established
      const dayNum = expDate.getUTCDate();
      if (dailyMap[dayNum] !== undefined) {
        dailyMap[dayNum] += e.amount;
      }
    });

    let cumulativeSum = 0;
    const dailyChartData = [];
    const cumulativeChartData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const daySpent = Math.round(dailyMap[d] * 100) / 100;
      cumulativeSum += daySpent;

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dailyChartData.push({
        day: d,
        date: dateStr,
        amount: daySpent,
        isOverSafeLimit: metrics.safeDailyBudget > 0 && daySpent > metrics.safeDailyBudget,
      });

      cumulativeChartData.push({
        day: d,
        date: dateStr,
        cumulativeAmount: Math.round(cumulativeSum * 100) / 100,
      });
    }

    // 6. Category Breakdown
    const categoryTotals = {};
    const categoryCounts = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Load category colors/icons
    const categoriesMeta = await Category.find({
      $or: [{ userId: user._id }, { userId: null }],
    });
    const categoryMetaMap = {};
    categoriesMeta.forEach((c) => {
      categoryMetaMap[c.name] = { color: c.color, icon: c.icon };
    });

    // Distinct palette fallback if category not matched
    const fallbackColors = [
      '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6',
      '#EF4444', '#8B5CF6', '#14B8A6', '#F97316', '#64748B'
    ];

    const budgetMap = {};
    if (budgetDoc && Array.isArray(budgetDoc.categoryBudgets)) {
      budgetDoc.categoryBudgets.forEach((cb) => {
        if (cb && cb.category) budgetMap[cb.category] = Number(cb.amount) || 0;
      });
    }

    const allCatNames = new Set([...Object.keys(categoryTotals), ...Object.keys(budgetMap)]);

    const categoryBreakdown = Array.from(allCatNames)
      .map((catName, idx) => {
        const catSpent = Math.round((categoryTotals[catName] || 0) * 100) / 100;
        const catBudget = Math.round((budgetMap[catName] || 0) * 100) / 100;
        const percentage = catBudget > 0
          ? Math.min(100, Math.round((catSpent / catBudget) * 100))
          : (totalSpent > 0 ? Math.round((catSpent / totalSpent) * 1000) / 10 : 0);
        const meta = categoryMetaMap[catName] || {};
        return {
          category: catName,
          total: catSpent,
          budget: catBudget,
          remaining: catBudget > 0 ? Math.round((catBudget - catSpent) * 100) / 100 : null,
          percentage,
          count: categoryCounts[catName] || 0,
          color: meta.color || fallbackColors[idx % fallbackColors.length],
          icon: meta.icon || 'Utensils',
        };
      })
      .sort((a, b) => (b.budget || b.total) - (a.budget || a.total));

    // 7. Peak day
    let peakDay = null;
    if (expenses.length > 0) {
      const sortedDaily = [...dailyChartData].sort((a, b) => b.amount - a.amount);
      if (sortedDaily[0] && sortedDaily[0].amount > 0) {
        peakDay = sortedDaily[0];
      }
    }

    res.json({
      success: true,
      data: {
        hasBudget: !!budgetDoc,
        month,
        year,
        ...metrics,
        peakDay,
        dailyChartData,
        cumulativeChartData,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
