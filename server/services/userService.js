const User = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Breakfast', icon: 'Coffee', color: '#F59E0B' },
  { name: 'Lunch', icon: 'UtensilsCrossed', color: '#10B981' },
  { name: 'Dinner', icon: 'Utensils', color: '#6366F1' },
  { name: 'Snacks', icon: 'Cookie', color: '#EC4899' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#3B82F6' },
  { name: 'Fruits', icon: 'Apple', color: '#EF4444' },
  { name: 'Vegetables', icon: 'Salad', color: '#22C55E' },
  { name: 'Meat / Fish', icon: 'Fish', color: '#F97316' },
  { name: 'Drinks', icon: 'CupSoda', color: '#8B5CF6' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#64748B' },
];

const getOrCreateDefaultUser = async () => {
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      name: 'Gourmet Tracker',
      email: 'foodie@tracker.local',
      currency: 'INR',
    });
  }

  // Ensure default categories exist
  const existingCategories = await Category.countDocuments();
  if (existingCategories === 0) {
    const categoryDocs = DEFAULT_CATEGORIES.map((c) => ({
      userId: null,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    }));
    await Category.insertMany(categoryDocs);
  }

  return user;
};

module.exports = {
  getOrCreateDefaultUser,
  DEFAULT_CATEGORIES,
};
