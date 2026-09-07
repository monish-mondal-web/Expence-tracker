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

    const budgetMap = {};
    if (budgetDoc && Array.isArray(budgetDoc.categoryBudgets)) {
      budgetDoc.categoryBudgets.forEach((cb) => {
        if (cb && cb.category) budgetMap[cb.category] = Number(cb.amount) || 0;
      });
    }

    let foodSubSum = 0;
    Object.entries(budgetMap).forEach(([k, v]) => {
      if (isFoodSubCategory(k)) foodSubSum += v;
    });
    const foodBudgetAmount = budgetMap['Food & Dining'] || budgetMap['Food'] || foodSubSum || (
      monthlyBudgetAmount > 0 && !budgetMap['Room Rent'] && !budgetMap['Gym'] ? monthlyBudgetAmount : 0
    );

    // Food Expenses aggregated
    const foodExpenses = expenses.filter((e) => {
      if (e.space && (e.space.toLowerCase() === 'food & dining' || e.space.toLowerCase() === 'food')) return true;
      return isFoodSubCategory(e.category || 'Other');
    });

    const defaultTopSpaces = [
      {
        name: 'Food & Dining',
        icon: 'Utensils',
        color: '#10B981',
        budget: foodBudgetAmount,
      },
      {
        name: 'Room Rent',
        icon: 'Home',
        color: '#6366F1',
        budget: budgetMap['Room Rent'] || 0,
      },
      {
        name: 'Gym',
        icon: 'Dumbbell',
        color: '#F59E0B',
        budget: budgetMap['Gym'] || 0,
      },
      {
        name: 'Travel',
        icon: 'Car',
        color: '#3B82F6',
        budget: budgetMap['Travel'] || 0,
      },
    ];

    const categoriesMeta = await Category.find({
      $or: [{ userId: user._id }, { userId: null }],
    });
    const categoryMetaMap = {};
    categoriesMeta.forEach((c) => {
      categoryMetaMap[c.name] = { color: c.color, icon: c.icon };
    });

    const knownTopNames = new Set(defaultTopSpaces.map((s) => s.name.toLowerCase()));
    const customSpaces = [];
    categoriesMeta.forEach((c) => {
      const lower = c.name.toLowerCase().trim();
      if (!isFoodSubCategory(lower) && !knownTopNames.has(lower)) {
        customSpaces.push({
          name: c.name,
          icon: c.icon || 'Sparkles',
          color: c.color || '#EC4899',
          budget: budgetMap[c.name] || 0,
        });
        knownTopNames.add(lower);
      }
    });

    Object.keys(budgetMap).forEach((bName) => {
      const lower = bName.toLowerCase().trim();
      if (!isFoodSubCategory(lower) && !knownTopNames.has(lower)) {
        customSpaces.push({
          name: bName,
          icon: 'Sparkles',
          color: '#8B5CF6',
          budget: budgetMap[bName] || 0,
        });
        knownTopNames.add(lower);
      }
    });

    const allSpaces = [...defaultTopSpaces, ...customSpaces];

    const categoryBreakdown = allSpaces.map((spaceItem) => {
      const sExpenses = spaceItem.name === 'Food & Dining'
        ? foodExpenses
        : expenses.filter((e) => {
            if (e.space && e.space.toLowerCase() === spaceItem.name.toLowerCase()) return true;
            return isCategoryInSpace(e.category || 'Other', spaceItem.name);
          });

      const sSpent = Math.round(sExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
      const sBudget = Math.round((spaceItem.budget || 0) * 100) / 100;

      // Group nested sub-categories
      const subTotals = {};
      const subCounts = {};
      sExpenses.forEach((e) => {
        const subCat = e.category || spaceItem.name;
        subTotals[subCat] = (subTotals[subCat] || 0) + e.amount;
        subCounts[subCat] = (subCounts[subCat] || 0) + 1;
      });

      const subCategories = Object.entries(subTotals).map(([subCatName, amt]) => {
        const subSpent = Math.round(amt * 100) / 100;
        const subMeta = categoryMetaMap[subCatName] || {};
        return {
          category: subCatName,
          total: subSpent,
          count: subCounts[subCatName] || 0,
          color: subMeta.color || spaceItem.color,
          icon: subMeta.icon || spaceItem.icon,
        };
      }).sort((a, b) => b.total - a.total);

      const percentage = totalSpent > 0 ? Math.round((sSpent / totalSpent) * 1000) / 10 : 0;
      const budgetPercentage = sBudget > 0 ? Math.min(100, Math.round((sSpent / sBudget) * 100)) : 0;

      return {
        category: spaceItem.name,
        total: sSpent,
        budget: sBudget,
        remaining: sBudget > 0 ? Math.round((sBudget - sSpent) * 100) / 100 : null,
        percentage,
        budgetPercentage,
        count: sExpenses.length,
        color: spaceItem.color,
        icon: spaceItem.icon,
        subCategories,
      };
    }).filter((item) => item.budget > 0 || item.total > 0)
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
