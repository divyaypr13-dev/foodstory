import { useState, useEffect, useCallback } from 'react';
import { Store, Plus, Trash2, CheckCircle2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import ReviewCard from '../components/ReviewCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatCurrency } from '../utils/media.js';

const EMPTY_RESTAURANT = {
  name: '',
  description: '',
  cuisineTagsText: '',
  address: '',
  city: '',
  lat: '12.9716',
  lng: '77.5946',
  openTime: '09:00',
  closeTime: '22:30',
  contactNumber: '',
  costLevel: 2,
  gstRate: 5,
  serviceChargeRate: 0,
  photoUrl: '',
  facilities: {
    parking: false,
    wifi: true,
    outdoorSeating: false,
    wheelchairAccessible: false,
    petFriendly: false,
  },
};

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [restForm, setRestForm] = useState(EMPTY_RESTAURANT);
  const [savingRest, setSavingRest] = useState(false);

  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    foodType: 'veg',
    image: '',
  });
  const [addingDish, setAddingDish] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, revRes] = await Promise.all([
        api.get('/owner/dashboard'),
        api.get('/owner/reviews'),
      ]);
      setStats(dashRes.data.stats);
      setReviews(revRes.data.reviews || []);
      const firstRest = dashRes.data.restaurants?.[0] || null;
      setRestaurant(firstRest);

      if (firstRest) {
        setRestForm({
          name: firstRest.name || '',
          description: firstRest.description || '',
          cuisineTagsText: (firstRest.cuisineTags || []).join(', '),
          address: firstRest.address || '',
          city: firstRest.city || '',
          lat: String(firstRest.location?.coordinates?.[1] ?? '12.9716'),
          lng: String(firstRest.location?.coordinates?.[0] ?? '77.5946'),
          openTime: firstRest.openTime || '09:00',
          closeTime: firstRest.closeTime || '22:30',
          contactNumber: firstRest.contactNumber || '',
          costLevel: firstRest.costLevel || 2,
          gstRate: firstRest.gstRate ?? 5,
          serviceChargeRate: firstRest.serviceChargeRate ?? 0,
          photoUrl: firstRest.photos?.[0] || '',
          facilities: {
            parking: Boolean(firstRest.facilities?.parking),
            wifi: Boolean(firstRest.facilities?.wifi),
            outdoorSeating: Boolean(firstRest.facilities?.outdoorSeating),
            wheelchairAccessible: Boolean(firstRest.facilities?.wheelchairAccessible),
            petFriendly: Boolean(firstRest.facilities?.petFriendly),
          },
        });
        const menuRes = await api.get(`/menus/restaurant/${firstRest._id}`);
        setMenuItems(menuRes.data.items || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load owner studio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const uploadSingleImage = async (file) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads', formData);
      toast.success('Photo uploaded');
      return data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      return '';
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    setSavingRest(true);
    try {
      const payload = {
        name: restForm.name,
        description: restForm.description,
        cuisineTags: restForm.cuisineTagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        address: restForm.address,
        city: restForm.city,
        lat: Number(restForm.lat),
        lng: Number(restForm.lng),
        openTime: restForm.openTime,
        closeTime: restForm.closeTime,
        contactNumber: restForm.contactNumber,
        costLevel: Number(restForm.costLevel),
        gstRate: Number(restForm.gstRate),
        serviceChargeRate: Number(restForm.serviceChargeRate),
        photos: restForm.photoUrl ? [restForm.photoUrl] : [],
        facilities: restForm.facilities,
      };

      if (restaurant) {
        await api.put(`/restaurants/${restaurant._id}`, payload);
        toast.success('Restaurant updated');
      } else {
        await api.post('/restaurants', payload);
        toast.success('Restaurant created');
      }
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save restaurant');
    } finally {
      setSavingRest(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!restaurant) return;
    try {
      const { data } = await api.post(`/restaurants/${restaurant._id}/verify`);
      toast.success(data.message);
      setRestaurant(data.restaurant);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification request failed');
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    setAddingDish(true);
    try {
      const { data } = await api.post('/menus', {
        ...dishForm,
        restaurant: restaurant._id,
        price: Number(dishForm.price),
      });
      setMenuItems((prev) => [...prev, data.item]);
      setDishForm({
        name: '',
        description: '',
        price: '',
        category: 'main',
        foodType: 'veg',
        image: '',
      });
      toast.success('Menu item added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add dish');
    } finally {
      setAddingDish(false);
    }
  };

  const handleDeleteDish = async (dishId) => {
    try {
      await api.delete(`/menus/${dishId}`);
      setMenuItems((prev) => prev.filter((m) => m._id !== dishId));
      toast.success('Dish removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove dish');
    }
  };

  const handleRespondReview = async (reviewId, text) => {
    try {
      await api.post(`/reviews/${reviewId}/respond`, { text });
      toast.success('Reply saved');
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reply');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1F1B16]">Owner Studio</h1>
          <p className="text-sm text-[#1F1B16]/65">
            Manage your restaurant profile, menu catalog, GST rates, and diner reviews.
          </p>
        </div>

        {restaurant && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#1F1B16]/70">
              Verification: <strong className="capitalize">{restaurant.verificationStatus}</strong>
            </span>
            {restaurant.verificationStatus !== 'approved' &&
              restaurant.verificationStatus !== 'pending' && (
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#256628] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Request Verification
                </button>
              )}
          </div>
        )}
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Profile Views', value: stats.totalViews },
            { label: 'Average Rating', value: Number(stats.avgRating || 0).toFixed(1) },
            { label: 'Menu Dishes', value: stats.menuCount },
            { label: 'Guest Reviews', value: stats.reviewCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5"
            >
              <p className="text-xs font-medium text-[#1F1B16]/60">{stat.label}</p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#1F1B16] tabular-nums mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Restaurant Profile Form */}
      <form
        onSubmit={handleSaveRestaurant}
        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#E23E3E]" />
          <h2 className="font-display text-xl font-semibold text-[#1F1B16]">
            {restaurant ? 'Edit Restaurant Details' : 'Create Your Restaurant'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            placeholder="Restaurant Name"
            value={restForm.name}
            onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm"
          />
          <input
            type="text"
            placeholder="Cuisines (e.g. South Indian, Bakery, Cafe)"
            value={restForm.cuisineTagsText}
            onChange={(e) => setRestForm({ ...restForm, cuisineTagsText: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Street Address"
            value={restForm.address}
            onChange={(e) => setRestForm({ ...restForm, address: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm"
          />
          <input
            type="text"
            required
            placeholder="City"
            value={restForm.city}
            onChange={(e) => setRestForm({ ...restForm, city: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm"
          />
          <input
            type="text"
            placeholder="Open Time (HH:MM)"
            value={restForm.openTime}
            onChange={(e) => setRestForm({ ...restForm, openTime: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm tabular-nums"
          />
          <input
            type="text"
            placeholder="Close Time (HH:MM)"
            value={restForm.closeTime}
            onChange={(e) => setRestForm({ ...restForm, closeTime: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm tabular-nums"
          />
          <input
            type="text"
            placeholder="Latitude"
            value={restForm.lat}
            onChange={(e) => setRestForm({ ...restForm, lat: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            type="text"
            placeholder="Longitude"
            value={restForm.lng}
            onChange={(e) => setRestForm({ ...restForm, lng: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm font-mono"
          />
          <input
            type="text"
            placeholder="Contact Phone"
            value={restForm.contactNumber}
            onChange={(e) => setRestForm({ ...restForm, contactNumber: e.target.value })}
            className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={restForm.costLevel}
              onChange={(e) => setRestForm({ ...restForm, costLevel: Number(e.target.value) })}
              className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-2.5 py-2.5 text-sm"
            >
              <option value={1}>₹</option>
              <option value={2}>₹₹</option>
              <option value={3}>₹₹₹</option>
              <option value={4}>₹₹₹₹</option>
            </select>
            <input
              type="number"
              min="0"
              max="28"
              placeholder="GST %"
              value={restForm.gstRate}
              onChange={(e) => setRestForm({ ...restForm, gstRate: e.target.value })}
              title="Default GST %"
              className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-2.5 py-2.5 text-sm tabular-nums"
            />
            <input
              type="number"
              min="0"
              max="25"
              placeholder="Svc %"
              value={restForm.serviceChargeRate}
              onChange={(e) => setRestForm({ ...restForm, serviceChargeRate: e.target.value })}
              title="Service Charge %"
              className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-2.5 py-2.5 text-sm tabular-nums"
            />
          </div>
        </div>

        <textarea
          rows={2}
          placeholder="Tell guests about your kitchen, specialty dishes, and ambiance..."
          value={restForm.description}
          onChange={(e) => setRestForm({ ...restForm, description: e.target.value })}
          className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm"
        />

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#1F1B16]">
          {Object.keys(restForm.facilities).map((facKey) => (
            <label key={facKey} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={restForm.facilities[facKey]}
                onChange={(e) =>
                  setRestForm({
                    ...restForm,
                    facilities: { ...restForm.facilities, [facKey]: e.target.checked },
                  })
                }
                className="accent-[#E23E3E]"
              />
              <span className="capitalize">{facKey.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#1F1B16]/25 text-xs font-semibold cursor-pointer">
            <ImagePlus className="w-4 h-4 text-[#E23E3E]" />
            {uploadingPhoto ? 'Uploading...' : restForm.photoUrl ? 'Cover Photo Uploaded' : 'Upload Cover Photo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadSingleImage(file);
                if (url) setRestForm((prev) => ({ ...prev, photoUrl: url }));
              }}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={savingRest}
            className="px-6 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
          >
            {savingRest ? 'Saving...' : restaurant ? 'Save Restaurant' : 'Create Restaurant'}
          </button>
        </div>
      </form>

      {/* Menu Management */}
      {restaurant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <form
            onSubmit={handleAddDish}
            className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#E23E3E]" />
              <h2 className="font-display text-lg font-semibold text-[#1F1B16]">Add Dish</h2>
            </div>

            <input
              type="text"
              required
              placeholder="Dish Name"
              value={dishForm.name}
              onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2 text-sm"
            />
            <textarea
              rows={2}
              placeholder="Description"
              value={dishForm.description}
              onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Price (₹)"
                value={dishForm.price}
                onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3 py-2 text-sm tabular-nums"
              />
              <select
                value={dishForm.category}
                onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                className="rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-2.5 py-2 text-sm"
              >
                <option value="starter">Starter</option>
                <option value="main">Main</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
            <select
              value={dishForm.foodType}
              onChange={(e) => setDishForm({ ...dishForm, foodType: e.target.value })}
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3 py-2 text-sm"
            >
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
              <option value="vegan">Vegan</option>
              <option value="jain">Jain</option>
            </select>

            <label className="flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#1F1B16]/25 text-xs font-semibold cursor-pointer">
              <ImagePlus className="w-4 h-4 text-[#E23E3E]" />
              {dishForm.image ? 'Dish Photo Ready' : 'Upload Dish Photo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadSingleImage(file);
                  if (url) setDishForm((prev) => ({ ...prev, image: url }));
                }}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={addingDish}
              className="w-full py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
            >
              {addingDish ? 'Adding...' : 'Add to Menu'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#1F1B16]">
              Current Menu ({menuItems.length})
            </h2>

            {menuItems.length === 0 ? (
              <p className="text-sm text-[#1F1B16]/60 py-6 text-center">
                No dishes added yet. Use the form on the left to build your menu.
              </p>
            ) : (
              <div className="divide-y divide-[#1F1B16]/8">
                {menuItems.map((item) => (
                  <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#1F1B16] truncate">{item.name}</p>
                      <p className="text-xs text-[#1F1B16]/60 capitalize">
                        {item.category} · {item.foodType}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDish(item._id)}
                        aria-label="Delete dish"
                        className="p-2 rounded-lg text-[#1F1B16]/50 hover:text-[#B71C1C] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Owner Reviews Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-[#1F1B16]">
          Recent Guest Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <EmptyState
            title="No guest reviews yet"
            description="Reviews from diners will appear here so you can reply directly."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <ReviewCard
                key={rev._id}
                review={rev}
                canRespond
                onRespond={handleRespondReview}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
