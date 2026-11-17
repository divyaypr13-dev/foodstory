import { X } from 'lucide-react';

const COST_LEVELS = [
  { value: '1', label: '₹' },
  { value: '2', label: '₹₹' },
  { value: '3', label: '₹₹₹' },
  { value: '4', label: '₹₹₹₹' },
];

const FOOD_TYPES = [
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-Veg' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'jain', label: 'Jain' },
];

const FACILITY_OPTIONS = [
  { key: 'parking', label: 'Parking' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'outdoorSeating', label: 'Outdoor Seating' },
  { key: 'wheelchairAccessible', label: 'Wheelchair Access' },
  { key: 'petFriendly', label: 'Pet Friendly' },
];

function FilterFormContent({ filters, onChange, onReset }) {
  const toggleArrayValue = (field, val) => {
    const current = filters[field] || [];
    const next = current.includes(val)
      ? current.filter((item) => item !== val)
      : [...current, val];
    onChange({ ...filters, [field]: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-[#1F1B16]">Filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-[#E23E3E] hover:underline cursor-pointer"
        >
          Reset All
        </button>
      </div>

      {/* Open Now */}
      <label className="flex items-center justify-between cursor-pointer py-1">
        <span className="text-sm font-medium text-[#1F1B16]">Open Now</span>
        <input
          type="checkbox"
          checked={Boolean(filters.openNow)}
          onChange={(e) => onChange({ ...filters, openNow: e.target.checked })}
          className="w-4 h-4 accent-[#E23E3E] rounded cursor-pointer"
        />
      </label>

      {/* Price / Cost Level */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1F1B16]/70">Price Range</p>
        <div className="grid grid-cols-4 gap-2">
          {COST_LEVELS.map((lvl) => {
            const active = (filters.costLevel || []).includes(lvl.value);
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => toggleArrayValue('costLevel', lvl.value)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#E23E3E] text-white border-[#E23E3E]'
                    : 'bg-[#FFF8F2] text-[#1F1B16] border-[#1F1B16]/10 hover:border-[#E23E3E]'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1F1B16]/70">Minimum Rating</p>
        <div className="grid grid-cols-4 gap-2">
          {['', '3.5', '4.0', '4.5'].map((rating) => {
            const active = (filters.minRating || '') === rating;
            return (
              <button
                key={rating || 'any'}
                type="button"
                onClick={() => onChange({ ...filters, minRating: rating })}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                  active
                    ? 'bg-[#E23E3E] text-white border-[#E23E3E]'
                    : 'bg-[#FFF8F2] text-[#1F1B16] border-[#1F1B16]/10 hover:border-[#E23E3E]'
                }`}
              >
                {rating ? `${rating}+` : 'Any'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1F1B16]/70">Dietary Options</p>
        <div className="grid grid-cols-2 gap-2">
          {FOOD_TYPES.map((ft) => {
            const active = (filters.foodType || []).includes(ft.value);
            return (
              <button
                key={ft.value}
                type="button"
                onClick={() => toggleArrayValue('foodType', ft.value)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#E23E3E] text-white border-[#E23E3E]'
                    : 'bg-[#FFF8F2] text-[#1F1B16] border-[#1F1B16]/10 hover:border-[#E23E3E]'
                }`}
              >
                {ft.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1F1B16]/70">Facilities</p>
        <div className="space-y-2">
          {FACILITY_OPTIONS.map((fac) => {
            const checked = (filters.facilities || []).includes(fac.key);
            return (
              <label key={fac.key} className="flex items-center gap-2.5 text-sm text-[#1F1B16] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleArrayValue('facilities', fac.key)}
                  className="w-4 h-4 accent-[#E23E3E] rounded cursor-pointer"
                />
                <span>{fac.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] p-5 self-start sticky top-20">
        <FilterFormContent filters={filters} onChange={onChange} onReset={onReset} />
      </aside>

      {/* Mobile Bottom-Sheet Filter Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="pt-3 pb-2 px-5 border-b border-[#1F1B16]/10">
              <div className="w-10 h-1.5 bg-[#1F1B16]/20 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1F1B16]">Filter Restaurants</span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close filters"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#1F1B16]/60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <FilterFormContent filters={filters} onChange={onChange} onReset={onReset} />
            </div>

            <div className="p-4 border-t border-[#1F1B16]/10 bg-white">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-3 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold cursor-pointer"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
