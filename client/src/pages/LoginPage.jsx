import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back to FoodStory');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_6px_28px_rgba(31,27,22,0.08)] p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-bold text-[#1F1B16]">Sign in</h1>
          <p className="text-sm text-[#1F1B16]/65">
            Share food stories, estimate bills, and chat with local kitchens.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#B71C1C]/8 px-4 py-3 text-sm text-[#B71C1C]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#1F1B16]/75">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#1F1B16]/75">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#E23E3E] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#1F1B16]/70">
          New to FoodStory?{' '}
          <Link to="/register" className="font-semibold text-[#E23E3E] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
