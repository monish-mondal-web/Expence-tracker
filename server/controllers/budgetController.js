const MonthlyBudget = require('../models/MonthlyBudget');
const { getOrCreateDefaultUser } = require('../services/userService');

// GET /api/monthly-budget
exports.getMonthlyBudget = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { month, year } = req.query;

    if (month && year) {
      const budget = await MonthlyBudget.findOne({
        userId: user._id,
        month: Number(month),
        year: Number(year),
      });
      return res.json({ success: true, data: budget });
    }

    // Return list of all budgets for year or all
    const filter = { userId: user._id };
    if (year) filter.year = Number(year);

    const budgets = await MonthlyBudget.find(filter).sort({ year: -1, month: -1 });
    res.json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
};

// POST /api/monthly-budget (Create or update)
exports.setMonthlyBudget = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { budgetAmount, month, year } = req.body;

    const now = new Date();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    const targetYear = year ? Number(year) : now.getFullYear();

    const budget = await MonthlyBudget.findOneAndUpdate(
      {
        userId: user._id,
        month: targetMonth,
        year: targetYear,
      },
      {
        budgetAmount: Number(budgetAmount),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Monthly food budget saved successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/monthly-budget/:id
exports.updateMonthlyBudget = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { id } = req.params;
    const { budgetAmount } = req.body;

    const budget = await MonthlyBudget.findOneAndUpdate(
      { _id: id, userId: user._id },
      { budgetAmount: Number(budgetAmount) },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget record not found' });
    }

    res.json({
      success: true,
      message: 'Monthly food budget updated successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};
