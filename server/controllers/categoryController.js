const Category = require('../models/Category');
const { getOrCreateDefaultUser } = require('../services/userService');

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());

    const categories = await Category.find({
      $or: [{ userId: user._id }, { userId: null }],
    }).sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category name already exists for this user or default
    const existing = await Category.findOne({
      $or: [{ userId: user._id }, { userId: null }],
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Category "${trimmedName}" already exists`,
      });
    }

    const category = await Category.create({
      userId: user._id,
      name: trimmedName,
      icon: icon || 'Utensils',
      color: color || '#3B82F6',
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const category = await Category.findOne({ _id: id, userId: user._id });
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Custom category not found or cannot modify default category',
      });
    }

    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateDefaultUser());
    const { id } = req.params;

    const category = await Category.findOneAndDelete({ _id: id, userId: user._id });
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Custom category not found or cannot delete default category',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};
