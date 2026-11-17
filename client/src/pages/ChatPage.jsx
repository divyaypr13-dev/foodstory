import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, ImagePlus, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import MessageBubble from '../components/MessageBubble.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FALLBACK_IMAGES, formatRelativeTime } from '../utils/media.js';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeIdParam = searchParams.get('conversation');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(activeIdParam || '');
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const { data } = await api.get('/chat/conversations');
      const list = data.conversations || [];
      setConversations(list);
      if (!activeConvId && list.length > 0) {
        setActiveConvId(list[0]._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load conversations');
    } finally {
      setLoadingConvs(false);
    }
  }, [activeConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeIdParam) {
      setActiveConvId(activeIdParam);
    }
  }, [activeIdParam]);

  // Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('foodstory_token');
    if (!token) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : window.location.origin);

    const socket = io(socketUrl, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('chat:newMessage', ({ conversationId, message }) => {
      if (conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(conversationId)
            ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
            : c
        )
      );
    });

    socket.on('chat:typing', ({ conversationId, userId, name, isTyping }) => {
      if (conversationId === activeConvId && String(userId) !== String(user?._id)) {
        setTypingUser(isTyping ? `${name} is typing...` : '');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeConvId, user?._id]);

  // Load messages and join room when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    let cancelled = false;

    const loadMessages = async () => {
      setLoadingMsgs(true);
      try {
        const { data } = await api.get(`/chat/conversations/${activeConvId}/messages`);
        if (!cancelled) {
          setMessages(data.messages || []);
          api.post(`/chat/conversations/${activeConvId}/read`).catch(() => {});
        }
      } catch (err) {
        if (!cancelled) toast.error(err.response?.data?.message || 'Failed to load messages');
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    };

    loadMessages();
    socketRef.current?.emit('chat:join', activeConvId);

    return () => {
      cancelled = true;
      socketRef.current?.emit('chat:leave', activeConvId);
      setTypingUser('');
    };
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (val) => {
    setText(val);
    if (!activeConvId || !socketRef.current) return;
    socketRef.current.emit('chat:typing', { conversationId: activeConvId, isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:typing', { conversationId: activeConvId, isTyping: false });
    }, 1200);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;
    setSending(true);
    try {
      const { data } = await api.post(`/chat/conversations/${activeConvId}/messages`, {
        text: text.trim(),
      });
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(data.message._id))) return prev;
        return [...prev, data.message];
      });
      setText('');
      socketRef.current?.emit('chat:typing', { conversationId: activeConvId, isTyping: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Message failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const up = await api.post('/uploads', formData);
      const { data } = await api.post(`/chat/conversations/${activeConvId}/messages`, {
        media: [{ url: up.data.url, type: 'image' }],
      });
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(data.message._id))) return prev;
        return [...prev, data.message];
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image send failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReportMessage = async (messageId) => {
    try {
      await api.post(`/chat/messages/${messageId}/report`, {
        reason: 'Inappropriate or spam message',
      });
      toast.success('Message reported to moderation');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report failed');
    }
  };

  const activeConv = conversations.find((c) => String(c._id) === String(activeConvId));

  const getOtherParticipant = (conv) =>
    (conv?.participants || []).find((p) => String(p._id) !== String(user?._id)) || {};

  if (loadingConvs) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1B16] mb-4">
        Messages
      </h1>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Visit any restaurant page and tap Chat to ask about reservations, allergens, or specials."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[480px]">
          {/* Conversation List */}
          <aside className="md:col-span-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] overflow-y-auto divide-y divide-[#1F1B16]/8">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isSelected = String(conv._id) === String(activeConvId);
              const title = conv.restaurant?.name || other.name || 'Conversation';
              const unread = conv.unreadCounts?.[String(user?._id)] || 0;

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => {
                    setActiveConvId(conv._id);
                    setSearchParams({ conversation: conv._id });
                  }}
                  className={`w-full text-left p-4 flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#FFF8F2]' : 'hover:bg-[#FFF8F2]/60'
                  }`}
                >
                  <img
                    src={conv.restaurant?.photos?.[0] || other.profilePhoto || FALLBACK_IMAGES.restaurant}
                    alt={title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGES.restaurant;
                    }}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1F1B16] truncate">{title}</p>
                      <span className="text-[11px] text-[#1F1B16]/45 shrink-0">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-[#1F1B16]/60 truncate">
                        {conv.lastMessage?.text || 'Start chatting...'}
                      </p>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#E23E3E] text-white text-[10px] font-bold tabular-nums">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Message Window */}
          <section className="md:col-span-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] flex flex-col overflow-hidden">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[#1F1B16]/55">
                Select a conversation to begin
              </div>
            ) : (
              <>
                <div className="px-5 py-3.5 border-b border-[#1F1B16]/8 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-[#1F1B16]">
                      {activeConv.restaurant?.name || getOtherParticipant(activeConv).name}
                    </h2>
                    <p className="text-xs text-[#1F1B16]/55">
                      {typingUser ||
                        (activeConv.restaurant ? 'Restaurant Direct Chat' : 'Foodie Chat')}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FFF8F2]/40">
                  {loadingMsgs ? (
                    <LoadingSkeleton variant="list" count={2} />
                  ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-[#1F1B16]/55 py-10">
                      Say hello to start this conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg._id}
                        message={msg}
                        isOwn={String(msg.sender?._id || msg.sender) === String(user?._id)}
                        onReport={handleReportMessage}
                      />
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-3 sm:p-4 border-t border-[#1F1B16]/8 flex items-center gap-2 bg-white"
                >
                  <label className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#1F1B16]/65 hover:bg-[#FFF8F2] cursor-pointer">
                    <ImagePlus className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageSend}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder={uploading ? 'Uploading photo...' : 'Write a message...'}
                    className="flex-1 rounded-xl border border-[#1F1B16]/15 bg-[#FFF8F2]/60 px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23E3E]"
                  />

                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="min-h-[40px] px-4 rounded-xl bg-[#E23E3E] text-white text-sm font-semibold hover:bg-[#c83232] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
