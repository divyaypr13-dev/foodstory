import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    city: '',
    role: 'customer',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      toast.success('Account created! Welcome to FoodStory');
      navigate(user.role === 'owner' ? '/owner' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_6px_28px_rgba(31,27,22,0.08)] p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-bold text-[#1F1B16]">Join FoodStory</h1>
          <p className="text-sm text-[#1F1B16]/65">
            Create a diner profile or register your restaurant kitchen.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#B71C1C]/8 px-4 py-3 text-sm text-[#B71C1C]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Aarav Mehta"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                placeholder="aarav_eats"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1F1B16]/75">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Bengaluru"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F1B16]/75">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'customer' })}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  form.role === 'customer'
                    ? 'bg-[#E23E3E] text-white border-[#E23E3E]'
                    : 'bg-[#FFF8F2] text-[#1F1B16] border-[#1F1B16]/12'
                }`}
              >
                Food Explorer
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'owner' })}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  form.role === 'owner'
                    ? 'bg-[#E23E3E] text-white border-[#E23E3E]'
                    : 'bg-[#FFF8F2] text-[#1F1B16] border-[#1F1B16]/12'
                }`}
              >
                Restaurant Owner
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#1F1B16]/70">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#E23E3E] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
