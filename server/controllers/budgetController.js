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
    const { budgetAmount, categoryBudgets, month, year } = req.body;

    const now = new Date();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    const targetYear = year ? Number(year) : now.getFullYear();

    let parsedCategoryBudgets = [];
    if (Array.isArray(categoryBudgets)) {
      parsedCategoryBudgets = categoryBudgets
        .filter((c) => c && c.category && typeof c.category === 'string')
        .map((c) => ({
          category: c.category.trim(),
          amount: Math.max(0, Number(c.amount) || 0),
        }));
    }

    // If budgetAmount was not passed or 0, but category splits were passed, sum them up
    let finalBudgetAmount = Number(budgetAmount) || 0;
    if (finalBudgetAmount <= 0 && parsedCategoryBudgets.length > 0) {
      finalBudgetAmount = parsedCategoryBudgets.reduce((sum, c) => sum + c.amount, 0);
    }

    const budget = await MonthlyBudget.findOneAndUpdate(
      {
        userId: user._id,
        month: targetMonth,
        year: targetYear,
      },
      {
        budgetAmount: finalBudgetAmount,
        categoryBudgets: parsedCategoryBudgets,
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
      message: 'Monthly budget saved successfully',
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
    const { budgetAmount, categoryBudgets } = req.body;

    const updateData = {};
    if (budgetAmount !== undefined) {
      updateData.budgetAmount = Math.max(0, Number(budgetAmount) || 0);
    }
    if (Array.isArray(categoryBudgets)) {
      updateData.categoryBudgets = categoryBudgets
        .filter((c) => c && c.category)
        .map((c) => ({
          category: c.category.trim(),
          amount: Math.max(0, Number(c.amount) || 0),
        }));
    }

    const budget = await MonthlyBudget.findOneAndUpdate(
      { _id: id, userId: user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget record not found' });
    }

    res.json({
      success: true,
      message: 'Monthly budget updated successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/monthly-budget/:id (Reset budget)
exports.resetMonthlyBudget = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { id } = req.params;

    const budget = await MonthlyBudget.findOneAndDelete({ _id: id, userId: user._id });
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget record not found' });
    }

    res.json({
      success: true,
      message: 'Monthly budget reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
