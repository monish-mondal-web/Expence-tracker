const Expense = require('../models/Expense');
const { getOrCreateDefaultUser } = require('../services/userService');
const { getMonthYearRange } = require('../services/budgetService');

// GET /api/calendar
exports.getCalendarData = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { month: qMonth, year: qYear } = req.query;

    const { month, year, startOfMonth, endOfMonth } = getMonthYearRange(qMonth, qYear);

    const expenses = await Expense.find({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1, createdAt: -1 });

    const daysMap = {};

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          date: dateKey,
          day: d.getUTCDate(),
          totalSpent: 0,
          expenses: [],
        };
      }

      daysMap[dateKey].totalSpent += e.amount;
      daysMap[dateKey].expenses.push({
        _id: e._id,
        amount: e.amount,
        category: e.category,
        note: e.note,
        date: e.date,
      });
    });

    // Round amounts
    Object.values(daysMap).forEach((item) => {
      item.totalSpent = Math.round(item.totalSpent * 100) / 100;
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      month,
      year,
      totalSpent: Math.round(totalSpent * 100) / 100,
      daysWithExpenses: Object.keys(daysMap).length,
      calendarDays: daysMap,
    });
  } catch (error) {
    next(error);
  }
};
