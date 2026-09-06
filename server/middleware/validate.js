const mongoose = require('mongoose');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid resource identifier: ${id}`,
      });
    }
    next();
  };
};

const validateExpensePayload = (req, res, next) => {
  const { amount, date, category } = req.body;

  if (amount === undefined || amount === null || amount === '') {
    return res.status(400).json({ success: false, error: 'Amount is required' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be a positive number greater than 0' });
  }

  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ success: false, error: 'Invalid date format' });
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ success: false, error: 'Category is required' });
  }

  next();
};

const validateBudgetPayload = (req, res, next) => {
  const { budgetAmount, month, year } = req.body;

  if (budgetAmount === undefined || budgetAmount === null || budgetAmount === '') {
    return res.status(400).json({ success: false, error: 'Budget amount is required' });
  }

  const numBudget = Number(budgetAmount);
  if (isNaN(numBudget) || numBudget < 0) {
    return res.status(400).json({ success: false, error: 'Budget must be a non-negative number' });
  }

  if (month !== undefined) {
    const m = Number(month);
    if (isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ success: false, error: 'Month must be between 1 and 12' });
    }
  }

  if (year !== undefined) {
    const y = Number(year);
    if (isNaN(y) || y < 2000 || y > 2100) {
      return res.status(400).json({ success: false, error: 'Year must be a valid year' });
    }
  }

  next();
};

module.exports = {
  validateObjectId,
  validateExpensePayload,
  validateBudgetPayload,
};
