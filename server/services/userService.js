const User = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#10B981' },
  { name: 'Travel', icon: 'Car', color: '#3B82F6' },
  { name: 'Tour', icon: 'Plane', color: '#06B6D4' },
  { name: 'Room Rent', icon: 'Home', color: '#6366F1' },
  { name: 'Health', icon: 'HeartPulse', color: '#EF4444' },
  { name: 'Gym', icon: 'Dumbbell', color: '#F59E0B' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#EAB308' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#14B8A6' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#64748B' },
];

const getOrCreateDefaultUser = async () => {
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      name: 'Pocket Khorcha User',
      email: 'user@pocketkhorcha.local',
      currency: 'INR',
    });
  }

  // Ensure all default categories exist
  for (const c of DEFAULT_CATEGORIES) {
    const exists = await Category.findOne({
      $or: [{ userId: null }, { userId: user._id }],
      name: c.name,
    });
    if (!exists) {
      await Category.create({
        userId: null,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: true,
      });
    }
  }

  return user;
};

module.exports = {
  getOrCreateDefaultUser,
  DEFAULT_CATEGORIES,
};
