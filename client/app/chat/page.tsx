'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Users,
  Search,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Car,
  Train,
  Sparkles,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api, USE_MOCKS } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Conversation, Message } from '@docs/types';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get('id');
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(targetConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load conversation threads
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.chat.listConversations();
      setConversations(data || []);
      if (!activeConvId && data && data.length > 0) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [activeConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Sync active conversation with URL param if it changes
  useEffect(() => {
    if (targetConvId && targetConvId !== activeConvId) {
      setActiveConvId(targetConvId);
    }
  }, [targetConvId, activeConvId]);

  // Load message history for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const data = await api.chat.getMessages(convId);
      setMessages(data || []);
      setTimeout(() => scrollToBottom('auto'), 50);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, loadMessages]);

  // ==============================================================
  // SOCKET.IO REAL-TIME + POLLING FALLBACK (MANDATORY REQUIREMENT)
  // ==============================================================
  useEffect(() => {
    if (!activeConvId) return;

    let socket: ReturnType<typeof getSocket> | null = null;

    try {
      socket = getSocket();
      if (socket) {
        if (!socket.connected) {
          socket.connect();
        }

        // Join active conversation room
        socket.emit('chat:join', activeConvId);

        const handleIncomingMessage = (newMsg: Message) => {
          if (newMsg.conversationId === activeConvId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom('smooth'), 50);
          }

          // Update last message in conversation list
          setConversations((prev) =>
            prev.map((c) =>
              c.id === newMsg.conversationId
                ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
                : c
            )
          );
        };

        socket.on('message:new', handleIncomingMessage);

        return () => {
          socket?.emit('chat:leave', activeConvId);
          socket?.off('message:new', handleIncomingMessage);
        };
      }
    } catch (err) {
      console.warn('[Chat] Socket connection warning:', err);
    }

    // Polling fallback when in mock mode or socket is disconnected
    const pollingInterval = setInterval(async () => {
      try {
        const fresh = await api.chat.getMessages(activeConvId);
        setMessages((prev) => {
          if (fresh.length !== prev.length) {
            setTimeout(() => scrollToBottom('smooth'), 50);
            return fresh;
          }
          return prev;
        });
      } catch (e) {
        // ignore poll errors
      }
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [activeConvId]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId || sending) return;

    const content = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      const sent = await api.chat.sendMessage(activeConvId, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setTimeout(() => scrollToBottom('smooth'), 50);

      // Update conversations list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, lastMessage: sent, updatedAt: sent.createdAt }
            : c
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setInputText(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  // Typing-friendly Enter key handler (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Helper to format peer info for active conversation
  const getPeerInfo = (conv: Conversation) => {
    if (conv.isGroup) {
      return {
        name: conv.title || 'Ride Group Chat',
        subtitle: `${conv.participantIds.length} members • Ride Group`,
        avatarUrl: null,
        isGroup: true,
      };
    }
    const peer = conv.participants?.find((p) => p.id !== user?.id) || conv.participants?.[0];
    return {
      name: peer?.name || 'Classmate',
      subtitle: [peer?.department, peer?.year].filter(Boolean).join(' • ') || 'Verified Student',
      avatarUrl: peer?.avatarUrl || null,
      isGroup: false,
    };
  };

  const filteredConversations = conversations.filter((conv) => {
    const info = getPeerInfo(conv);
    return info.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[500px] flex rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden animate-in fade-in duration-300">
        {/* ============================================================== */}
        {/* LEFT COLUMN: CONVERSATION LIST */}
        {/* ============================================================== */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0 ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-base text-neutral-900 dark:text-white">Messages</h2>
              </div>
              <span className="text-xs font-semibold text-neutral-400">
                {conversations.length} threads
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 animate-pulse" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-600 dark:text-neutral-300">No conversations</p>
                <p>Start a chat with a train buddy or join a campus ride to connect.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const info = getPeerInfo(conv);
                const isSelected = activeConvId === conv.id;
                const lastMsg = conv.lastMessage;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left flex items-start gap-3 p-4 transition-all ${
                      isSelected
                        ? 'bg-[#FDF4F1]/70 dark:bg-[#2a1410]/40 border-l-4 border-[#B9573B]'
                        : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {info.isGroup ? (
                        <div className="w-11 h-11 rounded-2xl bg-[#B9573B] text-white flex items-center justify-center font-bold shadow-xs">
                          <Car className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={
                            info.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${info.name}`
                          }
                          alt={info.name}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-[#B9573B]/20"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                          {info.name}
                        </h3>
                        {lastMsg && (
                          <span className="text-[10px] text-neutral-400 shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {lastMsg ? lastMsg.content : 'No messages yet'}
                      </p>

                      <div className="text-[10px] text-neutral-400 mt-1 truncate">
                        {info.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: ACTIVE CHAT SCREEN */}
        {/* ============================================================== */}
        <div className={`flex-1 flex flex-col min-w-0 ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              {(() => {
                const info = getPeerInfo(activeConversation);
                return (
                  <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setActiveConvId(null)}
                        className="md:hidden p-1.5 -ml-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div className="relative shrink-0">
                        {info.isGroup ? (
                          <div className="w-10 h-10 rounded-2xl bg-[#B9573B] text-white flex items-center justify-center font-bold shadow-xs">
                            <Car className="w-5 h-5" />
                          </div>
                        ) : (
                          <img
                            src={
                              info.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${info.name}`
                            }
                            alt={info.name}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#B9573B]/20"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                          {info.name}
                        </h2>
                        <p className="text-xs text-neutral-500 truncate">{info.subtitle}</p>
                      </div>
                    </div>

                    {/* Privacy Indicator Badge (MANDATORY REQUIREMENT: Contact details never exposed) */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF4F1] dark:bg-[#2a1410]/50 border border-[#E8DED5] dark:border-[#B9573B]/30 text-[#8f3f27] dark:text-[#d4795c] text-[11px] font-semibold shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Contact details hidden</span>
                    </div>
                  </div>
                );
              })()}

              {/* Message Bubbles Area (MANDATORY REQUIREMENT: Auto-scroll & Timestamps) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-neutral-50/40 dark:bg-neutral-950/30">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-neutral-400 animate-pulse">Loading message history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                    <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      No messages here yet
                    </p>
                    <p className="text-xs text-neutral-400 max-w-xs">
                      Send a message below to coordinate ride details or train travel.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const senderName = msg.sender?.name || (isMe ? 'You' : 'Classmate');

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender Name for group chats */}
                        {!isMe && activeConversation.isGroup && (
                          <span className="text-[10px] font-bold text-neutral-500 mb-1 pl-1">
                            {senderName}
                          </span>
                        )}

                        {/* Bubble */}
                        <div
                          className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-xs break-words text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#B9573B] text-white rounded-tr-xs'
                              : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700/80 rounded-tl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp (MANDATORY REQUIREMENT) */}
                        <span className="text-[10px] text-neutral-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing-Friendly Input Area (MANDATORY REQUIREMENT) */}
              <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Press Enter to send)"
                      className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B9573B] resize-none max-h-32 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-3 rounded-2xl bg-[#B9573B] hover:bg-[#a34e34] text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
              <h3 className="font-bold text-base text-neutral-700 dark:text-neutral-300">
                Select a Conversation
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                Choose a conversation from the left to start coordinating your train journeys and ride shares.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ChatPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-neutral-400">Loading Campus Chat...</div>}>
      <ChatContent />
    </React.Suspense>
  );
}
