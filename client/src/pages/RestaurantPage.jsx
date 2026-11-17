import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  Bookmark,
  MessageCircle,
  Receipt,
  CheckCircle2,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import DishCard from '../components/DishCard.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import PostCard from '../components/PostCard.jsx';
import BillSummary from '../components/BillSummary.jsx';
import RatingStars from '../components/RatingStars.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FALLBACK_IMAGES, formatCostLevel } from '../utils/media.js';

const CATEGORY_ORDER = ['starter', 'main', 'dessert', 'beverage'];

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bill calculator state (items map: menuItemId -> qty)
  const [cart, setCart] = useState({});
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billData, setBillData] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/restaurants/${id}`);
      setRestaurant(data.restaurant);
      setMenuItems(data.menuItems || []);
      setReviews(data.reviews || []);
      setPosts(data.posts || []);
      setIsSaved(Boolean(data.isSaved));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load restaurant');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const totalSelectedCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const addDish = (dish) => {
    setCart((prev) => ({ ...prev, [dish._id]: (prev[dish._id] || 0) + 1 }));
  };

  const removeDish = (dish) => {
    setCart((prev) => {
      const nextQty = (prev[dish._id] || 0) - 1;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[dish._id];
        return copy;
      }
      return { ...prev, [dish._id]: nextQty };
    });
  };

  const handleCalculateBill = async () => {
    const items = Object.entries(cart).map(([menuItemId, qty]) => ({
      menuItemId,
      qty,
    }));
    if (items.length === 0) return;

    setBillModalOpen(true);
    setBillLoading(true);
    setBillError('');
    try {
      const { data } = await api.post('/bills/calculate', {
        restaurantId: id,
        items,
      });
      setBillData(data);
    } catch (err) {
      setBillError(err.response?.data?.message || 'Unable to calculate bill');
    } finally {
      setBillLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.error('Sign in to save restaurants');
      return;
    }
    try {
      const { data } = await api.post('/saved/toggle', {
        itemType: 'restaurant',
        itemId: id,
      });
      setIsSaved(data.saved);
      toast.success(data.saved ? 'Saved restaurant' : 'Removed from saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.post('/chat/conversations', { restaurantId: id });
      navigate(`/chat?conversation=${data.conversation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start chat');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        restaurant: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review published');
      setReviewComment('');
      loadRestaurant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error('Sign in to mark reviews helpful');
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      loadRestaurant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Review removed');
      loadRestaurant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleOwnerRespond = async (reviewId, text) => {
    try {
      await api.post(`/reviews/${reviewId}/respond`, { text });
      toast.success('Response posted');
      loadRestaurant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };

  if (loading) return <LoadingSkeleton variant="detail" />;

  if (error || !restaurant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Restaurant unavailable"
          description={error || 'This restaurant could not be found.'}
          action={
            <button
              type="button"
              onClick={() => navigate('/discover')}
              className="px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-medium cursor-pointer"
            >
              Browse Discover
            </button>
          }
        />
      </div>
    );
  }

  const heroImg = restaurant.photos?.[0] || FALLBACK_IMAGES.restaurant;
  const activeFacilities = Object.entries(restaurant.facilities || {})
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) =>
      key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
    );

  const isOwner = user && String(restaurant.owner?._id || restaurant.owner) === String(user._id);

  return (
    <div className="pb-28">
      {/* Hero Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="relative rounded-2xl overflow-hidden shadow-[0_6px_24px_rgba(31,27,22,0.1)] aspect-[16/9] max-h-[380px] bg-[#1F1B16]">
          <img
            src={heroImg}
            alt={restaurant.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGES.restaurant;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium mb-2">
              <span
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  restaurant.isOpenNow ? 'bg-[#2E7D32] text-white' : 'bg-[#B71C1C] text-white'
                }`}
              >
                {restaurant.isOpenNow ? 'Open Now' : 'Closed'}
              </span>
              <span>{formatCostLevel(restaurant.costLevel)}</span>
              <span>·</span>
              <span>{(restaurant.cuisineTags || []).join(' · ') || 'Dining'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-4xl font-bold text-white">
                    {restaurant.name}
                  </h1>
                  {restaurant.isVerified && <CheckCircle2 className="w-5 h-5 text-[#FFB020]" />}
                </div>
                <p className="text-xs sm:text-sm text-white/85 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {restaurant.address}, {restaurant.city}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-[#FFB020] text-[#1F1B16]'
                      : 'bg-white/95 text-[#1F1B16] hover:bg-white'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#1F1B16]' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E23E3E] text-white text-xs font-semibold hover:bg-[#c83232] transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Summary Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-5">
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-[#FFB020] fill-[#FFB020] shrink-0" />
            <div>
              <p className="font-semibold text-[#1F1B16] tabular-nums">
                {Number(restaurant.ratingAvg || 0).toFixed(1)} Rating ({restaurant.ratingCount || 0} reviews)
              </p>
              <p className="text-xs text-[#1F1B16]/60">
                GST {restaurant.gstRate ?? 5}% · Service Charge {restaurant.serviceChargeRate || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#E23E3E] shrink-0" />
            <div>
              <p className="font-semibold text-[#1F1B16] tabular-nums">
                {restaurant.openTime} – {restaurant.closeTime}
              </p>
              <p className="text-xs text-[#1F1B16]/60">Daily Dining Hours</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#2E7D32] shrink-0" />
            <div>
              <p className="font-semibold text-[#1F1B16]">
                {restaurant.contactNumber || 'Contact via chat'}
              </p>
              <p className="text-xs text-[#1F1B16]/60">
                {activeFacilities.length ? activeFacilities.join(' · ') : 'Dine-in available'}
              </p>
            </div>
          </div>
        </div>

        {restaurant.description && (
          <p className="text-sm text-[#1F1B16]/80 mt-4 leading-relaxed max-w-3xl">
            {restaurant.description}
          </p>
        )}
      </div>

      {/* Section Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center gap-2 border-b border-[#1F1B16]/10 pb-3">
          {[
            { id: 'menu', label: `Menu (${menuItems.length})` },
            { id: 'reviews', label: `Reviews (${reviews.length})` },
            { id: 'posts', label: `Stories (${posts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#E23E3E] text-white'
                  : 'bg-white text-[#1F1B16]/75 hover:text-[#1F1B16]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="mt-6 space-y-8">
            {menuItems.length === 0 ? (
              <EmptyState
                title="Menu coming soon"
                description="This restaurant hasn't published dishes yet. Check back or message them directly."
              />
            ) : (
              CATEGORY_ORDER.map((cat) => {
                const catItems = menuItems.filter((item) => item.category === cat);
                if (!catItems.length) return null;
                return (
                  <section key={cat} className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold text-[#1F1B16] capitalize">
                      {cat}s
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {catItems.map((dish) => (
                        <DishCard
                          key={dish._id}
                          dish={dish}
                          qty={cart[dish._id] || 0}
                          onAdd={addDish}
                          onRemove={removeDish}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="mt-6 space-y-6 max-w-3xl">
            {user && !isOwner && (
              <form
                onSubmit={handleSubmitReview}
                className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-[#1F1B16]">
                    Write a Review
                  </h3>
                  <RatingStars
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onChange={setReviewRating}
                  />
                </div>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share how the dishes, atmosphere, and service felt..."
                  className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-3 text-sm focus:outline-none focus:border-[#E23E3E]"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Publish Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Be the first diner to share your experience at this restaurant."
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <ReviewCard
                    key={rev._id}
                    review={rev}
                    currentUserId={user?._id}
                    canRespond={isOwner}
                    onHelpful={handleHelpful}
                    onDelete={handleDeleteReview}
                    onRespond={handleOwnerRespond}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stories Tab */}
        {activeTab === 'posts' && (
          <div className="mt-6 max-w-2xl space-y-5">
            {posts.length === 0 ? (
              <EmptyState
                title="No food stories tagged yet"
                description="Share a photo story from your meal and tag this restaurant."
              />
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} currentUserId={user?._id} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Sticky Bill Bar */}
      {totalSelectedCount > 0 && (
        <div className="fixed bottom-[64px] md:bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
          <div className="max-w-xl mx-auto bg-[#1F1B16] text-white rounded-2xl shadow-xl px-5 py-3.5 flex items-center justify-between gap-4 pointer-events-auto">
            <div>
              <p className="text-sm font-semibold tabular-nums">
                {totalSelectedCount} {totalSelectedCount === 1 ? 'dish' : 'dishes'} selected
              </p>
              <p className="text-xs text-white/70">Server-verified GST & service estimate</p>
            </div>

            <button
              type="button"
              onClick={handleCalculateBill}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E23E3E] text-white text-xs sm:text-sm font-semibold hover:bg-[#c83232] transition-colors cursor-pointer shrink-0"
            >
              <Receipt className="w-4 h-4" />
              Estimate Bill
            </button>
          </div>
        </div>
      )}

      <BillSummary
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        billData={billData}
        loading={billLoading}
        error={billError}
        onClear={() => {
          setCart({});
          setBillData(null);
          setBillModalOpen(false);
        }}
      />
    </div>
  );
}
