import { z } from 'zod';
import Post from '../models/Post.js';
import Restaurant from '../models/Restaurant.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import SavedItem from '../models/SavedItem.js';
import Report from '../models/Report.js';

const createPostSchema = z.object({
  caption: z.string().trim().min(1, 'Caption is required').max(2000),
  restaurantTag: z.string().optional().nullable(),
  menuItemTag: z.string().optional().nullable(),
  media: z
    .array(
      z.object({
        url: z.string().min(1),
        type: z.enum(['image', 'video']).optional().default('image'),
      })
    )
    .optional()
    .default([]),
  hashtags: z.array(z.string().trim()).optional().default([]),
  isOfficial: z.boolean().optional().default(false),
});

const reportSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a reason').max(500),
});

const extractHashtags = (text, existing = []) => {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  const cleaned = matches.map((m) => m.slice(1).toLowerCase());
  return Array.from(new Set([...existing.map((h) => h.replace(/^#/, '').toLowerCase()), ...cleaned]));
};

const attachUserFlags = async (posts, userId) => {
  if (!userId || !posts.length) {
    return posts.map((p) => ({ ...p, isLiked: false, isSaved: false }));
  }
  const postIds = posts.map((p) => p._id);
  const [likes, saves] = await Promise.all([
    Like.find({ user: userId, targetType: 'post', targetId: { $in: postIds } }).lean(),
    SavedItem.find({ user: userId, itemType: 'post', itemId: { $in: postIds } }).lean(),
  ]);
  const likedSet = new Set(likes.map((l) => String(l.targetId)));
  const savedSet = new Set(saves.map((s) => String(s.itemId)));
  return posts.map((p) => ({
    ...p,
    isLiked: likedSet.has(String(p._id)),
    isSaved: savedSet.has(String(p._id)),
  }));
};

export const feed = async (req, res, next) => {
  try {
    const { tab = 'trending', lat, lng, page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(30, Math.max(1, Number(limit) || 12));

    let filter = { isHidden: false };
    let sort = { createdAt: -1 };

    if (tab === 'following') {
      if (!req.user) {
        return res.json({ posts: [], total: 0, page: pageNum, totalPages: 1 });
      }
      const followingIds = [...(req.user.following || []), req.user._id];
      filter.author = { $in: followingIds };
    } else if (tab === 'nearby' && lat && lng) {
      const nearbyRestaurants = await Restaurant.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'distanceMeters',
            maxDistance: 20000,
            spherical: true,
          },
        },
        { $project: { _id: 1 } },
      ]);
      const restIds = nearbyRestaurants.map((r) => r._id);
      if (restIds.length > 0) {
        filter.restaurantTag = { $in: restIds };
      }
    } else if (tab === 'trending') {
      sort = { likeCount: -1, commentCount: -1, createdAt: -1 };
    }

    const [docs, total] = await Promise.all([
      Post.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('author', 'name username profilePhoto role')
        .populate('restaurantTag', 'name city ratingAvg')
        .populate('menuItemTag', 'name price foodType')
        .lean(),
      Post.countDocuments(filter),
    ]);

    const posts = await attachUserFlags(docs, req.user?._id);
    res.json({
      posts,
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
    const data = createPostSchema.parse(req.body);
    let isOfficial = false;

    if (data.isOfficial && data.restaurantTag) {
      const restaurant = await Restaurant.findById(data.restaurantTag);
      if (restaurant && String(restaurant.owner) === String(req.user._id)) {
        isOfficial = true;
      }
    }

    const hashtags = extractHashtags(data.caption, data.hashtags);

    const post = await Post.create({
      author: req.user._id,
      restaurantTag: data.restaurantTag || null,
      menuItemTag: data.menuItemTag || null,
      caption: data.caption,
      media: data.media,
      hashtags,
      isOfficial,
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name username profilePhoto role')
      .populate('restaurantTag', 'name city ratingAvg')
      .populate('menuItemTag', 'name price foodType')
      .lean();

    res.status(201).json({ post: { ...populated, isLiked: false, isSaved: false } });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const doc = await Post.findOne({ _id: req.params.id, isHidden: false })
      .populate('author', 'name username profilePhoto role bio')
      .populate('restaurantTag', 'name city address ratingAvg')
      .populate('menuItemTag', 'name price foodType')
      .lean();

    if (!doc) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const [post] = await attachUserFlags([doc], req.user?._id);
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Promise.all([
      post.deleteOne(),
      Comment.deleteMany({ post: post._id }),
      Like.deleteMany({ targetType: 'post', targetId: post._id }),
      SavedItem.deleteMany({ itemType: 'post', itemId: post._id }),
    ]);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await Like.findOne({
      user: req.user._id,
      targetType: 'post',
      targetId: post._id,
    });

    if (existing) {
      await existing.deleteOne();
      const updated = await Post.findByIdAndUpdate(
        post._id,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      if (updated.likeCount < 0) {
        updated.likeCount = 0;
        await updated.save();
      }
      return res.json({ liked: false, likeCount: updated.likeCount });
    }

    await Like.create({ user: req.user._id, targetType: 'post', targetId: post._id });
    const updated = await Post.findByIdAndUpdate(
      post._id,
      { $inc: { likeCount: 1 } },
      { new: true }
    );
    res.json({ liked: true, likeCount: updated.likeCount });
  } catch (err) {
    next(err);
  }
};

export const toggleSave = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await SavedItem.findOne({
      user: req.user._id,
      itemType: 'post',
      itemId: post._id,
    });

    if (existing) {
      await existing.deleteOne();
      const updated = await Post.findByIdAndUpdate(
        post._id,
        { $inc: { saveCount: -1 } },
        { new: true }
      );
      if (updated.saveCount < 0) {
        updated.saveCount = 0;
        await updated.save();
      }
      return res.json({ saved: false, saveCount: updated.saveCount });
    }

    await SavedItem.create({
      user: req.user._id,
      itemType: 'post',
      itemId: post._id,
      collectionId: req.body?.collectionId || null,
    });
    const updated = await Post.findByIdAndUpdate(
      post._id,
      { $inc: { saveCount: 1 } },
      { new: true }
    );
    res.json({ saved: true, saveCount: updated.saveCount });
  } catch (err) {
    next(err);
  }
};

export const report = async (req, res, next) => {
  try {
    const { reason } = reportSchema.parse(req.body);
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const created = await Report.create({
      reporter: req.user._id,
      targetType: 'post',
      targetId: post._id,
      reason,
    });
    res.status(201).json({ report: created, message: 'Report submitted for moderation review' });
  } catch (err) {
    next(err);
  }
};
