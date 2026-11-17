import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FALLBACK_IMAGES, formatRelativeTime } from '../utils/media.js';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [postRes, commentRes] = await Promise.all([
        api.get(`/posts/${id}`),
        api.get(`/comments/post/${id}`),
      ]);
      setPost(postRes.data.post);
      setComments(commentRes.data.comments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to comment');
      return;
    }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/comments/post/${id}`, { text: commentText.trim() });
      setComments((prev) => [...prev, data.comment]);
      setPost((p) => (p ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
      setCommentText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setPost((p) => (p ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.error('Sign in to like comments');
      return;
    }
    try {
      const { data } = await api.post(`/comments/${commentId}/like`);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, likeCount: data.likeCount } : c))
      );
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <LoadingSkeleton variant="list" count={2} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState
          title="Story not found"
          description={error || 'This post may have been removed.'}
          action={
            <Link to="/" className="px-5 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-medium">
              Back to Feed
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F1B16]/75 hover:text-[#1F1B16]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      <PostCard
        post={post}
        currentUserId={user?._id}
        onLike={async (pid) => {
          if (!user) return toast.error('Sign in to like');
          const { data } = await api.post(`/posts/${pid}/like`);
          setPost((p) => ({ ...p, isLiked: data.liked, likeCount: data.likeCount }));
        }}
        onSave={async (pid) => {
          if (!user) return toast.error('Sign in to save');
          const { data } = await api.post(`/posts/${pid}/save`);
          setPost((p) => ({ ...p, isSaved: data.saved, saveCount: data.saveCount }));
        }}
      />

      {/* Comments Section */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 space-y-5">
        <h2 className="font-display text-xl font-semibold text-[#1F1B16]">
          Comments ({comments.length})
        </h2>

        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? 'Add a comment...' : 'Sign in to join the conversation'}
            disabled={!user || submitting}
            className="flex-1 rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
          />
          <button
            type="submit"
            disabled={!user || submitting || !commentText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Post
          </button>
        </form>

        {comments.length === 0 ? (
          <p className="text-sm text-[#1F1B16]/60 py-4 text-center">
            No comments yet. Start the discussion!
          </p>
        ) : (
          <div className="divide-y divide-[#1F1B16]/8">
            {comments.map((c) => {
              const isAuthor = user && String(c.author?._id) === String(user._id);
              return (
                <div key={c._id} className="py-3.5 flex items-start gap-3">
                  <img
                    src={c.author?.profilePhoto || FALLBACK_IMAGES.story}
                    alt={c.author?.name || 'User'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGES.story;
                    }}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1F1B16]">
                        {c.author?.name || 'Member'}{' '}
                        <span className="font-normal text-[#1F1B16]/50">
                          · {formatRelativeTime(c.createdAt)}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLikeComment(c._id)}
                          className="inline-flex items-center gap-1 text-xs text-[#1F1B16]/60 hover:text-[#E23E3E] cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{c.likeCount || 0}</span>
                        </button>
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c._id)}
                            aria-label="Delete comment"
                            className="text-[#1F1B16]/45 hover:text-[#B71C1C] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#1F1B16]/85 mt-1">{c.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
