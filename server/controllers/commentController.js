import { z } from 'zod';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Like from '../models/Like.js';

const commentSchema = z.object({
  text: z.string().trim().min(1, 'Comment cannot be empty').max(1000),
  parentComment: z.string().optional().nullable(),
});

export const list = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, isHidden: false })
      .sort({ createdAt: 1 })
      .populate('author', 'name username profilePhoto')
      .lean();
    res.json({ comments });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { text, parentComment } = commentSchema.parse(req.body);
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text,
      parentComment: parentComment || null,
    });

    await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });
    const populated = await comment.populate('author', 'name username profilePhoto');
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existing = await Like.findOne({
      user: req.user._id,
      targetType: 'comment',
      targetId: comment._id,
    });

    if (existing) {
      await existing.deleteOne();
      const updated = await Comment.findByIdAndUpdate(
        comment._id,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      return res.json({ liked: false, likeCount: Math.max(0, updated.likeCount) });
    }

    await Like.create({ user: req.user._id, targetType: 'comment', targetId: comment._id });
    const updated = await Comment.findByIdAndUpdate(
      comment._id,
      { $inc: { likeCount: 1 } },
      { new: true }
    );
    res.json({ liked: true, likeCount: updated.likeCount });
  } catch (err) {
    next(err);
  }
};
