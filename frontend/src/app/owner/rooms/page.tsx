'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Home, Plus, XCircle } from 'lucide-react';

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
    const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
    if (!token || user?.role !== 'owner') {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/rooms/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load your rooms.');
        setRooms(data.rooms || []);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load your rooms.'))
      .finally(() => setLoading(false));
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
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Back to home</Link>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Owner dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">My rooms</h1>
            <p className="mt-2 text-slate-600">Uploaded rooms appear here with their approval status.</p>
          </div>
          <Link href="/owner/add-room" className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add room</Link>
        </div>

        {loading && <div className="mt-10 rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Loading your rooms...</div>}
        {error && <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>}
        {!loading && !error && rooms.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Home className="mx-auto h-10 w-10 text-emerald-500" />
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
                  {room.images?.[0] ? <img src={room.images[0]} alt={room.title} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-emerald-50"><Home className="h-10 w-10 text-emerald-500" /></div>}
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
