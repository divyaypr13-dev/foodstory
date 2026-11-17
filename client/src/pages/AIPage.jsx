import { useState } from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import DishCard from '../components/DishCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function AIPage() {
  const [mode, setMode] = useState('restaurants');
  const [craving, setCraving] = useState('');
  const [foodType, setFoodType] = useState('');
  const [useLocation, setUseLocation] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [fallback, setFallback] = useState(false);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleRecommend = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      let coords = {};
      if (useLocation && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              resolve();
            },
            () => resolve(),
            { timeout: 3500 }
          );
        });
      }

      if (mode === 'restaurants') {
        const { data } = await api.post('/ai/recommend/restaurants', {
          ...coords,
          craving: craving.trim(),
        });
        setRecommendations(data.recommendations || []);
        setFallback(Boolean(data.fallback));
        setLabel(data.label || (data.fallback ? 'Popular near you' : 'Curated for you'));
      } else {
        const { data } = await api.post('/ai/recommend/dishes', {
          craving: craving.trim(),
          foodType: foodType || undefined,
        });
        setRecommendations(data.recommendations || []);
        setFallback(Boolean(data.fallback));
        setLabel(data.label || (data.fallback ? 'Popular near you' : 'Curated dishes'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not fetch recommendations';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(31,27,22,0.06)] p-6 sm:p-8 space-y-5">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1B16]">
            Dining Picks For You
          </h1>
          <p className="text-sm text-[#1F1B16]/65">
            Tell us what you are craving and get tailored restaurant or dish suggestions from local menus.
          </p>
        </div>

        <div className="inline-flex bg-[#FFF8F2] p-1 rounded-xl border border-[#1F1B16]/10">
          <button
            type="button"
            onClick={() => {
              setMode('restaurants');
              setRecommendations([]);
              setHasSearched(false);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'restaurants' ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70'
            }`}
          >
            Restaurants
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('dishes');
              setRecommendations([]);
              setHasSearched(false);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'dishes' ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70'
            }`}
          >
            Dishes
          </button>
        </div>

        <form onSubmit={handleRecommend} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={craving}
              onChange={(e) => setCraving(e.target.value)}
              placeholder={
                mode === 'restaurants'
                  ? 'e.g. cozy wood-fired pizza, quiet brunch, spicy South Indian...'
                  : 'e.g. smoky grilled starter, comforting noodles, light dessert...'
              }
              className="flex-1 rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-3 text-sm focus:outline-none focus:border-[#E23E3E]"
            />

            {mode === 'dishes' && (
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-3 text-sm focus:outline-none focus:border-[#E23E3E]"
              >
                <option value="">Any Diet</option>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
                <option value="vegan">Vegan</option>
                <option value="jain">Jain</option>
              </select>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Finding Picks...' : 'Recommend'}
            </button>
          </div>

          {mode === 'restaurants' && (
            <label className="inline-flex items-center gap-2 text-xs text-[#1F1B16]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="accent-[#E23E3E]"
              />
              <MapPin className="w-3.5 h-3.5 text-[#E23E3E]" />
              Use my current location for nearby picks
            </label>
          )}
        </form>
      </div>

      {loading ? (
        <LoadingSkeleton variant="grid" count={3} />
      ) : error ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-[#B71C1C]">{error}</div>
      ) : hasSearched && recommendations.length === 0 ? (
        <EmptyState
          title="No recommendations available yet"
          description="Add a few restaurants and menu items first so FoodStory can suggest great local spots."
        />
      ) : (
        recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#1F1B16]">
                {fallback ? 'Popular near you' : label}
              </h2>
              {fallback && (
                <span className="text-xs font-medium text-[#1F1B16]/60">
                  Popular near you
                </span>
              )}
            </div>

            {mode === 'restaurants' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendations.map((rec) => (
                  <RestaurantCard
                    key={rec.restaurant._id}
                    restaurant={rec.restaurant}
                    reason={rec.reason}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendations.map((rec) => (
                  <DishCard
                    key={rec.dish._id}
                    dish={rec.dish}
                    reason={rec.reason}
                    showRestaurantLink
                  />
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
