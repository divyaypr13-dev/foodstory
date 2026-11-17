import { z } from 'zod';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Restaurant from '../models/Restaurant.js';
import Report from '../models/Report.js';
import { getIO } from '../sockets/index.js';

const startSchema = z.object({
  recipientId: z.string().optional(),
  restaurantId: z.string().optional(),
  type: z.enum(['customer-restaurant', 'user-user']).optional(),
});

const sendSchema = z.object({
  text: z.string().trim().max(2000).optional().default(''),
  media: z
    .array(
      z.object({
        url: z.string().min(1),
        type: z.enum(['image', 'video']).optional().default('image'),
      })
    )
    .optional()
    .default([]),
});

const reportSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a reason').max(500),
});

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name username profilePhoto role')
      .populate('restaurant', 'name photos city')
      .populate('lastMessage')
      .lean();

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

export const startConversation = async (req, res, next) => {
  try {
    const { recipientId, restaurantId, type } = startSchema.parse(req.body);
    let targetUserId = recipientId;
    let resolvedType = type || 'user-user';

    if (restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      if (!targetUserId) {
        targetUserId = String(restaurant.owner);
      }
      resolvedType = 'customer-restaurant';
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'Recipient or restaurant is required' });
    }
    if (String(targetUserId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself' });
    }

    const query = {
      participants: { $all: [req.user._id, targetUserId] },
    };
    if (restaurantId) query.restaurant = restaurantId;

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'name username profilePhoto role')
      .populate('restaurant', 'name photos city')
      .populate('lastMessage');

    if (!conversation) {
      const created = await Conversation.create({
        participants: [req.user._id, targetUserId],
        type: resolvedType,
        restaurant: restaurantId || null,
        unreadCounts: {
          [String(req.user._id)]: 0,
          [String(targetUserId)]: 0,
        },
      });
      conversation = await Conversation.findById(created._id)
        .populate('participants', 'name username profilePhoto role')
        .populate('restaurant', 'name photos city')
        .populate('lastMessage');
    }

    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

export const messages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const isParticipant = conversation.participants.some(
      (p) => String(p) === String(req.user._id)
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const msgs = await Message.find({ conversation: conversation._id, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate('sender', 'name username profilePhoto')
      .lean();

    res.json({ messages: msgs });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { text, media } = sendSchema.parse(req.body);
    if (!text && (!media || media.length === 0)) {
      return res.status(400).json({ message: 'Message text or media is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const isParticipant = conversation.participants.some(
      (p) => String(p) === String(req.user._id)
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to message in this conversation' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      media,
      readBy: [req.user._id],
    });

    const otherParticipant = conversation.participants.find(
      (p) => String(p) !== String(req.user._id)
    );
    const otherId = String(otherParticipant);
    const currentUnread = conversation.unreadCounts.get(otherId) || 0;
    conversation.unreadCounts.set(otherId, currentUnread + 1);
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await message.populate('sender', 'name username profilePhoto');

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('chat:newMessage', {
        conversationId: String(conversation._id),
        message: populated,
      });
      io.to(`user:${otherId}`).emit('chat:newMessage', {
        conversationId: String(conversation._id),
        message: populated,
      });
    }

    res.status(201).json({ message: populated });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const isParticipant = conversation.participants.some(
      (p) => String(p) === String(req.user._id)
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    conversation.unreadCounts.set(String(req.user._id), 0);
    await conversation.save();

    await Message.updateMany(
      { conversation: conversation._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const reportMessage = async (req, res, next) => {
  try {
    const { reason } = reportSchema.parse(req.body);
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType: 'message',
      targetId: message._id,
      reason,
    });
    res.status(201).json({ report, message: 'Message reported' });
  } catch (err) {
    next(err);
  }
};
