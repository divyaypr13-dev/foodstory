import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Map as MapIcon, List, UtensilsCrossed } from 'lucide-react';
import api from '../api/axios.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import MapView from '../components/MapView.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

const INITIAL_FILTERS = {
  costLevel: [],
  minRating: '',
  foodType: [],
  facilities: [],
  openNow: false,
};

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rating');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState('list');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 12,
        sort,
      };
      if (query.trim()) params.q = query.trim();
      if (filters.costLevel.length) params.costLevel = filters.costLevel.join(',');
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.foodType.length) params.foodType = filters.foodType.join(',');
      if (filters.facilities.length) params.facilities = filters.facilities.join(',');
      if (filters.openNow) params.openNow = 'true';

      const { data } = await api.get('/restaurants', { params });
      setRestaurants(data.restaurants || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [page, sort, query, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchRestaurants]);

  const handleFilterChange = (next) => {
    setPage(1);
    setFilters(next);
  };

  const handleReset = () => {
    setPage(1);
    setQuery('');
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1B16] text-balance">
            Discover Local Kitchens
          </h1>
          <p className="text-sm text-[#1F1B16]/65 mt-1">
            Browse verified eateries, menus, open hours, and neighborhood maps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-xs border border-[#1F1B16]/8">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#1F1B16]/45 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search restaurants, cuisines, or cities..."
            className="w-full rounded-2xl bg-white border border-[#1F1B16]/10 pl-11 pr-4 py-3 text-sm shadow-xs focus:outline-none focus:border-[#E23E3E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
            className="rounded-2xl bg-white border border-[#1F1B16]/10 px-4 py-3 text-sm font-medium text-[#1F1B16] shadow-xs focus:outline-none focus:border-[#E23E3E]"
          >
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="costAsc">Budget Friendly</option>
          </select>

          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-[#1F1B16]/10 text-sm font-medium text-[#1F1B16] shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#E23E3E]" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          mobileOpen={mobileFilterOpen}
          onCloseMobile={() => setMobileFilterOpen(false)}
        />

        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center justify-between text-xs text-[#1F1B16]/60">
            <span className="tabular-nums">{total} restaurants found</span>
            {filters.openNow && <span className="text-[#2E7D32] font-medium">Showing open now</span>}
          </div>

          {loading ? (
            <LoadingSkeleton variant="grid" count={6} />
          ) : error ? (
            <div className="bg-white rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm text-[#B71C1C]">{error}</p>
              <button
                type="button"
                onClick={fetchRestaurants}
                className="px-4 py-2 rounded-xl bg-[#E23E3E] text-white text-xs font-semibold cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No restaurants match your search"
              description="Try clearing a few filters or searching a different neighborhood or cuisine."
              action={
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              }
            />
          ) : viewMode === 'map' ? (
            <MapView restaurants={restaurants} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {restaurants.map((r) => (
                  <RestaurantCard key={r._id} restaurant={r} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#1F1B16]/12 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-[#1F1B16]/70 tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#1F1B16]/12 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
