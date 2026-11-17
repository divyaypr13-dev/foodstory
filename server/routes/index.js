import express from 'express';
import { protect, optionalProtect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

import * as authController from '../controllers/authController.js';
import * as restaurantController from '../controllers/restaurantController.js';
import * as menuController from '../controllers/menuController.js';
import * as reviewController from '../controllers/reviewController.js';
import * as billController from '../controllers/billController.js';
import * as postController from '../controllers/postController.js';
import * as commentController from '../controllers/commentController.js';
import * as savedController from '../controllers/savedController.js';
import * as collectionController from '../controllers/collectionController.js';
import * as chatController from '../controllers/chatController.js';
import * as aiController from '../controllers/aiController.js';
import * as ownerController from '../controllers/ownerController.js';
import * as adminController from '../controllers/adminController.js';
import * as uploadController from '../controllers/uploadController.js';

const router = express.Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'FoodStory API' });
});

// Auth routes
const authRouter = express.Router();
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/me', protect, authController.me);
authRouter.put('/me', protect, authController.updateMe);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/users/:id/follow', protect, authController.toggleFollow);
router.use('/auth', authRouter);

// Restaurant routes
const restaurantRouter = express.Router();
restaurantRouter.get('/', restaurantController.list);
restaurantRouter.get('/nearby', restaurantController.nearby);
restaurantRouter.get('/mine', protect, authorize('owner', 'admin'), restaurantController.myRestaurant);
restaurantRouter.get('/:id', optionalProtect, restaurantController.getOne);
restaurantRouter.post('/', protect, authorize('owner', 'admin'), restaurantController.create);
restaurantRouter.put('/:id', protect, authorize('owner', 'admin'), restaurantController.update);
restaurantRouter.post(
  '/:id/verify',
  protect,
  authorize('owner', 'admin'),
  restaurantController.requestVerification
);
router.use('/restaurants', restaurantRouter);

// Menu routes
const menuRouter = express.Router();
menuRouter.get('/search', menuController.searchDishes);
menuRouter.get('/restaurant/:restaurantId', menuController.listByRestaurant);
menuRouter.post('/', protect, authorize('owner', 'admin'), menuController.create);
menuRouter.put('/:id', protect, authorize('owner', 'admin'), menuController.update);
menuRouter.delete('/:id', protect, authorize('owner', 'admin'), menuController.remove);
router.use('/menus', menuRouter);

// Review routes
const reviewRouter = express.Router();
reviewRouter.get('/restaurant/:restaurantId', reviewController.list);
reviewRouter.post('/', protect, reviewController.create);
reviewRouter.put('/:id', protect, reviewController.update);
reviewRouter.delete('/:id', protect, reviewController.remove);
reviewRouter.post('/:id/helpful', protect, reviewController.toggleHelpful);
reviewRouter.post(
  '/:id/respond',
  protect,
  authorize('owner', 'admin'),
  reviewController.respond
);
router.use('/reviews', reviewRouter);

// Bill calculation routes
const billRouter = express.Router();
billRouter.post('/calculate', billController.calculate);
router.use('/bills', billRouter);

// Post routes
const postRouter = express.Router();
postRouter.get('/', optionalProtect, postController.feed);
postRouter.post('/', protect, postController.create);
postRouter.get('/:id', optionalProtect, postController.getOne);
postRouter.delete('/:id', protect, postController.remove);
postRouter.post('/:id/like', protect, postController.toggleLike);
postRouter.post('/:id/save', protect, postController.toggleSave);
postRouter.post('/:id/report', protect, postController.report);
router.use('/posts', postRouter);

// Comment routes
const commentRouter = express.Router();
commentRouter.get('/post/:postId', commentController.list);
commentRouter.post('/post/:postId', protect, commentController.create);
commentRouter.delete('/:id', protect, commentController.remove);
commentRouter.post('/:id/like', protect, commentController.toggleLike);
router.use('/comments', commentRouter);

// Saved items routes
const savedRouter = express.Router();
savedRouter.get('/', protect, savedController.list);
savedRouter.post('/toggle', protect, savedController.toggle);
savedRouter.delete('/:id', protect, savedController.remove);
router.use('/saved', savedRouter);

// Collections routes
const collectionRouter = express.Router();
collectionRouter.get('/', protect, collectionController.list);
collectionRouter.post('/', protect, collectionController.create);
collectionRouter.delete('/:id', protect, collectionController.remove);
router.use('/collections', collectionRouter);

// Chat routes
const chatRouter = express.Router();
chatRouter.get('/conversations', protect, chatController.listConversations);
chatRouter.post('/conversations', protect, chatController.startConversation);
chatRouter.get('/conversations/:id/messages', protect, chatController.messages);
chatRouter.post('/conversations/:id/messages', protect, chatController.sendMessage);
chatRouter.post('/conversations/:id/read', protect, chatController.markRead);
chatRouter.post('/messages/:messageId/report', protect, chatController.reportMessage);
router.use('/chat', chatRouter);

// AI recommendation routes
const aiRouter = express.Router();
aiRouter.post('/recommend/restaurants', protect, aiController.recommendRestaurants);
aiRouter.post('/recommend/dishes', protect, aiController.recommendDishes);
router.use('/ai', aiRouter);

// Owner routes
const ownerRouter = express.Router();
ownerRouter.get('/dashboard', protect, authorize('owner', 'admin'), ownerController.dashboard);
ownerRouter.get('/reviews', protect, authorize('owner', 'admin'), ownerController.reviews);
router.use('/owner', ownerRouter);

// Admin routes
const adminRouter = express.Router();
adminRouter.use(protect, authorize('admin'));
adminRouter.get('/stats', adminController.stats);
adminRouter.get('/verifications', adminController.listVerifications);
adminRouter.post('/verifications/:id', adminController.actOnVerification);
adminRouter.get('/users', adminController.listUsers);
adminRouter.post('/users/:id/toggle-block', adminController.toggleBlock);
adminRouter.get('/reports', adminController.listReports);
adminRouter.post('/reports/:id', adminController.resolveReport);
adminRouter.get('/posts', adminController.listPosts);
adminRouter.post('/posts/:id/hide', adminController.hidePost);
adminRouter.delete('/posts/:id', adminController.deletePost);
router.use('/admin', adminRouter);

// Upload route
const uploadRouter = express.Router();
uploadRouter.post('/', protect, uploadSingle, uploadController.uploadImage);
router.use('/uploads', uploadRouter);

export default router;
