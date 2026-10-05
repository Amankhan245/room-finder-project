'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type ChatUser = { _id: string; username: string };
type ChatThread = {
  _id: string;
  room: { title: string };
  student: ChatUser;
  owner: ChatUser;
  messages: { text: string; createdAt: string }[];
  updatedAt: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChats = async (token: string, userId?: string) => {
    const response = await fetch(`${API_URL}/chats`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load chats.');
    setChats(data.chats || []);
    if (userId) setCurrentUserId(userId);
  };

  useEffect(() => {
    const token = localStorage.getItem('roomfinder_token');
    const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${API_URL}/chats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load chats.');
        return data;
      })
      .then((data) => {
        setChats(data.chats || []);
        setCurrentUserId(user?._id || '');
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load chats.'))
      .finally(() => setLoading(false));
  }, [router]);

  const refreshChats = () => {
    const token = localStorage.getItem('roomfinder_token');
    if (!token) return router.replace('/login');
    setLoading(true);
    setError('');
    loadChats(token)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load chats.'))
      .finally(() => setLoading(false));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" aria-label="Back home" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-rose-500"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Room Finder</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Messages</h1>
          </div>
          <button type="button" onClick={refreshChats} aria-label="Refresh messages" title="Refresh messages" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-rose-500"><RefreshCw className="h-4 w-4" /></button>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading && <p className="mt-8 text-sm text-slate-500">Loading chats...</p>}
        {!loading && !error && chats.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-rose-500" />
            <h2 className="mt-4 text-lg font-bold">No conversations yet</h2>
            <p className="mt-2 text-sm text-slate-600">Chats about rooms you contact will appear here.</p>
            <Link href="/" className="mt-5 inline-flex rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">Browse rooms</Link>
          </div>
        )}
        {!loading && chats.length > 0 && (
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 bg-white">
            {chats.map((chat) => {
              const otherUser = chat.student._id === currentUserId ? chat.owner : chat.student;
              const lastMessage = chat.messages[chat.messages.length - 1];
              return (
                <Link key={chat._id} href={`/messages/${chat._id}`} className="flex items-start gap-4 px-4 py-5 transition hover:bg-rose-50/50 sm:px-5">
                  <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"><MessageCircle className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-semibold">@{otherUser.username}</span>
                      <span className="text-xs text-slate-500">{new Date(chat.updatedAt).toLocaleString()}</span>
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">{chat.room.title}</span>
                    <span className="mt-2 block truncate text-sm text-slate-700">{lastMessage?.text || 'Start the conversation'}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}