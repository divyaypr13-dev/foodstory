import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Review from '../models/Review.js';
import Post from '../models/Post.js';

export const dashboard = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id }).lean();
    const restaurantIds = restaurants.map((r) => r._id);

    const [menuCount, reviewCount, postCount] = await Promise.all([
      MenuItem.countDocuments({ restaurant: { $in: restaurantIds } }),
      Review.countDocuments({ restaurant: { $in: restaurantIds }, isHidden: false }),
      Post.countDocuments({ restaurantTag: { $in: restaurantIds }, isHidden: false }),
    ]);

    const totalViews = restaurants.reduce((acc, r) => acc + (r.profileViews || 0), 0);
    const avgRating =
      restaurants.length > 0
        ? Math.round(
            (restaurants.reduce((acc, r) => acc + (r.ratingAvg || 0), 0) / restaurants.length) * 10
          ) / 10
        : 0;

    res.json({
      stats: {
        restaurantCount: restaurants.length,
        totalViews,
        menuCount,
        reviewCount,
        postCount,
        avgRating,
      },
      restaurants,
    });
  } catch (err) {
    next(err);
  }
};

export const reviews = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id }).select('_id name').lean();
    const restaurantIds = restaurants.map((r) => r._id);

    const list = await Review.find({ restaurant: { $in: restaurantIds }, isHidden: false })
      .sort({ createdAt: -1 })
      .populate('user', 'name username profilePhoto')
      .populate('restaurant', 'name')
      .lean();

    res.json({ reviews: list });
  } catch (err) {
    next(err);
  }
};
