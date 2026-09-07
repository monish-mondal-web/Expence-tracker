const User = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#10B981' },
  { name: 'Room Rent', icon: 'Home', color: '#6366F1' },
  { name: 'Gym', icon: 'Dumbbell', color: '#F59E0B' },
  { name: 'Travel', icon: 'Car', color: '#3B82F6' },
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

  // Remove old default Groceries if it was created as a top level space category
  await Category.deleteMany({
    name: { $in: ['Groceries', 'groceries'] },
    userId: null,
  });

  // Ensure core spaces exist
  for (const c of DEFAULT_CATEGORIES) {
    const exists = await Category.findOne({
      $or: [{ userId: null }, { userId: user._id }],
      name: { $regex: new RegExp(`^${c.name}$`, 'i') },
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
