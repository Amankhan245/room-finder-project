 'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useEffect, useState } from 'react';
import { Home, Bath, BedDouble, MapPin, ShieldCheck, Star, Wifi, CarFront, MessageCircle, Sparkles } from 'lucide-react';
import { demoRooms } from '@/lib/data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fallbackRoom = demoRooms.find((entry) => entry._id === id) ?? demoRooms[0];
  const [room, setRoom] = useState(fallbackRoom);
  const [isSaved, setIsSaved] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [chatError, setChatError] = useState('');

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

  const handleStartChat = async () => {
    const token = localStorage.getItem('roomfinder_token');
    if (!token) {
      router.push('/login');
      return;
    }

    setChatError('');
    setIsStartingChat(true);
    try {
      const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: room._id, message: `Hi, I am interested in ${room.title}. Is it available?` }),
      });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;
      if (response.status === 401) {
        localStorage.removeItem('roomfinder_token');
        localStorage.removeItem('roomfinder_user');
        router.push('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(data?.message || 'Chat service is unavailable. Restart the backend and try again.');
      }
      router.push(`/messages/${data.chat._id}`);
    } catch (requestError) {
      setChatError(requestError instanceof Error ? requestError.message : 'Unable to start chat.');
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Home page" title="Home page" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-500"><Home className="h-5 w-5" /></Link>

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
              <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">{room.roomType}</span>
              {room.ownerDetails?.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified owner
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">{room.title}</h1>

            <div className="mt-3 flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 text-rose-500" />
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
                  <BedDouble className="h-5 w-5 text-rose-500" />
                  <div className="mt-3 text-lg font-bold">{room.roomType}</div>
                  <div className="text-sm text-slate-500">Room Type</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Wifi className="h-5 w-5 text-rose-500" />
                  <div className="mt-3 text-lg font-bold">WiFi</div>
                  <div className="text-sm text-slate-500">Included</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Bath className="h-5 w-5 text-rose-500" />
                  <div className="mt-3 text-lg font-bold">Attached</div>
                  <div className="text-sm text-slate-500">Washroom</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <CarFront className="h-5 w-5 text-rose-500" />
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
                {room.ownerDetails?.name && <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="font-semibold text-slate-900">Owner: {room.ownerDetails.name}</p>{room.ownerDetails.phone && <a className="mt-1 block text-rose-600 hover:text-rose-700 hover:underline" href={`tel:${room.ownerDetails.phone}`}>Call {room.ownerDetails.phone}</a>}{room.ownerDetails.email && <a className="mt-1 block text-rose-600 hover:text-rose-700 hover:underline" href={`mailto:${room.ownerDetails.email}`}>{room.ownerDetails.email}</a>}</div>}
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

              <button type="button" onClick={handleStartChat} disabled={isStartingChat} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-wait disabled:opacity-70"><MessageCircle className="h-4 w-4" /> {isStartingChat ? 'Opening chat...' : 'Chat with owner'}</button>
              {chatError && <p role="alert" className="mt-2 text-sm text-red-600">{chatError}</p>}

              <button onClick={handleSave} className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600">
                {isSaved ? 'Saved room' : 'Save this room'}
              </button>

            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-rose-50 p-6 text-slate-900 shadow-sm">
              <div className="flex items-center gap-2 text-rose-500">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Why choose it</span>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
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
