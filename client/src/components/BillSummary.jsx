import { X, Receipt, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/media.js';

export default function BillSummary({
  isOpen,
  onClose,
  billData,
  loading,
  error,
  onClear,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1B16]/10">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#E23E3E]" />
            <h3 className="font-display text-lg font-semibold text-[#1F1B16]">
              Estimated Bill Summary
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bill modal"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#1F1B16]/60 hover:bg-[#FFF8F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse py-4">
              <div className="h-4 bg-[#1F1B16]/10 rounded w-3/4" />
              <div className="h-4 bg-[#1F1B16]/10 rounded w-2/3" />
              <div className="h-10 bg-[#1F1B16]/10 rounded w-full mt-4" />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-[#B71C1C]/8 p-4 text-sm text-[#B71C1C]">
              {error}
            </div>
          ) : !billData ? (
            <p className="text-sm text-[#1F1B16]/65 py-6 text-center">
              Add dishes from the menu to calculate an estimated bill.
            </p>
          ) : (
            <>
              <div className="text-xs text-[#1F1B16]/65">
                {billData.restaurant?.name} · Rates verified on server
              </div>

              <div className="divide-y divide-[#1F1B16]/8">
                {billData.items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="py-3 flex items-start justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#1F1B16]">
                        {item.name} × <span className="tabular-nums">{item.qty}</span>
                      </p>
                      <p className="text-xs text-[#1F1B16]/55 tabular-nums">
                        {formatCurrency(item.unitPrice)} each · GST {item.gstRate}% (
                        {formatCurrency(item.gstAmount)})
                      </p>
                    </div>
                    <span className="font-mono font-medium text-[#1F1B16] tabular-nums shrink-0">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#FFF8F2] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#1F1B16]/75">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(billData.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#1F1B16]/75">
                  <span>GST Total</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(billData.gstTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#1F1B16]/75">
                  <span>Service Charge ({billData.serviceChargeRate}%)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(billData.serviceCharge)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#1F1B16]/12 flex justify-between text-base font-bold text-[#1F1B16]">
                  <span>Estimated Grand Total</span>
                  <span className="font-mono text-[#E23E3E] tabular-nums">
                    {formatCurrency(billData.grandTotal)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-center text-[#1F1B16]/60 pt-1">
                {billData.disclaimer || 'Estimated Bill — not an official invoice'}
              </p>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#1F1B16]/10 flex items-center justify-between gap-3 bg-white">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-[#B71C1C] hover:bg-[#B71C1C]/8 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Selection
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2.5 rounded-xl bg-[#1F1B16] text-white text-sm font-medium hover:bg-[#1F1B16]/90 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
