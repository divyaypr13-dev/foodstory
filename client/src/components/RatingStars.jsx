import { Star } from 'lucide-react';

export default function RatingStars({
  rating = 0,
  max = 5,
  size = 'sm',
  interactive = false,
  onChange,
  showValue = false,
}) {
  const iconSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className="inline-flex items-center gap-1">
      <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
        {Array.from({ length: max }).map((_, idx) => {
          const val = idx + 1;
          const filled = val <= Math.round(rating);
          if (interactive) {
            return (
              <button
                key={val}
                type="button"
                onClick={() => onChange?.(val)}
                aria-label={`Rate ${val} out of ${max}`}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg hover:bg-[#FFB020]/15 transition-colors cursor-pointer"
              >
                <Star
                  className={`${iconSize} ${
                    filled ? 'fill-[#FFB020] text-[#FFB020]' : 'text-[#1F1B16]/25'
                  }`}
                />
              </button>
            );
          }
          return (
            <Star
              key={val}
              className={`${iconSize} ${
                filled ? 'fill-[#FFB020] text-[#FFB020]' : 'text-[#1F1B16]/20'
              }`}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-[#1F1B16] tabular-nums ml-1">
          {Number(rating || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}
