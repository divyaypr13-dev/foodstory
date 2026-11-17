import { z } from 'zod';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

const menuItemSchema = z.object({
  restaurant: z.string().min(1, 'Restaurant ID is required'),
  name: z.string().trim().min(2, 'Dish name is required').max(120),
  description: z.string().trim().max(500).optional().default(''),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  category: z.enum(['starter', 'main', 'dessert', 'beverage']),
  foodType: z.enum(['veg', 'non-veg', 'vegan', 'jain']).optional().default('veg'),
  image: z.string().trim().optional().default(''),
  isAvailable: z.boolean().optional().default(true),
  gstRate: z.coerce.number().min(0).max(28).nullable().optional().default(null),
  tags: z.array(z.string().trim()).optional().default([]),
});

export const listByRestaurant = async (req, res, next) => {
  try {
    const { category, foodType } = req.query;
    const filter = { restaurant: req.params.restaurantId };
    if (category) filter.category = category;
    if (foodType) filter.foodType = foodType;

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const searchDishes = async (req, res, next) => {
  try {
    const { q, category, foodType, minPrice, maxPrice, page = 1, limit = 16 } = req.query;
    const filter = { isAvailable: true };

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }
    if (category) filter.category = category;
    if (foodType) filter.foodType = foodType;
    if (minPrice !== undefined && minPrice !== '') {
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 16));

    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .populate('restaurant', 'name city address ratingAvg costLevel gstRate serviceChargeRate')
        .sort({ ratingAvg: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      MenuItem.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = menuItemSchema.parse(req.body);
    const restaurant = await Restaurant.findById(data.restaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to manage this menu' });
    }

    const item = await MenuItem.create(data);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const existing = await MenuItem.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const restaurant = await Restaurant.findById(existing.restaurant);
    if (!restaurant || (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to update this menu item' });
    }

    const data = menuItemSchema.omit({ restaurant: true }).partial().parse(req.body);
    const item = await MenuItem.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const existing = await MenuItem.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const restaurant = await Restaurant.findById(existing.restaurant);
    if (!restaurant || (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to delete this menu item' });
    }

    await existing.deleteOne();
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    next(err);
  }
};
