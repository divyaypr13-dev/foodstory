import mongoose from 'mongoose';
import { z } from 'zod';
import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';

const reviewCreateSchema = z.object({
  restaurant: z.string().min(1, 'Restaurant ID is required'),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, 'Review must be at least 5 characters').max(2000),
  photos: z.array(z.string().trim()).optional().default([]),
});

const reviewUpdateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(5).max(2000).optional(),
  photos: z.array(z.string().trim()).optional(),
});

const respondSchema = z.object({
  text: z.string().trim().min(2, 'Response text is required').max(1000),
});

export async function recalculateRestaurantRating(restaurantId) {
  const objectId = new mongoose.Types.ObjectId(restaurantId);
  const stats = await Review.aggregate([
    { $match: { restaurant: objectId, isHidden: false } },
    {
      $group: {
        _id: '$restaurant',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingAvg = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const ratingCount = stats.length ? stats[0].count : 0;

  await Restaurant.findByIdAndUpdate(restaurantId, { ratingAvg, ratingCount });
}

export const list = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      restaurant: req.params.restaurantId,
      isHidden: false,
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name username profilePhoto');
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = reviewCreateSchema.parse(req.body);
    const restaurant = await Restaurant.findById(data.restaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const existing = await Review.findOne({
      user: req.user._id,
      restaurant: data.restaurant,
    });
    if (existing) {
      return res.status(409).json({
        message: 'You have already reviewed this restaurant. Edit your existing review instead.',
      });
    }

    const review = await Review.create({
      user: req.user._id,
      restaurant: data.restaurant,
      rating: data.rating,
      comment: data.comment,
      photos: data.photos,
    });

    await recalculateRestaurantRating(data.restaurant);
    const populated = await review.populate('user', 'name username profilePhoto');
    res.status(201).json({ review: populated });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const existing = await Review.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (String(existing.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }

    const data = reviewUpdateSchema.parse(req.body);
    Object.assign(existing, data);
    await existing.save();

    await recalculateRestaurantRating(existing.restaurant);
    const populated = await existing.populate('user', 'name username profilePhoto');
    res.json({ review: populated });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const existing = await Review.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (String(existing.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const restaurantId = existing.restaurant;
    await existing.deleteOne();
    await recalculateRestaurantRating(restaurantId);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

export const toggleHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = String(req.user._id);
    const already = review.helpfulBy.some((id) => String(id) === userId);
    if (already) {
      review.helpfulBy = review.helpfulBy.filter((id) => String(id) !== userId);
    } else {
      review.helpfulBy.push(req.user._id);
    }
    await review.save();
    res.json({ helpfulCount: review.helpfulBy.length, isHelpful: !already });
  } catch (err) {
    next(err);
  }
};

export const respond = async (req, res, next) => {
  try {
    const { text } = respondSchema.parse(req.body);
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const restaurant = await Restaurant.findById(review.restaurant);
    if (!restaurant || (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Only the restaurant owner can respond to reviews' });
    }

    review.ownerResponse = {
      text,
      respondedAt: new Date(),
    };
    await review.save();
    const populated = await review.populate('user', 'name username profilePhoto');
    res.json({ review: populated });
  } catch (err) {
    next(err);
  }
};
