import { Plus, Minus, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGES, formatCurrency } from '../utils/media.js';

const FOOD_TYPE_META = {
  veg: { label: 'Veg', color: 'text-[#2E7D32]', dot: 'bg-[#2E7D32]' },
  'non-veg': { label: 'Non-Veg', color: 'text-[#B71C1C]', dot: 'bg-[#B71C1C]' },
  vegan: { label: 'Vegan', color: 'text-[#2E7D32]', dot: 'bg-[#2E7D32]' },
  jain: { label: 'Jain', color: 'text-[#FFB020]', dot: 'bg-[#FFB020]' },
};

export default function DishCard({
  dish,
  qty = 0,
  onAdd,
  onRemove,
  onSave,
  showRestaurantLink = false,
  reason,
}) {
  const typeMeta = FOOD_TYPE_META[dish.foodType] || FOOD_TYPE_META.veg;
  const img = dish.image || FALLBACK_IMAGES.dish;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] overflow-hidden flex flex-col sm:flex-row">
      <div className="sm:w-36 aspect-[4/3] sm:aspect-square shrink-0 bg-[#FFF8F2] overflow-hidden">
        <img
          src={img}
          alt={dish.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGES.dish;
          }}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 font-medium ${typeMeta.color}`}>
              <span className={`w-2 h-2 rounded-xs ${typeMeta.dot}`} />
              {typeMeta.label} · {dish.category}
            </span>
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(dish)}
                aria-label="Save dish"
                className="p-1.5 rounded-lg text-[#1F1B16]/50 hover:text-[#E23E3E] hover:bg-[#FFF8F2] transition-colors cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>

          <h4 className="font-semibold text-base text-[#1F1B16] mt-1">{dish.name}</h4>
          {dish.description && (
            <p className="text-xs text-[#1F1B16]/65 line-clamp-2 mt-0.5">{dish.description}</p>
          )}
          {showRestaurantLink && dish.restaurant && (
            <Link
              to={`/restaurants/${dish.restaurant._id || dish.restaurant}`}
              className="inline-block text-xs font-medium text-[#E23E3E] hover:underline mt-1"
            >
              {dish.restaurant.name} {dish.restaurant.city ? `· ${dish.restaurant.city}` : ''}
            </Link>
          )}
          {reason && (
            <p className="text-xs text-[#1F1B16]/80 mt-2 pt-2 border-t border-[#1F1B16]/8">
              {reason}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="font-mono text-sm font-semibold text-[#1F1B16] tabular-nums">
            {formatCurrency(dish.price)}
          </span>

          {(onAdd || onRemove) && (
            <div className="flex items-center gap-1">
              {qty > 0 ? (
                <div className="inline-flex items-center rounded-xl border border-[#E23E3E] bg-[#E23E3E]/5">
                  <button
                    type="button"
                    onClick={() => onRemove?.(dish)}
                    aria-label="Decrease quantity"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#E23E3E] hover:bg-[#E23E3E]/10 rounded-l-xl cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-sm font-semibold text-[#1F1B16] tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdd?.(dish)}
                    aria-label="Increase quantity"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#E23E3E] hover:bg-[#E23E3E]/10 rounded-r-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!dish.isAvailable}
                  onClick={() => onAdd?.(dish)}
                  className="px-3.5 py-2 rounded-xl bg-[#E23E3E] text-white text-xs font-medium hover:bg-[#c83232] disabled:opacity-40 transition-colors min-h-[36px] cursor-pointer whitespace-nowrap"
                >
                  {dish.isAvailable ? 'Add to Bill' : 'Unavailable'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
