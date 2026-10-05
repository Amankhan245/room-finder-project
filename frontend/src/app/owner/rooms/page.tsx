'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Home, Plus, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type OwnerRoom = {
  _id: string;
  title: string;
  location: string;
  rent: number;
  roomType: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  images?: string[];
};

export default function OwnerRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<OwnerRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('roomfinder_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const loadOwnerData = async () => {
      try {
        const meResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const meData = await meResponse.json();
        if (!meResponse.ok) {
          throw new Error(meData.message || 'Session expired.');
        }

        const currentUser = meData.user;
        if (currentUser?.role !== 'owner') {
          router.replace(currentUser?.role === 'admin' ? '/admin' : '/');
          return;
        }

        localStorage.setItem('roomfinder_user', JSON.stringify(currentUser));

        const roomsResponse = await fetch(`${API_URL}/rooms/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const roomsData = await roomsResponse.json();
        if (!roomsResponse.ok) {
          throw new Error(roomsData.message || 'Unable to load your rooms.');
        }

        setRooms(roomsData.rooms || []);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Unable to load your rooms.';
        if (message.toLowerCase().includes('session') || message.toLowerCase().includes('token') || message.toLowerCase().includes('expired')) {
          localStorage.removeItem('roomfinder_token');
          localStorage.removeItem('roomfinder_user');
          router.replace('/login');
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadOwnerData();
  }, [router]);

  const statusDetails = {
    pending: { label: 'Pending approval', icon: Clock3, className: 'bg-amber-50 text-amber-700' },
    approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-700' },
    suspended: { label: 'Suspended', icon: XCircle, className: 'bg-slate-100 text-slate-700' },
  } as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" aria-label="Home page" title="Home page" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-500"><Home className="h-5 w-5" /></Link>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Owner dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">My rooms</h1>
            <p className="mt-2 text-slate-600">Uploaded rooms appear here with their approval status.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/messages" className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-rose-200 hover:text-rose-600">Messages</Link>
            <Link href="/owner/add-room" className="inline-flex w-fit items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-600"><Plus className="h-4 w-4" /> Add room</Link>
          </div>
        </div>

        {loading && <div className="mt-10 rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Loading your rooms...</div>}
        {error && <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>}
        {!loading && !error && rooms.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Home className="mx-auto h-10 w-10 text-rose-500" />
            <h2 className="mt-4 text-2xl font-bold">No rooms uploaded yet</h2>
            <p className="mt-2 text-slate-500">Add your first room and track it here.</p>
          </div>
        )}
        {!loading && !error && rooms.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {rooms.map((room) => {
              const status = statusDetails[room.status];
              const StatusIcon = status.icon;
              return (
                <article key={room._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {room.images?.[0] ? <img src={room.images[0]} alt={room.title} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-rose-50"><Home className="h-10 w-10 text-rose-500" /></div>}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div><h2 className="text-xl font-bold">{room.title}</h2><p className="mt-1 text-sm text-slate-500">{room.location} · {room.roomType}</p></div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}><StatusIcon className="h-3.5 w-3.5" /> {status.label}</span>
                    </div>
                    <p className="mt-4 text-2xl font-bold">₹{room.rent.toLocaleString()}<span className="ml-1 text-xs font-normal text-slate-500">/ month</span></p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
