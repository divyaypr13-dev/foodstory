import { z } from 'zod';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Review from '../models/Review.js';
import Post from '../models/Post.js';
import SavedItem from '../models/SavedItem.js';

const restaurantSchema = z.object({
  name: z.string().trim().min(2, 'Restaurant name is required').max(120),
  description: z.string().trim().max(1500).optional().default(''),
  cuisineTags: z.array(z.string().trim()).optional().default([]),
  address: z.string().trim().min(3, 'Address is required'),
  city: z.string().trim().min(2, 'City is required'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  photos: z.array(z.string().trim()).optional().default([]),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').optional().default('09:00'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').optional().default('22:30'),
  contactNumber: z.string().trim().optional().default(''),
  email: z.string().trim().email().or(z.literal('')).optional().default(''),
  costLevel: z.coerce.number().int().min(1).max(4).optional().default(2),
  facilities: z
    .object({
      parking: z.boolean().optional(),
      wifi: z.boolean().optional(),
      outdoorSeating: z.boolean().optional(),
      wheelchairAccessible: z.boolean().optional(),
      petFriendly: z.boolean().optional(),
    })
    .optional(),
  foodTypes: z.array(z.enum(['veg', 'non-veg', 'vegan', 'jain'])).optional().default(['veg', 'non-veg']),
  gstRate: z.coerce.number().min(0).max(28).optional().default(5),
  serviceChargeRate: z.coerce.number().min(0).max(25).optional().default(0),
});

export const isRestaurantOpenNow = (openTime = '09:00', closeTime = '22:30') => {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;

  if (closeMins >= openMins) {
    return currentMins >= openMins && currentMins <= closeMins;
  }
  return currentMins >= openMins || currentMins <= closeMins;
};

export const list = async (req, res, next) => {
  try {
    const {
      q,
      cuisine,
      city,
      costLevel,
      minRating,
      foodType,
      facilities,
      openNow,
      sort = 'rating',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { cuisineTags: regex },
        { city: regex },
        { address: regex },
      ];
    }
    if (cuisine && cuisine.trim()) {
      filter.cuisineTags = { $in: cuisine.split(',').map((c) => new RegExp(c.trim(), 'i')) };
    }
    if (city && city.trim()) {
      filter.city = new RegExp(city.trim(), 'i');
    }
    if (costLevel) {
      const levels = String(costLevel)
        .split(',')
        .map(Number)
        .filter((n) => n >= 1 && n <= 4);
      if (levels.length) filter.costLevel = { $in: levels };
    }
    if (minRating) {
      filter.ratingAvg = { $gte: Number(minRating) };
    }
    if (foodType && foodType.trim()) {
      filter.foodTypes = { $in: foodType.split(',').map((f) => f.trim()) };
    }
    if (facilities && facilities.trim()) {
      facilities.split(',').forEach((fac) => {
        const key = fac.trim();
        if (
          ['parking', 'wifi', 'outdoorSeating', 'wheelchairAccessible', 'petFriendly'].includes(key)
        ) {
          filter[`facilities.${key}`] = true;
        }
      });
    }

    let sortObj = { ratingAvg: -1, ratingCount: -1, createdAt: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { profileViews: -1, ratingCount: -1 };
    if (sort === 'costAsc') sortObj = { costLevel: 1, ratingAvg: -1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));

    let docs = await Restaurant.find(filter)
      .sort(sortObj)
      .populate('owner', 'name username profilePhoto')
      .lean();

    docs = docs.map((r) => ({
      ...r,
      isOpenNow: isRestaurantOpenNow(r.openTime, r.closeTime),
    }));

    if (openNow === 'true') {
      docs = docs.filter((r) => r.isOpenNow);
    }

    const total = docs.length;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const paginated = docs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      restaurants: paginated,
      total,
      page: pageNum,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

export const nearby = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const maxDistance = Math.min(50000, Number(req.query.maxDistance) || 15000);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng query parameters are required' });
    }

    const docs = await Restaurant.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance,
          spherical: true,
        },
      },
      { $limit: 30 },
    ]);

    const restaurants = docs.map((r) => ({
      ...r,
      isOpenNow: isRestaurantOpenNow(r.openTime, r.closeTime),
    }));

    res.json({ restaurants });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $inc: { profileViews: 1 } },
      { new: true }
    )
      .populate('owner', 'name username profilePhoto')
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const [menuItems, reviews, posts] = await Promise.all([
      MenuItem.find({ restaurant: restaurant._id }).sort({ category: 1, name: 1 }).lean(),
      Review.find({ restaurant: restaurant._id, isHidden: false })
        .sort({ createdAt: -1 })
        .populate('user', 'name username profilePhoto')
        .lean(),
      Post.find({ restaurantTag: restaurant._id, isHidden: false })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate('author', 'name username profilePhoto')
        .lean(),
    ]);

    let isSaved = false;
    if (req.user) {
      const saved = await SavedItem.findOne({
        user: req.user._id,
        itemType: 'restaurant',
        itemId: restaurant._id,
      });
      isSaved = Boolean(saved);
    }

    res.json({
      restaurant: {
        ...restaurant,
        isOpenNow: isRestaurantOpenNow(restaurant.openTime, restaurant.closeTime),
      },
      menuItems,
      reviews,
      posts,
      isSaved,
    });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = restaurantSchema.parse(req.body);
    const coordinates =
      data.lng !== undefined && data.lat !== undefined
        ? [data.lng, data.lat]
        : [77.5946, 12.9716];

    const restaurant = await Restaurant.create({
      owner: req.user._id,
      name: data.name,
      description: data.description,
      cuisineTags: data.cuisineTags,
      address: data.address,
      city: data.city,
      location: { type: 'Point', coordinates },
      photos: data.photos,
      openTime: data.openTime,
      closeTime: data.closeTime,
      contactNumber: data.contactNumber,
      email: data.email,
      costLevel: data.costLevel,
      facilities: data.facilities || {},
      foodTypes: data.foodTypes,
      gstRate: data.gstRate,
      serviceChargeRate: data.serviceChargeRate,
    });

    res.status(201).json({ restaurant });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const existing = await Restaurant.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (String(existing.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const data = restaurantSchema.partial().parse(req.body);
    const updatePayload = { ...data };
    if (data.lng !== undefined && data.lat !== undefined) {
      updatePayload.location = { type: 'Point', coordinates: [data.lng, data.lat] };
    }
    delete updatePayload.lng;
    delete updatePayload.lat;

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.json({ restaurant });
  } catch (err) {
    next(err);
  }
};

export const myRestaurant = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ restaurants, restaurant: restaurants[0] || null });
  } catch (err) {
    next(err);
  }
};

export const requestVerification = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (String(restaurant.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    restaurant.verificationStatus = 'pending';
    await restaurant.save();
    res.json({ restaurant, message: 'Verification request submitted for admin review' });
  } catch (err) {
    next(err);
  }
};
