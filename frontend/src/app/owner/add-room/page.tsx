'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Home, Plus, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const initialForm = {
  title: '',
  description: '',
  rent: '',
  deposit: '',
  location: 'Lalpur',
  address: '',
  latitude: '23.3441',
  longitude: '85.3096',
  roomType: 'Single Room',
  furnishing: 'Semi Furnished',
  availability: 'Available',
  roomSize: '',
  floor: '',
  amenities: '',
  images: '',
};

export default function AddRoomPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
    if (!localStorage.getItem('roomfinder_token') || user?.role !== 'owner') {
      router.replace('/login');
    }
  }, [router]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('roomfinder_token')}`,
        },
        body: JSON.stringify({
          ...form,
          rent: Number(form.rent),
          deposit: Number(form.deposit || 0),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
          images: form.images.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Room creation failed.');

      setForm(initialForm);
      setSuccess('Room submitted successfully. It will appear after approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-slate-900 px-6 py-8 text-white sm:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white"><Home className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Owner dashboard</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight">Add a room</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-slate-300">Add accurate details so students can find and contact you easily.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 p-6 sm:p-10 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">Room title</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} required placeholder="Spacious single room near Lalpur" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Describe the room, nearby places, and house rules" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div>
              <label htmlFor="rent" className="mb-2 block text-sm font-medium text-slate-700">Monthly rent</label>
              <input id="rent" name="rent" value={form.rent} onChange={handleChange} required type="number" min="1" placeholder="5000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>
            <div>
              <label htmlFor="deposit" className="mb-2 block text-sm font-medium text-slate-700">Security deposit</label>
              <input id="deposit" name="deposit" value={form.deposit} onChange={handleChange} type="number" min="0" placeholder="10000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-700">Locality</label>
              <select id="location" name="location" value={form.location} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                {['Lalpur', 'Ratu Road', 'Harmu', 'Morabadi', 'Kanke Road', 'Bariatu', 'Doranda', 'Main Road', 'Upper Bazar', 'Kokar'].map((location) => <option key={location}>{location}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">Full address</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} required placeholder="Street, landmark, Ranchi" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div>
              <label htmlFor="roomType" className="mb-2 block text-sm font-medium text-slate-700">Room type</label>
              <select id="roomType" name="roomType" value={form.roomType} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                <option>Single Room</option>
                <option>Double Room</option>
                <option>PG Room</option>
                <option>Studio Room</option>
                <option>Shared Room</option>
                <option>Family Flat</option>
                <option>Apartment</option>
                <option>Hostel</option>
              </select>
            </div>
            <div>
              <label htmlFor="furnishing" className="mb-2 block text-sm font-medium text-slate-700">Furnishing</label>
              <select id="furnishing" name="furnishing" value={form.furnishing} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                <option>Fully Furnished</option><option>Semi Furnished</option><option>Unfurnished</option>
              </select>
            </div>

            <div>
              <label htmlFor="roomSize" className="mb-2 block text-sm font-medium text-slate-700">Room size</label>
              <input id="roomSize" name="roomSize" value={form.roomSize} onChange={handleChange} placeholder="180 sq ft" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>
            <div>
              <label htmlFor="floor" className="mb-2 block text-sm font-medium text-slate-700">Floor</label>
              <input id="floor" name="floor" value={form.floor} onChange={handleChange} placeholder="2nd floor" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="amenities" className="mb-2 block text-sm font-medium text-slate-700">Amenities <span className="font-normal text-slate-400">(comma separated)</span></label>
              <input id="amenities" name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, Parking, Power backup" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="images" className="mb-2 block text-sm font-medium text-slate-700">Image URLs <span className="font-normal text-slate-400">(comma separated)</span></label>
              <input id="images" name="images" value={form.images} onChange={handleChange} placeholder="https://example.com/room.jpg" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </div>

            <div className="lg:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Use Ranchi coordinates unless your room is in another city.</div>
            </div>

            {error && <p className="lg:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            {success && <p className="lg:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70">
                <Plus className="h-4 w-4" /> {loading ? 'Submitting...' : 'Submit room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
