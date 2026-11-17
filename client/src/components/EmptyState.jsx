export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.05)] p-10 text-center max-w-lg mx-auto my-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#FFF8F2] text-[#E23E3E] flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-[#1F1B16] mb-2">{title}</h3>
      <p className="text-sm text-[#1F1B16]/70 leading-relaxed mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
