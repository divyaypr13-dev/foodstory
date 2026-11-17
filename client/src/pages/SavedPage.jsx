import { useState, useEffect, useCallback } from 'react';
import { Bookmark, FolderPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import DishCard from '../components/DishCard.jsx';
import PostCard from '../components/PostCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState('items');
  const [savedItems, setSavedItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create collection state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [savedRes, colRes] = await Promise.all([
        api.get('/saved'),
        api.get('/collections'),
      ]);
      setSavedItems(savedRes.data.items || []);
      setCollections(colRes.data.collections || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load saved bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const handleRemoveSaved = async (savedId) => {
    try {
      await api.delete(`/saved/${savedId}`);
      setSavedItems((prev) => prev.filter((s) => s._id !== savedId));
      toast.success('Removed from saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/collections', {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
      setCollections((prev) => [data.collection, ...prev]);
      setName('');
      setDescription('');
      setIsPublic(false);
      toast.success('Collection created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (colId) => {
    try {
      await api.delete(`/collections/${colId}`);
      setCollections((prev) => prev.filter((c) => c._id !== colId));
      toast.success('Collection deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1B16]">
            Saved & Collections
          </h1>
          <p className="text-sm text-[#1F1B16]/65 mt-1">
            Keep track of favorite restaurants, must-try dishes, and food stories.
          </p>
        </div>

        <div className="inline-flex bg-white p-1 rounded-xl shadow-xs border border-[#1F1B16]/8 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'items' ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70'
            }`}
          >
            Items ({savedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'collections' ? 'bg-[#E23E3E] text-white' : 'text-[#1F1B16]/70'
            }`}
          >
            Collections ({collections.length})
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton variant="grid" count={6} />
      ) : error ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-[#B71C1C]">{error}</div>
      ) : activeTab === 'items' ? (
        savedItems.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Bookmark restaurants, dishes, or stories as you explore FoodStory."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedItems.map((entry) => (
              <div key={entry._id} className="space-y-2">
                {entry.itemType === 'restaurant' && <RestaurantCard restaurant={entry.item} />}
                {entry.itemType === 'dish' && <DishCard dish={entry.item} showRestaurantLink />}
                {entry.itemType === 'post' && <PostCard post={entry.item} />}
                <button
                  type="button"
                  onClick={() => handleRemoveSaved(entry._id)}
                  className="text-xs font-medium text-[#B71C1C] hover:underline px-1 cursor-pointer"
                >
                  Remove bookmark
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <form
            onSubmit={handleCreateCollection}
            className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[#E23E3E]" />
              <h2 className="font-display text-lg font-semibold text-[#1F1B16]">
                New Collection
              </h2>
            </div>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend Brunch Spots"
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short notes about this list..."
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
            <label className="flex items-center gap-2 text-xs text-[#1F1B16]/75 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-[#E23E3E]"
              />
              Make collection public
            </label>
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create Collection'}
            </button>
          </form>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collections.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyState
                  title="No collections yet"
                  description="Organize your saved restaurants and dishes into custom themed lists."
                />
              </div>
            ) : (
              collections.map((col) => (
                <div
                  key={col._id}
                  className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-[#1F1B16]">
                        {col.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(col._id)}
                        aria-label="Delete collection"
                        className="p-1.5 rounded-lg text-[#1F1B16]/45 hover:text-[#B71C1C] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {col.description && (
                      <p className="text-xs text-[#1F1B16]/65 mt-1">{col.description}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#1F1B16]/55">
                    {col.itemCount || 0} items · {col.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
