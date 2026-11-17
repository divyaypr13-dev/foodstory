import { useState, useEffect, useCallback } from 'react';
import { Check, X, EyeOff, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

export default function AdminDashboard() {
  const [tab, setTab] = useState('verifications');
  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, verRes, usersRes, repRes, postRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/verifications'),
        api.get('/admin/users'),
        api.get('/admin/reports'),
        api.get('/admin/posts'),
      ]);
      setStats(statsRes.data.stats);
      setVerifications(verRes.data.restaurants || []);
      setUsers(usersRes.data.users || []);
      setReports(repRes.data.reports || []);
      setPosts(postRes.data.posts || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load admin console');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleVerification = async (id, action) => {
    try {
      await api.post(`/admin/verifications/${id}`, { action });
      toast.success(`Verification ${action}d`);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      const { data } = await api.post(`/admin/users/${id}/toggle-block`);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isBlocked: data.user.isBlocked } : u))
      );
      toast.success(data.user.isBlocked ? 'User blocked' : 'User unblocked');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleReport = async (id, status) => {
    try {
      await api.post(`/admin/reports/${id}`, { status });
      toast.success(`Report marked ${status}`);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleHidePost = async (id) => {
    try {
      const { data } = await api.post(`/admin/posts/${id}/hide`);
      setPosts((prev) => prev.map((p) => (p._id === id ? data.post : p)));
      toast.success(data.post.isHidden ? 'Post hidden' : 'Post visible');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Post permanently deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1F1B16]">Admin Console</h1>
        <p className="text-sm text-[#1F1B16]/65">
          Verify restaurants, review reports, and moderate platform activity.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Users', val: stats.users },
            { label: 'Restaurants', val: stats.restaurants },
            { label: 'Pending Verify', val: stats.pendingVerifications },
            { label: 'Posts', val: stats.posts },
            { label: 'Reviews', val: stats.reviews },
            { label: 'Open Reports', val: stats.pendingReports },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-xs">
              <p className="text-xs text-[#1F1B16]/60">{s.label}</p>
              <p className="font-display text-2xl font-bold text-[#1F1B16] tabular-nums mt-1">
                {s.val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'verifications', label: `Verifications (${verifications.length})` },
          { id: 'reports', label: `Reports (${reports.length})` },
          { id: 'users', label: `Users (${users.length})` },
          { id: 'posts', label: `Posts (${posts.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              tab === t.id ? 'bg-[#E23E3E] text-white' : 'bg-white text-[#1F1B16]/75'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 overflow-x-auto">
        {tab === 'verifications' && (
          <div className="divide-y divide-[#1F1B16]/8">
            {verifications.length === 0 ? (
              <p className="text-sm text-[#1F1B16]/60 py-6 text-center">No verification requests.</p>
            ) : (
              verifications.map((r) => (
                <div
                  key={r._id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-sm text-[#1F1B16]">{r.name}</p>
                    <p className="text-xs text-[#1F1B16]/60">
                      {r.city} · Owner: {r.owner?.name} ({r.owner?.email}) · Status:{' '}
                      <strong className="capitalize">{r.verificationStatus}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVerification(r._id, 'approve')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerification(r._id, 'reject')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#B71C1C] text-white text-xs font-semibold cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="divide-y divide-[#1F1B16]/8">
            {reports.length === 0 ? (
              <p className="text-sm text-[#1F1B16]/60 py-6 text-center">No reports filed.</p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep._id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1F1B16] flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#E23E3E]" />
                      {rep.targetType} report · <span className="capitalize">{rep.status}</span>
                    </p>
                    <p className="text-xs text-[#1F1B16]/70 mt-0.5">{rep.reason}</p>
                    <p className="text-[11px] text-[#1F1B16]/50">
                      Reported by @{rep.reporter?.username || 'user'}
                    </p>
                  </div>
                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReport(rep._id, 'resolved')}
                        className="px-3 py-1.5 rounded-xl bg-[#E23E3E] text-white text-xs font-semibold cursor-pointer"
                      >
                        Resolve & Hide
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReport(rep._id, 'dismissed')}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF8F2] border border-[#1F1B16]/12 text-xs font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="divide-y divide-[#1F1B16]/8">
            {users.map((u) => (
              <div
                key={u._id}
                className="py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#1F1B16] truncate">
                    {u.name} <span className="font-normal text-[#1F1B16]/55">@{u.username}</span>
                  </p>
                  <p className="text-xs text-[#1F1B16]/60 truncate">
                    {u.email} · {u.role} · {u.isBlocked ? 'Blocked' : 'Active'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleBlock(u._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                    u.isBlocked
                      ? 'bg-[#2E7D32] text-white'
                      : 'bg-[#B71C1C]/10 text-[#B71C1C] hover:bg-[#B71C1C]/20'
                  }`}
                >
                  {u.isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="divide-y divide-[#1F1B16]/8">
            {posts.map((p) => (
              <div
                key={p._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[#1F1B16]/60">
                    @{p.author?.username || 'user'} · {p.isHidden ? 'Hidden' : 'Visible'}
                  </p>
                  <p className="text-sm text-[#1F1B16] line-clamp-2 mt-0.5">{p.caption}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleHidePost(p._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF8F2] border border-[#1F1B16]/12 text-xs font-semibold cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {p.isHidden ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePost(p._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#B71C1C] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
