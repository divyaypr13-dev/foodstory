import { Server } from 'socket.io';
import { verifyToken } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

let ioInstance = null;

export const getIO = () => ioInstance;

export const initSockets = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('_id name username isBlocked');
      if (!user || user.isBlocked) {
        return next(new Error('Unauthorized'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);

    socket.on('chat:join', async (conversationId) => {
      try {
        if (!conversationId) return;
        const conversation = await Conversation.findById(conversationId).select('participants');
        if (
          conversation &&
          conversation.participants.some((p) => String(p) === userId)
        ) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch {
        // Ignore invalid room join
      }
    });

    socket.on('chat:leave', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        name: socket.user.name,
        isTyping: Boolean(isTyping),
      });
    });
  });

  return ioInstance;
};
