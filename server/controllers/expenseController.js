const Expense = require('../models/Expense');
const { getOrCreateDefaultUser } = require('../services/userService');
const { getMonthYearRange } = require('../services/budgetService');

// GET /api/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { month, year, category, search, startDate, endDate, sort = 'newest' } = req.query;

    const query = { userId: user._id };

    // Date filtering: either explicit start/end or by month/year
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (month && year) {
      const { startOfMonth, endOfMonth } = getMonthYearRange(month, year);
      query.date = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    // Category filter
    if (category && category !== 'All') {
      const catLower = category.toLowerCase().trim();
      if (catLower === 'food & dining' || catLower === 'food') {
        const foodSubRegexes = [
          'food', 'dining', 'breakfast', 'lunch', 'dinner', 'snacks',
          'groceries', 'fruits', 'vegetables', 'meat', 'fish', 'drinks', 'coffee', 'tea'
        ].join('|');
        query.category = { $regex: new RegExp(foodSubRegexes, 'i') };
      } else {
        query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
      }
    }

    // Search query in note or category
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ note: regex }, { category: regex }];
    }

    // Sorting
    let sortOptions = { date: -1, createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { date: 1, createdAt: 1 };
    } else if (sort === 'amount_desc') {
      sortOptions = { amount: -1 };
    } else if (sort === 'amount_asc') {
      sortOptions = { amount: 1 };
    }

    const expenses = await Expense.find(query).sort(sortOptions);

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      count: expenses.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses
exports.createExpense = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { amount, date, category, note, space } = req.body;

    const expense = await Expense.create({
      userId: user._id,
      amount: Number(amount),
      date: new Date(date),
      category: category.trim(),
      space: (space || '').trim() || null,
      note: (note || '').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { id } = req.params;
    const { amount, date, category, note, space } = req.body;

    const updateFields = {};
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (date !== undefined) updateFields.date = new Date(date);
    if (category !== undefined) updateFields.category = category.trim();
    if (space !== undefined) updateFields.space = (space || '').trim() || null;
    if (note !== undefined) updateFields.note = note.trim();

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: user._id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { id } = req.params;

    const expense = await Expense.findOneAndDelete({ _id: id, userId: user._id });

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};
