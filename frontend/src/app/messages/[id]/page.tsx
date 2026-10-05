'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type ChatUser = { _id: string; username: string };
type ChatMessage = { _id: string; author: ChatUser; text: string; createdAt: string };
type ChatThread = {
  _id: string;
  room: { title: string };
  student: ChatUser;
  owner: ChatUser;
  messages: ChatMessage[];
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [chat, setChat] = useState<ChatThread | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('roomfinder_token');
    const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
    if (!token) {
      router.replace('/login');
      return;
    }
    const loadChat = async (initialLoad: boolean, userId: string) => {
      try {
        const response = await fetch(`${API_URL}/chats/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load this chat.');
        setChat(data.chat);
        setCurrentUserId(userId);
        if (initialLoad) setError('');
      } catch (requestError) {
        if (initialLoad) setError(requestError instanceof Error ? requestError.message : 'Unable to load this chat.');
      } finally {
        if (initialLoad) setLoading(false);
      }
    };

    const userId = user?._id || '';
    void loadChat(true, userId);
    const interval = window.setInterval(() => void loadChat(false, userId), 3000);
    return () => window.clearInterval(interval);
  }, [id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = message.trim();
    const token = localStorage.getItem('roomfinder_token');
    if (!text || !token) return;

    setSending(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/chats/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to send message.');
      setChat(data.chat);
      setMessage('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const otherUser = chat && (chat.student._id === currentUserId ? chat.owner : chat.student);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden border border-slate-200 bg-white sm:my-4 sm:rounded-2xl">
        <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <Link href="/messages" aria-label="Back to messages" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="min-w-0">
            <h1 className="truncate font-bold">{otherUser ? `@${otherUser.username}` : 'Conversation'}</h1>
            <p className="truncate text-sm text-slate-500">{chat?.room.title || 'Room chat'}</p>
          </div>
        </header>

        <section aria-live="polite" className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
          {loading && <p className="text-center text-sm text-slate-500">Loading conversation...</p>}
          {error && !chat && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          {chat?.messages.map((entry) => {
            const isOwnMessage = entry.author._id === currentUserId;
            return (
              <div key={entry._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <article className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${isOwnMessage ? 'rounded-br-sm bg-rose-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-900'}`}>
                  <p className={`mb-1 text-xs font-semibold ${isOwnMessage ? 'text-rose-50' : 'text-rose-600'}`}>@{entry.author.username}</p>
                  <p className="whitespace-pre-wrap break-words text-sm">{entry.text}</p>
                  <time className={`mt-2 block text-right text-[11px] ${isOwnMessage ? 'text-rose-50' : 'text-slate-500'}`}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </article>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </section>

        {error && chat && <p role="alert" className="border-t border-red-100 px-4 py-2 text-sm text-red-700">{error}</p>}
        <form onSubmit={sendMessage} className="flex items-end gap-3 border-t border-slate-200 p-3 sm:p-4">
          <label htmlFor="message" className="sr-only">Message</label>
          <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={2} placeholder="Write a message..." className="max-h-32 min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-50" />
          <button type="submit" disabled={sending || !message.trim()} aria-label="Send message" title="Send message" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </main>
  );
}