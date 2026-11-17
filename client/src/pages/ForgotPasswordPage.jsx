import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedHint, setGeneratedHint] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      if (data.resetToken) {
        setGeneratedHint(data.resetToken);
        setToken(data.resetToken);
      }
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate reset token');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_6px_28px_rgba(31,27,22,0.08)] p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-bold text-[#1F1B16]">
            {step === 'request' ? 'Reset password' : 'Set new password'}
          </h1>
          <p className="text-sm text-[#1F1B16]/65">
            {step === 'request'
              ? 'Enter your account email to receive a password reset token.'
              : 'Enter the reset token and choose a new password.'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#B71C1C]/8 px-4 py-3 text-sm text-[#B71C1C]">
            {error}
          </div>
        )}

        {generatedHint && (
          <div className="rounded-xl bg-[#FFB020]/15 border border-[#FFB020]/40 p-3.5 text-xs text-[#1F1B16]">
            <p className="font-semibold mb-1">Reset Token Generated:</p>
            <code className="font-mono break-all select-all">{generatedHint}</code>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Generating Token...' : 'Send Reset Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#E23E3E]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F1B16]/75">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#1F1B16]/70">
          <Link to="/login" className="font-semibold text-[#E23E3E] hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
