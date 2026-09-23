'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { demoRooms, RoomItem } from '@/lib/data';

export default function FavoritesPage() {
  const router = useRouter();
  const [savedRooms, setSavedRooms] = useState<RoomItem[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('roomfinder_token')) {
      router.replace('/login');
      return;
    }

    const savedIds = JSON.parse(localStorage.getItem('roomfinder_saved_rooms') || '[]') as string[];
    setSavedRooms(demoRooms.filter((room) => savedIds.includes(room._id)));
  }, [router]);

  const removeRoom = (roomId: string) => {
    const savedIds = JSON.parse(localStorage.getItem('roomfinder_saved_rooms') || '[]') as string[];
    const nextIds = savedIds.filter((savedId) => savedId !== roomId);
    localStorage.setItem('roomfinder_saved_rooms', JSON.stringify(nextIds));
    setSavedRooms((rooms) => rooms.filter((room) => room._id !== roomId));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" /> Back to rooms
        </Link>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Your shortlist</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Saved rooms</h1>
            <p className="mt-2 text-slate-600">Keep your favorite rooms together while you compare options.</p>
          </div>
          <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 sm:block">
            {savedRooms.length} saved
          </div>
        </div>

        {savedRooms.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Heart className="mx-auto h-10 w-10 text-emerald-500" />
            <h2 className="mt-4 text-2xl font-bold">No saved rooms yet</h2>
            <p className="mt-2 text-slate-500">Tap Save this room on any room you like.</p>
            <Link href="/#find-rooms" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Explore rooms</Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedRooms.map((room) => (
              <article key={room._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <Link href={`/rooms/${room._id}`}>
                  <img src={room.images[0]} alt={room.title} className="h-52 w-full object-cover" />
                </Link>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{room.roomType}</span>
                      <h2 className="mt-3 text-xl font-bold">{room.title}</h2>
                    </div>
                    <button type="button" onClick={() => removeRoom(room._id)} aria-label={`Remove ${room.title}`} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-emerald-600" />{room.location}</div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold">₹{room.rent.toLocaleString()}<small className="ml-1 text-xs font-normal text-slate-500">/ month</small></span>
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm text-amber-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{room.rating}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
