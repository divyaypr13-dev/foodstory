import { z } from 'zod';
import Collection from '../models/Collection.js';
import SavedItem from '../models/SavedItem.js';

const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Collection name is required').max(80),
  description: z.string().trim().max(300).optional().default(''),
  isPublic: z.boolean().optional().default(false),
});

export const list = async (req, res, next) => {
  try {
    const collections = await Collection.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const counts = await SavedItem.aggregate([
      { $match: { user: req.user._id, collectionId: { $ne: null } } },
      { $group: { _id: '$collectionId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const enriched = collections.map((c) => ({
      ...c,
      itemCount: countMap.get(String(c._id)) || 0,
    }));

    res.json({ collections: enriched });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = collectionSchema.parse(req.body);
    const collection = await Collection.create({
      user: req.user._id,
      ...data,
    });
    res.status(201).json({ collection: { ...collection.toObject(), itemCount: 0 } });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    await SavedItem.updateMany({ collectionId: collection._id }, { $set: { collectionId: null } });
    await collection.deleteOne();
    res.json({ message: 'Collection deleted' });
  } catch (err) {
    next(err);
  }
};
