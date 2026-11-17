import { z } from 'zod';
import SavedItem from '../models/SavedItem.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Post from '../models/Post.js';
import Review from '../models/Review.js';

const toggleSchema = z.object({
  itemType: z.enum(['restaurant', 'dish', 'post', 'review']),
  itemId: z.string().min(1),
  collectionId: z.string().optional().nullable(),
});

export const list = async (req, res, next) => {
  try {
    const { itemType, collectionId } = req.query;
    const filter = { user: req.user._id };
    if (itemType) filter.itemType = itemType;
    if (collectionId) filter.collectionId = collectionId;

    const savedDocs = await SavedItem.find(filter).sort({ createdAt: -1 }).lean();

    const restaurantIds = savedDocs.filter((s) => s.itemType === 'restaurant').map((s) => s.itemId);
    const dishIds = savedDocs.filter((s) => s.itemType === 'dish').map((s) => s.itemId);
    const postIds = savedDocs.filter((s) => s.itemType === 'post').map((s) => s.itemId);
    const reviewIds = savedDocs.filter((s) => s.itemType === 'review').map((s) => s.itemId);

    const [restaurants, dishes, posts, reviews] = await Promise.all([
      restaurantIds.length ? Restaurant.find({ _id: { $in: restaurantIds } }).lean() : [],
      dishIds.length
        ? MenuItem.find({ _id: { $in: dishIds } }).populate('restaurant', 'name city').lean()
        : [],
      postIds.length
        ? Post.find({ _id: { $in: postIds } })
            .populate('author', 'name username profilePhoto')
            .populate('restaurantTag', 'name city')
            .lean()
        : [],
      reviewIds.length
        ? Review.find({ _id: { $in: reviewIds } })
            .populate('user', 'name username profilePhoto')
            .populate('restaurant', 'name')
            .lean()
        : [],
    ]);

    const maps = {
      restaurant: new Map(restaurants.map((d) => [String(d._id), d])),
      dish: new Map(dishes.map((d) => [String(d._id), d])),
      post: new Map(posts.map((d) => [String(d._id), d])),
      review: new Map(reviews.map((d) => [String(d._id), d])),
    };

    const items = savedDocs
      .map((s) => ({
        ...s,
        item: maps[s.itemType]?.get(String(s.itemId)) || null,
      }))
      .filter((s) => s.item !== null);

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const toggle = async (req, res, next) => {
  try {
    const { itemType, itemId, collectionId } = toggleSchema.parse(req.body);
    const existing = await SavedItem.findOne({
      user: req.user._id,
      itemType,
      itemId,
    });

    if (existing) {
      await existing.deleteOne();
      if (itemType === 'post') {
        await Post.findByIdAndUpdate(itemId, { $inc: { saveCount: -1 } });
      }
      return res.json({ saved: false });
    }

    const created = await SavedItem.create({
      user: req.user._id,
      itemType,
      itemId,
      collectionId: collectionId || null,
    });
    if (itemType === 'post') {
      await Post.findByIdAndUpdate(itemId, { $inc: { saveCount: 1 } });
    }
    res.status(201).json({ saved: true, savedItem: created });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const existing = await SavedItem.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!existing) {
      return res.status(404).json({ message: 'Saved item not found' });
    }
    await existing.deleteOne();
    res.json({ message: 'Removed from saved items' });
  } catch (err) {
    next(err);
  }
};
