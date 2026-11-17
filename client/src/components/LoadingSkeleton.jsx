export default function LoadingSkeleton({ variant = 'grid', count = 6 }) {
  if (variant === 'detail') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-64 sm:h-80 bg-[#1F1B16]/10 rounded-2xl" />
        <div className="h-8 w-1/3 bg-[#1F1B16]/10 rounded-lg" />
        <div className="h-4 w-2/3 bg-[#1F1B16]/10 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1F1B16]/10" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-[#1F1B16]/10 rounded" />
                <div className="h-3 w-20 bg-[#1F1B16]/10 rounded" />
              </div>
            </div>
            <div className="h-4 w-5/6 bg-[#1F1B16]/10 rounded" />
            <div className="h-48 w-full bg-[#1F1B16]/10 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="aspect-[4/3] bg-[#1F1B16]/10" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-24 bg-[#1F1B16]/10 rounded" />
            <div className="h-5 w-3/4 bg-[#1F1B16]/10 rounded" />
            <div className="h-3.5 w-1/2 bg-[#1F1B16]/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
