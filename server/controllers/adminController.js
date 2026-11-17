import { z } from 'zod';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Post from '../models/Post.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';

const verificationActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().trim().max(500).optional().default(''),
});

const reportActionSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});

export const stats = async (_req, res, next) => {
  try {
    const [users, restaurants, pendingVerifications, posts, pendingReports, reviews] =
      await Promise.all([
        User.countDocuments(),
        Restaurant.countDocuments(),
        Restaurant.countDocuments({ verificationStatus: 'pending' }),
        Post.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Review.countDocuments(),
      ]);

    res.json({
      stats: {
        users,
        restaurants,
        pendingVerifications,
        posts,
        pendingReports,
        reviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listVerifications = async (_req, res, next) => {
  try {
    const restaurants = await Restaurant.find({
      verificationStatus: { $in: ['pending', 'approved', 'rejected'] },
    })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name username email')
      .lean();
    res.json({ restaurants });
  } catch (err) {
    next(err);
  }
};

export const actOnVerification = async (req, res, next) => {
  try {
    const { action, notes } = verificationActionSchema.parse(req.body);
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    restaurant.isVerified = action === 'approve';
    restaurant.verificationNotes = notes;
    await restaurant.save();

    res.json({ restaurant });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (_req, res, next) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select('name username email role city isBlocked createdAt')
      .limit(100)
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const toggleBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ user: { _id: user._id, isBlocked: user.isBlocked } });
  } catch (err) {
    next(err);
  }
};

export const listReports = async (_req, res, next) => {
  try {
    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .populate('reporter', 'name username')
      .lean();
    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const { status } = reportActionSchema.parse(req.body);
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, resolvedBy: req.user._id },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (status === 'resolved' && report.targetType === 'post') {
      await Post.findByIdAndUpdate(report.targetId, { isHidden: true });
    }
    if (status === 'resolved' && report.targetType === 'review') {
      await Review.findByIdAndUpdate(report.targetId, { isHidden: true });
    }

    res.json({ report });
  } catch (err) {
    next(err);
  }
};

export const listPosts = async (_req, res, next) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'name username')
      .populate('restaurantTag', 'name')
      .lean();
    res.json({ posts });
  } catch (err) {
    next(err);
  }
};

export const hidePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    post.isHidden = !post.isHidden;
    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await post.deleteOne();
    res.json({ message: 'Post permanently deleted' });
  } catch (err) {
    next(err);
  }
};
