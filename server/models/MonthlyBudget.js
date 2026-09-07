const mongoose = require('mongoose');

const monthlyBudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    budgetAmount: {
      type: Number,
      required: true,
      min: [0, 'Budget must be a non-negative number'],
    },
    categoryBudgets: [
      {
        category: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: [0, 'Category budget must be non-negative'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

monthlyBudgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyBudget', monthlyBudgetSchema);
