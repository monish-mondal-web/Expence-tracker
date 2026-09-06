const MonthlyBudget = require('../models/MonthlyBudget');
const Expense = require('../models/Expense');

/**
 * Calculates budget, safe limits, dynamic recommendation, and status metrics.
 */
function calculateMetrics({
  monthlyBudgetAmount = 0,
  totalSpent = 0,
  todaySpent = 0,
  elapsedDays = 1,
  daysTracked = 0,
}) {
  const budget = Number(monthlyBudgetAmount) || 0;
  const spent = Number(totalSpent) || 0;
  const today = Number(todaySpent) || 0;

  // 1. Base Daily Budget: monthlyBudget / 30
  const baseDailyBudget = budget > 0 ? Math.round((budget / 30) * 100) / 100 : 0;

  // 2. Safe Daily Budget: (monthlyBudget / 30) * 0.70
  const safeDailyBudget = budget > 0 ? Math.round((baseDailyBudget * 0.70) * 100) / 100 : 0;

  // 3. Remaining Budget: monthlyBudget - totalSpent
  const remainingBudget = Math.round((budget - spent) * 100) / 100;

  // 4. Budget used percentage
  const budgetUsedPercentage = budget > 0 ? Math.min(100, Math.round((spent / budget) * 1000) / 10) : 0;

  // 5. Remaining Days: 30 - elapsed days (boundary protected)
  const remainingDays = Math.max(0, 30 - Math.min(30, elapsedDays));

  // 6. Dynamic Daily Budget: remainingBudget / remainingDays (prevent divide by 0)
  let dynamicDailyBudget = 0;
  if (remainingBudget > 0) {
    if (remainingDays > 0) {
      dynamicDailyBudget = Math.round((remainingBudget / remainingDays) * 100) / 100;
    } else {
      dynamicDailyBudget = remainingBudget;
    }
  }

  // 7. Dynamic Safe Daily Budget: dynamicDailyBudget * 0.70
  const dynamicSafeDailyBudget = Math.round((dynamicDailyBudget * 0.70) * 100) / 100;

  // 8. Safe remaining for today
  const safeRemainingToday = Math.round((safeDailyBudget - today) * 100) / 100;

  // 9. Average daily spend so far
  const averageDailySpend = elapsedDays > 0 ? Math.round((spent / elapsedDays) * 100) / 100 : 0;

  // 10. Safe Zone Status Evaluation
  let safeZoneStatus = 'SAFE ZONE';
  let safeZoneKey = 'safe'; // 'safe' | 'approaching' | 'exceeded'
  let safeZoneMessage = "You're within today's safe spending limit.";

  if (budget > 0) {
    if (today > safeDailyBudget) {
      safeZoneStatus = 'OVER SAFE LIMIT';
      safeZoneKey = 'exceeded';
      safeZoneMessage = "You've crossed today's safe limit. Consider spending less on upcoming days.";
    } else if (today >= safeDailyBudget * 0.80 && safeDailyBudget > 0) {
      safeZoneStatus = 'APPROACHING LIMIT';
      safeZoneKey = 'approaching';
      safeZoneMessage = "You're getting close to today's safe spending limit.";
    } else {
      safeZoneStatus = 'SAFE ZONE';
      safeZoneKey = 'safe';
      safeZoneMessage = "You're within today's safe spending limit.";
    }
  }

  // 11. Smart Daily Message
  let smartMessage = "Set your monthly food budget to start tracking your daily food expenses.";
  if (budget > 0) {
    if (remainingBudget <= 0) {
      smartMessage = "Monthly budget reached. Consider moderating expenses for the rest of the month.";
    } else if (today > safeDailyBudget) {
      smartMessage = "You've crossed today's safe limit. Try to spend less on upcoming days.";
    } else if (today >= safeDailyBudget * 0.80) {
      smartMessage = "You're close to today's safe limit. Watch out for any remaining food spend today.";
    } else if (today > 0 && dynamicSafeDailyBudget > 0 && today <= dynamicSafeDailyBudget) {
      smartMessage = "You stayed under today's recommendation. This gives you more flexibility for the remaining days.";
    } else if (today === 0) {
      smartMessage = "No food expenses logged yet today. You have a safe daily limit ready.";
    } else {
      smartMessage = "You're spending below your safe limit. Great job!";
    }
  }

  return {
    monthlyBudget: budget,
    totalSpent: spent,
    remainingBudget,
    budgetUsedPercentage,
    todaySpent: today,
    baseDailyBudget,
    safeDailyBudget,
    safeRemainingToday,
    dynamicDailyBudget,
    dynamicSafeDailyBudget,
    remainingDays,
    elapsedDays,
    daysTracked,
    averageDailySpend,
    safeZoneStatus,
    safeZoneKey,
    safeZoneMessage,
    smartMessage,
  };
}

/**
 * Parses month/year query parameters with fallback to current local month and year.
 */
function getMonthYearRange(monthParam, yearParam, clientToday) {
  const now = clientToday ? new Date(clientToday) : new Date();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

  // Start of month (inclusive)
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // End of month (inclusive)
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Determine elapsed days
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  let elapsedDays = 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month
    elapsedDays = 30;
  } else if (year === currentYear && month === currentMonth) {
    // Current month
    elapsedDays = Math.min(30, Math.max(1, now.getDate()));
  } else {
    // Future month
    elapsedDays = 1;
  }

  return {
    month,
    year,
    startOfMonth,
    endOfMonth,
    elapsedDays,
  };
}

module.exports = {
  calculateMetrics,
  getMonthYearRange,
};
