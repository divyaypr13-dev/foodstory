import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ImagePlus, Sparkles, Compass, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FALLBACK_IMAGES } from '../utils/media.js';

export default function FeedPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('trending');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Composer state
  const [composerOpen, setComposerOpen] = useState(searchParams.get('compose') === '1');
  const [caption, setCaption] = useState('');
  const [restaurantTag, setRestaurantTag] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Report modal state
  const [reportingPostId, setReportingPostId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      setComposerOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    api
      .get('/restaurants', { params: { limit: 40 } })
      .then(({ data }) => setRestaurants(data.restaurants || []))
      .catch(() => {});
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { tab };
      if (tab === 'nearby' && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              params.lat = pos.coords.latitude;
              params.lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }
      const { data } = await api.get('/posts', { params });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load feed');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads', formData);
      setMediaUrl(data.url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to share a food story');
      return;
    }
    setPosting(true);
    try {
      const payload = {
        caption,
        restaurantTag: restaurantTag || null,
        media: mediaUrl ? [{ url: mediaUrl, type: 'image' }] : [],
      };
      const { data } = await api.post('/posts', payload);
      setPosts((prev) => [data.post, ...prev]);
      setCaption('');
      setRestaurantTag('');
      setMediaUrl('');
      setComposerOpen(false);
      toast.success('FoodStory published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish story');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Sign in to like stories');
      return;
    }
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, isLiked: data.liked, likeCount: data.likeCount } : p
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update like');
    }
  };

  const handleSave = async (postId) => {
    if (!user) {
      toast.error('Sign in to save stories');
      return;
    }
    try {
      const { data } = await api.post(`/posts/${postId}/save`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, isSaved: data.saved, saveCount: data.saveCount } : p
        )
      );
      toast.success(data.saved ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update save');
    }
  };

  const handleFollow = async (authorId) => {
    if (!user) {
      toast.error('Sign in to follow foodies');
      return;
    }
    try {
      const { data } = await api.post(`/auth/users/${authorId}/follow`);
      toast.success(data.following ? 'Following user' : 'Unfollowed user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Follow action failed');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Story deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingPostId || !reportReason.trim()) return;
    try {
      await api.post(`/posts/${reportingPostId}/report`, { reason: reportReason.trim() });
      toast.success('Report submitted');
      setReportingPostId(null);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit report');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Editorial Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white rounded-2xl shadow-[0_2px_16px_rgba(31,27,22,0.06)] overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-4">
          <p className="text-xs font-semibold text-[#E23E3E] tracking-wide">
            Neighborhood Dining Journal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1B16] leading-tight text-balance">
            Every great meal has a story worth sharing.
          </h1>
          <p className="text-sm sm:text-base text-[#1F1B16]/70 leading-relaxed max-w-xl">
            Explore authentic dish notes from local diners, check real menus and verified bill estimates, and connect directly with independent kitchens.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] transition-colors"
            >
              <Compass className="w-4 h-4" />
              Discover Restaurants
            </Link>
            <Link
              to="/ai"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FFF8F2] text-[#1F1B16] border border-[#1F1B16]/12 text-sm font-semibold hover:border-[#E23E3E] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#FFB020]" />
              Smart Meal Picks
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 min-h-[220px] lg:min-h-full bg-[#FFF8F2]">
          <img
            src={FALLBACK_IMAGES.hero}
            alt="Shared dining table with artisanal dishes"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Main Feed Column + Composer */}
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex bg-white p-1 rounded-xl shadow-xs border border-[#1F1B16]/8">
            {['trending', 'following', 'nearby'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  tab === t ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70 hover:text-[#1F1B16]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setComposerOpen((o) => !o)}
            className="px-4 py-2.5 rounded-xl bg-[#E23E3E] text-white text-xs sm:text-sm font-semibold hover:bg-[#c83232] transition-colors cursor-pointer"
          >
            {composerOpen ? 'Close Composer' : 'Share a Story'}
          </button>
        </div>

        {composerOpen && (
          <form
            onSubmit={handleCreatePost}
            className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(31,27,22,0.08)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#1F1B16]">
                New Food Story
              </h2>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="p-1.5 rounded-lg text-[#1F1B16]/50 hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!user && (
              <p className="text-xs text-[#E23E3E]">
                Please{' '}
                <Link to="/login" className="underline font-semibold">
                  sign in
                </Link>{' '}
                to publish a story.
              </p>
            )}

            <textarea
              rows={3}
              required
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe the dish, flavors, and atmosphere... Add #hashtags too!"
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-3 text-sm focus:outline-none focus:border-[#E23E3E]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={restaurantTag}
                onChange={(e) => setRestaurantTag(e.target.value)}
                className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              >
                <option value="">Tag a restaurant (optional)</option>
                {restaurants.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} · {r.city}
                  </option>
                ))}
              </select>

              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#1F1B16]/25 bg-[#FFF8F2]/40 px-3 py-2.5 text-xs font-semibold text-[#1F1B16]/75 hover:border-[#E23E3E] cursor-pointer">
                <ImagePlus className="w-4 h-4 text-[#E23E3E]" />
                {uploading ? 'Uploading...' : mediaUrl ? 'Photo Ready (Change)' : 'Upload Food Photo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {mediaUrl && (
              <div className="relative rounded-xl overflow-hidden max-h-56 bg-[#FFF8F2]">
                <img src={mediaUrl} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || uploading || !user}
                className="px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
              >
                {posting ? 'Publishing...' : 'Publish Story'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : error ? (
          <div className="bg-white rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-[#B71C1C]">{error}</p>
            <button
              type="button"
              onClick={fetchFeed}
              className="px-4 py-2 rounded-xl bg-[#E23E3E] text-white text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title={tab === 'following' ? 'Your following feed is quiet' : 'No stories yet'}
            description={
              tab === 'following'
                ? 'Follow fellow foodies or switch to Trending to explore local food stories.'
                : 'Be the first to post a dish story and tag a neighborhood restaurant.'
            }
          />
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                onLike={handleLike}
                onSave={handleSave}
                onFollow={handleFollow}
                onDelete={handleDelete}
                onReport={(id) => setReportingPostId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReport}
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold text-[#1F1B16]">Report Story</h3>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Explain why this story should be reviewed..."
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportingPostId(null);
                  setReportReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1F1B16]/70 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#B71C1C] text-white text-xs font-semibold cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
