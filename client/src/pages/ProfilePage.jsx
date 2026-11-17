import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MessageCircle, Store, ShieldCheck, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { FALLBACK_IMAGES } from '../utils/media.js';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [dietaryText, setDietaryText] = useState((user?.dietaryPreferences || []).join(', '));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads', formData);
      setProfilePhoto(data.url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dietaryPreferences = dietaryText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await updateProfile({ name, city, bio, profilePhoto, dietaryPreferences });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={profilePhoto || FALLBACK_IMAGES.story}
              alt={user?.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGES.story;
              }}
              className="w-16 h-16 rounded-full object-cover bg-[#FFF8F2]"
            />
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#E23E3E] text-white flex items-center justify-center cursor-pointer shadow">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#1F1B16]">{user?.name}</h1>
            <p className="text-xs text-[#1F1B16]/60">
              @{user?.username} · {user?.email} · Role: {user?.role}
            </p>
            {uploading && <p className="text-xs text-[#E23E3E] mt-1">Uploading photo...</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#B71C1C]/20 text-[#B71C1C] text-xs font-semibold hover:bg-[#B71C1C]/5 cursor-pointer self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/chat"
          className="bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <MessageCircle className="w-5 h-5 text-[#E23E3E]" />
          <div>
            <p className="text-sm font-semibold text-[#1F1B16]">Messages</p>
            <p className="text-xs text-[#1F1B16]/60">Direct restaurant chat</p>
          </div>
        </Link>

        {(user?.role === 'owner' || user?.role === 'admin') && (
          <Link
            to="/owner"
            className="bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <Store className="w-5 h-5 text-[#2E7D32]" />
            <div>
              <p className="text-sm font-semibold text-[#1F1B16]">Owner Studio</p>
              <p className="text-xs text-[#1F1B16]/60">Manage menu & reviews</p>
            </div>
          </Link>
        )}

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="bg-white rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <ShieldCheck className="w-5 h-5 text-[#E23E3E]" />
            <div>
              <p className="text-sm font-semibold text-[#1F1B16]">Admin Console</p>
              <p className="text-xs text-[#1F1B16]/60">Moderation & verify</p>
            </div>
          </Link>
        )}
      </div>

      {/* Edit Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-6 space-y-4"
      >
        <h2 className="font-display text-xl font-semibold text-[#1F1B16]">Edit Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1F1B16]/75">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1F1B16]/75">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1F1B16]/75">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow diners what you love eating..."
            className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1F1B16]/75">
            Dietary Preferences (comma separated)
          </label>
          <input
            type="text"
            value={dietaryText}
            onChange={(e) => setDietaryText(e.target.value)}
            placeholder="veg, spicy, wood-fired"
            className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
