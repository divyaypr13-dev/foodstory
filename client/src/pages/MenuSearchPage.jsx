import { useState, useEffect, useCallback } from 'react';
import { Search, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import DishCard from '../components/DishCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function MenuSearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [foodType, setFoodType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (category) params.category = category;
      if (foodType) params.foodType = foodType;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await api.get('/menus/search', { params });
      setItems(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search dishes');
    } finally {
      setLoading(false);
    }
  }, [q, category, foodType, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDishes();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDishes]);

  const handleSaveDish = async (dish) => {
    if (!user) {
      toast.error('Sign in to save dishes');
      return;
    }
    try {
      const { data } = await api.post('/saved/toggle', {
        itemType: 'dish',
        itemId: dish._id,
      });
      toast.success(data.saved ? 'Dish saved' : 'Removed from saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save dish');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1B16]">
          Search Dishes
        </h1>
        <p className="text-sm text-[#1F1B16]/65 mt-1">
          Find specific dishes across every local menu by category, diet, or budget.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-[#1F1B16]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search biryani, ramen, sourdough..."
            className="w-full rounded-xl bg-[#FFF8F2] border border-[#1F1B16]/10 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl bg-[#FFF8F2] border border-[#1F1B16]/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
        >
          <option value="">All Categories</option>
          <option value="starter">Starters</option>
          <option value="main">Mains</option>
          <option value="dessert">Desserts</option>
          <option value="beverage">Beverages</option>
        </select>

        <select
          value={foodType}
          onChange={(e) => setFoodType(e.target.value)}
          className="rounded-xl bg-[#FFF8F2] border border-[#1F1B16]/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
        >
          <option value="">All Dietary</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
          <option value="vegan">Vegan</option>
          <option value="jain">Jain</option>
        </select>

        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price (₹)"
          className="rounded-xl bg-[#FFF8F2] border border-[#1F1B16]/10 px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#E23E3E]"
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="grid" count={6} />
      ) : error ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-[#B71C1C]">{error}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No dishes found"
          description="Try broadening your dish name or clearing the price and dietary filters."
          action={
            <button
              type="button"
              onClick={() => {
                setQ('');
                setCategory('');
                setFoodType('');
                setMaxPrice('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-medium cursor-pointer"
            >
              Clear Search
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((dish) => (
            <DishCard
              key={dish._id}
              dish={dish}
              showRestaurantLink
              onSave={handleSaveDish}
            />
          ))}
        </div>
      )}
    </div>
  );
}
