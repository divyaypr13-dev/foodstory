import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Flag, MapPin, Trash2 } from 'lucide-react';
import { FALLBACK_IMAGES, formatRelativeTime } from '../utils/media.js';

export default function PostCard({
  post,
  currentUserId,
  onLike,
  onSave,
  onReport,
  onDelete,
  onFollow,
}) {
  const author = post.author || {};
  const isOwner = currentUserId && String(author._id) === String(currentUserId);
  const firstMedia = post.media?.[0];

  return (
    <article className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] overflow-hidden">
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={author.profilePhoto || FALLBACK_IMAGES.story}
            alt={author.name || 'FoodStory User'}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGES.story;
            }}
            className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#FFF8F2]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[#1F1B16] truncate">
                {author.name || 'Foodie'}
              </span>
              {post.isOfficial && (
                <span className="text-xs font-semibold text-[#2E7D32]">· Official</span>
              )}
            </div>
            <p className="text-xs text-[#1F1B16]/55 truncate">
              @{author.username || 'member'} · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isOwner && onFollow && author._id && (
            <button
              type="button"
              onClick={() => onFollow(author._id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#E23E3E] hover:bg-[#E23E3E]/8 transition-colors cursor-pointer"
            >
              Follow
            </button>
          )}
          {isOwner && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(post._id)}
              aria-label="Delete post"
              className="p-2 rounded-xl text-[#1F1B16]/50 hover:text-[#B71C1C] hover:bg-[#FFF8F2] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {firstMedia?.url && (
        <Link to={`/posts/${post._id}`} className="block bg-[#FFF8F2]">
          <img
            src={firstMedia.url}
            alt="Food story"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGES.dish;
            }}
            className="w-full max-h-[440px] object-cover"
          />
        </Link>
      )}

      <div className="p-4 sm:p-5 space-y-3">
        {post.restaurantTag && (
          <Link
            to={`/restaurants/${post.restaurantTag._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E23E3E] hover:underline"
          >
            <MapPin className="w-3.5 h-3.5" />
            {post.restaurantTag.name}
            {post.restaurantTag.city ? ` · ${post.restaurantTag.city}` : ''}
          </Link>
        )}

        <Link to={`/posts/${post._id}`} className="block">
          <p className="text-sm sm:text-[15px] text-[#1F1B16] leading-relaxed whitespace-pre-line">
            {post.caption}
          </p>
        </Link>

        {post.hashtags?.length > 0 && (
          <p className="text-xs text-[#1F1B16]/60">
            {post.hashtags.map((h) => `#${h}`).join(' · ')}
          </p>
        )}

        <div className="pt-2 border-t border-[#1F1B16]/8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLike?.(post._id)}
              className={`inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                post.isLiked
                  ? 'text-[#E23E3E]'
                  : 'text-[#1F1B16]/70 hover:text-[#E23E3E]'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-[#E23E3E]' : ''}`} />
              <span className="tabular-nums">{post.likeCount || 0}</span>
            </button>

            <Link
              to={`/posts/${post._id}`}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-xl text-xs font-medium text-[#1F1B16]/70 hover:text-[#1F1B16] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="tabular-nums">{post.commentCount || 0}</span>
            </Link>

            <button
              type="button"
              onClick={() => onSave?.(post._id)}
              className={`inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                post.isSaved
                  ? 'text-[#FFB020]'
                  : 'text-[#1F1B16]/70 hover:text-[#FFB020]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-[#FFB020]' : ''}`} />
              <span className="tabular-nums">{post.saveCount || 0}</span>
            </button>
          </div>

          {onReport && !isOwner && (
            <button
              type="button"
              onClick={() => onReport(post._id)}
              aria-label="Report post"
              className="min-h-[40px] px-2 rounded-xl text-xs text-[#1F1B16]/50 hover:text-[#B71C1C] transition-colors cursor-pointer"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
