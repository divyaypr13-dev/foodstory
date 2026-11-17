export const FALLBACK_IMAGES = {
  hero: '/src/assets/images/hero_foodstory_table_1794931648257.jpg',
  dish: '/src/assets/images/dish_signature_bowl_1794931648181.jpg',
  restaurant: '/src/assets/images/restaurant_bistro_interior_1794931648943.jpg',
  story: '/src/assets/images/avatar_chef_portrait_1794931649180.jpg',
};

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCostLevel(level = 2) {
  return '₹'.repeat(Math.min(4, Math.max(1, Number(level) || 2)));
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
