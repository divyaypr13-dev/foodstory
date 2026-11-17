import { Link } from 'react-router-dom';
import { MapPin, CheckCircle2 } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import { FALLBACK_IMAGES, formatCostLevel } from '../utils/media.js';

export default function RestaurantCard({ restaurant, reason }) {
  const photo = restaurant.photos?.[0] || FALLBACK_IMAGES.restaurant;
  const isOpen = restaurant.isOpenNow;

  return (
    <Link
      to={`/restaurants/${restaurant._id}`}
      className="group block bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] hover:shadow-[0_8px_24px_rgba(31,27,22,0.1)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-[#FFF8F2] overflow-hidden">
        <img
          src={photo}
          alt={restaurant.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGES.restaurant;
          }}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={`font-semibold ${
              isOpen ? 'text-[#2E7D32]' : 'text-[#B71C1C]'
            }`}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
          <span className="text-[#1F1B16]/60 tabular-nums">
            {formatCostLevel(restaurant.costLevel)} · {restaurant.openTime}–{restaurant.closeTime}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[#1F1B16] leading-snug line-clamp-1">
            {restaurant.name}
          </h3>
          {restaurant.isVerified && (
            <CheckCircle2
              className="w-4 h-4 text-[#2E7D32] shrink-0 mt-1"
              title="Verified Restaurant"
            />
          )}
        </div>

        <p className="text-xs text-[#1F1B16]/65 truncate">
          {(restaurant.cuisineTags || []).slice(0, 3).join(' · ') || 'Neighborhood Dining'}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <RatingStars rating={restaurant.ratingAvg || 0} showValue />
            <span className="text-xs text-[#1F1B16]/50 tabular-nums">
              ({restaurant.ratingCount || 0})
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-[#1F1B16]/60 truncate max-w-[130px]">
            <MapPin className="w-3.5 h-3.5 text-[#E23E3E] shrink-0" />
            <span className="truncate">{restaurant.city}</span>
          </span>
        </div>

        {reason && (
          <p className="text-xs text-[#1F1B16]/80 pt-2 border-t border-[#1F1B16]/8 leading-relaxed">
            {reason}
          </p>
        )}
      </div>
    </Link>
  );
}
