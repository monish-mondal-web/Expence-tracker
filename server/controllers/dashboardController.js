const MonthlyBudget = require('../models/MonthlyBudget');
const Expense = require('../models/Expense');
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

    // 6. Recent expenses for quick dashboard list (latest 8)
    const recentExpenses = expenses.slice(0, 8);

    res.json({
      success: true,
      data: {
        hasBudget: !!budgetDoc,
        budgetId: budgetDoc ? budgetDoc._id : null,
        month,
        year,
        ...metrics,
        recentExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
};
