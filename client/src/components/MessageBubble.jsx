import { Flag } from 'lucide-react';
import { formatRelativeTime } from '../utils/media.js';

export default function MessageBubble({ message, isOwn, onReport }) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-1`}>
      <div
        className={`max-w-[78%] sm:max-w-[68%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
          isOwn
            ? 'bg-[#E23E3E] text-white rounded-br-sm'
            : 'bg-white text-[#1F1B16] border border-[#1F1B16]/8 rounded-bl-sm'
        }`}
      >
        {message.media?.length > 0 && (
          <div className="mb-2 space-y-2">
            {message.media.map((m, idx) => (
              <img
                key={idx}
                src={m.url}
                alt="Attachment"
                referrerPolicy="no-referrer"
                className="rounded-xl max-h-56 object-cover"
              />
            ))}
          </div>
        )}

        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
      </div>

      <div className="flex items-center gap-2 px-1 text-[11px] text-[#1F1B16]/50">
        <span>{formatRelativeTime(message.createdAt)}</span>
        {!isOwn && onReport && (
          <button
            type="button"
            onClick={() => onReport(message._id)}
            aria-label="Report message"
            className="hover:text-[#B71C1C] cursor-pointer"
          >
            <Flag className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
