'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Send,
  Users,
  Search,
  Clock,
  Sparkles,
  ShieldCheck,
  Radio,
  Car,
  Train,
  CheckCheck
} from 'lucide-react';
import { chatApi } from '@/lib/api';
import { getSocket, isMockMode } from '@/lib/socket';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import type { Conversation, Message } from '@docs/types';

export interface ExtendedConversation extends Conversation {
  isGroup?: boolean;
  title?: string | null;
  rideId?: string | null;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('id');

  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ExtendedConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      setLoadingConvs(true);
      const convs = await chatApi.getConversations();
      setConversations(convs);

      // Handle preselection
      if (preselectedId) {
        const found = convs.find((c) => c.id === preselectedId);
        if (found) {
          selectConversation(found);
          return;
        }
      }

      if (convs.length > 0 && !activeConv) {
        selectConversation(convs[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }

  async function selectConversation(conv: ExtendedConversation) {
    setActiveConv(conv);
    try {
      setLoadingMessages(true);
      const msgs = await chatApi.getMessages(conv.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }

  // Socket.io integration with Polling fallback for mocks
  useEffect(() => {
    if (!activeConv) return;

    if (!isMockMode) {
      const socket = getSocket();
      if (socket) {
        setSocketConnected(socket.connected);
        socket.emit('chat:join', activeConv.id);

        const handleNewMessage = (newMsg: Message) => {
          if (newMsg.conversationId === activeConv.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        };

        socket.on('message:new', handleNewMessage);
        socket.on('connect', () => setSocketConnected(true));
        socket.on('disconnect', () => setSocketConnected(false));

        return () => {
          socket.emit('chat:leave', activeConv.id);
          socket.off('message:new', handleNewMessage);
        };
      }
    }

    // Polling fallback when mocks are on (or if socket is unavailable)
    const interval = setInterval(async () => {
      try {
        const fresh = await chatApi.getMessages(activeConv.id);
        setMessages((prev) => {
          if (fresh.length !== prev.length) return fresh;
          return prev;
        });
      } catch (e) {
        // ignore polling errors
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeConv?.id]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const content = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      const sent = await chatApi.sendMessage(activeConv.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: sent, updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Could not send message.');
      setInputText(content);
    } finally {
      setSending(false);
    }
  }

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = c.participants?.find((p) => p.id !== user?.id);
    return (
      c.title?.toLowerCase().includes(q) ||
      other?.name?.toLowerCase().includes(q) ||
      c.lastMessage?.content?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-[calc(100vh-140px)] min-h-[550px] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col md:flex-row">
      {/* ============================================================== */}
      {/* LEFT: CONVERSATIONS SIDEBAR */}
      {/* ============================================================== */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Campus Messages</span>
            </h1>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : isMockMode
                    ? 'bg-amber-400'
                    : 'bg-neutral-400'
                }`}
              />
              <span>{isMockMode ? 'Mock Polling' : socketConnected ? 'Live Socket' : 'Polling'}</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats, rides, or peers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {loadingConvs ? (
            <div className="p-8 text-center text-xs text-neutral-400">Loading conversations...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageCircle className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <p className="text-xs text-neutral-500">No conversations yet.</p>
              <p className="text-[11px] text-neutral-400">
                Post on Train Buddy or join a Ride to start a chat!
              </p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              const isRideGroup = conv.isGroup || Boolean(conv.rideId);
              const other = conv.participants?.find((p) => p.id !== user?.id) || conv.participants?.[0];
              const title = isRideGroup ? conv.title || 'Ride Share Group' : other?.name || 'Fellow Student';

              const timeStr = conv.lastMessage
                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-3.5 transition-all cursor-pointer flex items-center gap-3 relative ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600 dark:border-emerald-400'
                      : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {isRideGroup ? (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Car className="w-5 h-5" />
                      </div>
                    ) : (
                      <img
                        src={other?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={title}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                      />
                    )}
                  </div>

                  {/* Title & snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                        {title}
                      </span>
                      {timeStr && (
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-1">
                          {timeStr}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 truncate">
                      {conv.lastMessage?.content || 'No messages yet. Say hello!'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* RIGHT: ACTIVE CHAT SCREEN */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col bg-white dark:bg-neutral-900 min-w-0">
        {activeConv ? (
          <>
            {/* Chat Screen Header */}
            <div className="px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg shrink-0">
                  {activeConv.isGroup || activeConv.rideId ? '≡ƒÜù' : '≡ƒÄô'}
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    {activeConv.title || activeConv.participants?.find((p) => p.id !== user?.id)?.name || 'Direct Chat'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Contact privacy protected ΓÇó Verified Student</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Bubble Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3.5 bg-neutral-50/30 dark:bg-neutral-950/30">
              {loadingMessages ? (
                <div className="p-12 text-center text-xs text-neutral-400">Loading message history...</div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Start the Conversation</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Plan your departure time, luggage, or coordinate meetup spots.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = user ? (msg.senderId === user.id) : false;
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Sender label for group chats */}
                      {!isMe && (activeConv.isGroup || activeConv.rideId) && (
                        <span className="text-[10px] font-semibold text-neutral-500 px-1">
                          {msg.sender?.name || 'Passenger'}
                        </span>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/80 dark:border-neutral-700/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Timestamp & read receipt */}
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono px-1">
                        <span>{timeStr}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing-Friendly Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Type a message... (Press Enter to send)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 space-y-3">
            <MessageCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300 text-base">Select a Conversation</h3>
            <p className="text-xs text-neutral-500 max-w-sm">
              Choose an existing chat thread or start a conversation with a train buddy or ride group!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[550px] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-12 text-center flex items-center justify-center text-sm text-neutral-400">
          Loading Campus Messages...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
