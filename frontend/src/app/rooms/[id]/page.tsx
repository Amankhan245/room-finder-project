 'use client';

import Link from 'next/link';
import { use } from 'react';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bath, BedDouble, MapPin, ShieldCheck, Star, Wifi, CarFront, Sparkles } from 'lucide-react';
import { demoRooms } from '@/lib/data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const fallbackRoom = demoRooms.find((entry) => entry._id === id) ?? demoRooms[0];
  const [room, setRoom] = useState(fallbackRoom);
  const [isSaved, setIsSaved] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/rooms/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Room API unavailable');
        const data = await response.json();
        if (data.room) setRoom(data.room);
      })
      .catch(() => setRoom(fallbackRoom));
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('roomfinder_token');
    if (!token) return;

    fetch(`${API_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((data) => setIsSaved(Boolean(data.favorites?.some((favorite: { room?: { _id?: string } }) => favorite.room?._id === room._id))))
      .catch(() => {
        const savedRooms = JSON.parse(localStorage.getItem('roomfinder_saved_rooms') || '[]') as string[];
        setIsSaved(savedRooms.includes(room._id));
      });
  }, [room._id]);

  const handleSave = async () => {
    const savedRooms = JSON.parse(localStorage.getItem('roomfinder_saved_rooms') || '[]') as string[];
    const nextSavedRooms = savedRooms.includes(room._id)
      ? savedRooms.filter((savedId) => savedId !== room._id)
      : [...savedRooms, room._id];

    const token = localStorage.getItem('roomfinder_token');
    if (token) {
      try {
        await fetch(`${API_URL}/favorites${savedRooms.includes(room._id) ? `/${room._id}` : ''}`, {
          method: savedRooms.includes(room._id) ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          ...(savedRooms.includes(room._id) ? {} : { body: JSON.stringify({ roomId: room._id }) }),
        });
      } catch {
        // Keep the local fallback when the API is unavailable.
      }
    }

    localStorage.setItem('roomfinder_saved_rooms', JSON.stringify(nextSavedRooms));
    setIsSaved(nextSavedRooms.includes(room._id));
  };

  const handleContact = () => {
    setContactSent(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" />
          Back to rooms
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {room.images.map((image, index) => (
              <img
                key={`${room._id}-${index}`}
                src={image}
                alt={room.title}
                className={`h-64 w-full rounded-2xl object-cover ${index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{room.roomType}</span>
              {room.ownerDetails?.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified owner
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">{room.title}</h1>

            <div className="mt-3 flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>{room.address}</span>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {room.rating}
              </div>
              <span className="text-sm text-slate-600">{room.reviewCount} reviews</span>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight">About this room</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{room.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <BedDouble className="h-5 w-5 text-emerald-600" />
                  <div className="mt-3 text-lg font-bold">{room.roomType}</div>
                  <div className="text-sm text-slate-500">Room Type</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Wifi className="h-5 w-5 text-emerald-600" />
                  <div className="mt-3 text-lg font-bold">WiFi</div>
                  <div className="text-sm text-slate-500">Included</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Bath className="h-5 w-5 text-emerald-600" />
                  <div className="mt-3 text-lg font-bold">Attached</div>
                  <div className="text-sm text-slate-500">Washroom</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <CarFront className="h-5 w-5 text-emerald-600" />
                  <div className="mt-3 text-lg font-bold">Parking</div>
                  <div className="text-sm text-slate-500">Available</div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:pt-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Starting from</div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-black text-slate-900">₹{room.rent.toLocaleString()}</span>
                <span className="pb-2 text-slate-500">/ month</span>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Deposit</span>
                  <span className="font-semibold text-slate-900">₹{room.deposit.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Furnishing</span>
                  <span className="font-semibold text-slate-900">{room.furnishing}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Location</span>
                  <span className="font-semibold text-slate-900">{room.location}</span>
                </div>
              </div>

              <button onClick={handleContact} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
                {contactSent ? 'Contact request sent' : 'Contact owner'}
              </button>

              <button onClick={handleSave} className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
                {isSaved ? 'Saved room' : 'Save this room'}
              </button>

              {contactSent && <p className="mt-3 text-center text-xs text-emerald-700">The owner will respond to your account shortly.</p>}
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Why choose it</span>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li>• Verified by Room Finder quality team</li>
                <li>• Clean and secure living environment</li>
                <li>• Close to transport and essential services</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
