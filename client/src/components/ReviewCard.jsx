import { useState } from 'react';
import { ThumbsUp, Trash2, MessageCircle } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import { FALLBACK_IMAGES, formatRelativeTime } from '../utils/media.js';

export default function ReviewCard({
  review,
  currentUserId,
  canRespond = false,
  onHelpful,
  onDelete,
  onRespond,
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerResponse?.text || '');
  const [submitting, setSubmitting] = useState(false);

  const reviewer = review.user || {};
  const isAuthor = currentUserId && String(reviewer._id) === String(currentUserId);
  const isHelpful =
    currentUserId && (review.helpfulBy || []).some((id) => String(id) === String(currentUserId));

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !onRespond) return;
    setSubmitting(true);
    try {
      await onRespond(review._id, replyText.trim());
      setReplyOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={reviewer.profilePhoto || FALLBACK_IMAGES.story}
            alt={reviewer.name || 'Reviewer'}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGES.story;
            }}
            className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#FFF8F2]"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1F1B16] truncate">
              {reviewer.name || 'Diner'}
            </p>
            <p className="text-xs text-[#1F1B16]/55">
              @{reviewer.username || 'diner'} · {formatRelativeTime(review.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} showValue />
          {isAuthor && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review._id)}
              aria-label="Delete review"
              className="p-1.5 rounded-lg text-[#1F1B16]/50 hover:text-[#B71C1C] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {review.restaurant?.name && (
        <p className="text-xs font-medium text-[#E23E3E]">{review.restaurant.name}</p>
      )}

      <p className="text-sm text-[#1F1B16]/90 leading-relaxed">{review.comment}</p>

      {review.photos?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pt-1">
          {review.photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Review dish"
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-xl object-cover shrink-0"
            />
          ))}
        </div>
      )}

      {review.ownerResponse?.text && (
        <div className="bg-[#FFF8F2] border border-[#1F1B16]/8 rounded-xl p-3.5 space-y-1">
          <p className="text-xs font-semibold text-[#1F1B16]">
            Owner Response · {formatRelativeTime(review.ownerResponse.respondedAt)}
          </p>
          <p className="text-xs sm:text-sm text-[#1F1B16]/80">{review.ownerResponse.text}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#1F1B16]/8">
        <button
          type="button"
          onClick={() => onHelpful?.(review._id)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium min-h-[36px] px-2.5 rounded-xl transition-colors cursor-pointer ${
            isHelpful
              ? 'text-[#E23E3E] bg-[#E23E3E]/8'
              : 'text-[#1F1B16]/65 hover:text-[#1F1B16]'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({review.helpfulBy?.length || 0})
        </button>

        {canRespond && onRespond && (
          <button
            type="button"
            onClick={() => setReplyOpen((r) => !r)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E23E3E] hover:underline min-h-[36px] px-2 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {review.ownerResponse?.text ? 'Edit Reply' : 'Respond'}
          </button>
        )}
      </div>

      {replyOpen && (
        <form onSubmit={handleReplySubmit} className="pt-2 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Write a polite response to this guest..."
            className="w-full rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2] px-3 py-2 text-sm focus:outline-none focus:border-[#E23E3E]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplyOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#1F1B16]/70 hover:bg-[#1F1B16]/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-[#E23E3E] text-white text-xs font-medium hover:bg-[#c83232] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Post Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
