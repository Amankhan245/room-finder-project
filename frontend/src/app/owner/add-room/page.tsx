'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Home, Plus, ShieldCheck } from 'lucide-react';

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
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export default function AddRoomPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (uploadedImages.length + files.length > 5) {
      setError('You can upload up to 5 room photos.');
      event.target.value = '';
      return;
    }
    setError('');
    try {
      const compressed = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) return reject(new Error('Please select image files only.'));
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read one of the selected photos.'));
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => reject(new Error('Could not open one of the selected photos.'));
          image.onload = () => {
            const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          };
          image.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      })));
      setUploadedImages((current) => [...current, ...compressed]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload photos.');
    } finally {
      event.target.value = '';
    }
  };

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
      setIsOwner(user?.role === 'owner' && Boolean(localStorage.getItem('roomfinder_token')));
      if (user) setForm((previous) => ({ ...previous, contactName: user.name || '', contactPhone: user.phone || '', contactEmail: user.email || '' }));
    } catch {
      setIsOwner(false);
    }
  }, []);

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
      const token = localStorage.getItem('roomfinder_token');
      const response = await fetch(`${API_URL}/rooms${isOwner ? '' : '/submit'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isOwner && token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          rent: Number(form.rent),
          deposit: Number(form.deposit || 0),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
          images: [...uploadedImages, ...form.images.split(',').map((item) => item.trim()).filter(Boolean)],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Room creation failed.');

      setForm(initialForm);
      setUploadedImages([]);
      setSuccess('Room submitted successfully. It will appear after approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" aria-label="Home page" title="Home page" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-500">
          <Home className="h-5 w-5" />
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-rose-50 px-6 py-8 text-slate-900 sm:px-10">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Room listing</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight">Add your room</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-slate-600">Add accurate details so students can find and contact you easily.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 p-6 sm:p-10 lg:grid-cols-2">
            {!isOwner && <>
              <div><label htmlFor="contactName" className="mb-2 block text-sm font-medium text-slate-700">Your name</label><input id="contactName" name="contactName" value={form.contactName} onChange={handleChange} required placeholder="Your full name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" /></div>
              <div><label htmlFor="contactPhone" className="mb-2 block text-sm font-medium text-slate-700">Phone number</label><input id="contactPhone" name="contactPhone" value={form.contactPhone} onChange={handleChange} required type="tel" placeholder="9876543210" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" /></div>
              <div className="lg:col-span-2"><label htmlFor="contactEmail" className="mb-2 block text-sm font-medium text-slate-700">Email (optional)</label><input id="contactEmail" name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" /></div>
            </>}
            <div className="lg:col-span-2">
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">Room title</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} required placeholder="Spacious single room near Lalpur" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Describe the room, nearby places, and house rules" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div>
              <label htmlFor="rent" className="mb-2 block text-sm font-medium text-slate-700">Monthly rent</label>
              <input id="rent" name="rent" value={form.rent} onChange={handleChange} required type="number" min="1" placeholder="5000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>
            <div>
              <label htmlFor="deposit" className="mb-2 block text-sm font-medium text-slate-700">Security deposit</label>
              <input id="deposit" name="deposit" value={form.deposit} onChange={handleChange} type="number" min="0" placeholder="10000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-700">Locality</label>
              <select id="location" name="location" value={form.location} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50">
                {['Lalpur', 'Ratu Road', 'Harmu', 'Morabadi', 'Kanke Road', 'Bariatu', 'Doranda', 'Main Road', 'Upper Bazar', 'Kokar'].map((location) => <option key={location}>{location}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">Full address</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} required placeholder="Street, landmark, Ranchi" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div>
              <label htmlFor="roomType" className="mb-2 block text-sm font-medium text-slate-700">Room type</label>
              <select id="roomType" name="roomType" value={form.roomType} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50">
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
              <select id="furnishing" name="furnishing" value={form.furnishing} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50">
                <option>Fully Furnished</option><option>Semi Furnished</option><option>Unfurnished</option>
              </select>
            </div>

            <div>
              <label htmlFor="roomSize" className="mb-2 block text-sm font-medium text-slate-700">Room size</label>
              <input id="roomSize" name="roomSize" value={form.roomSize} onChange={handleChange} placeholder="180 sq ft" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>
            <div>
              <label htmlFor="floor" className="mb-2 block text-sm font-medium text-slate-700">Floor</label>
              <input id="floor" name="floor" value={form.floor} onChange={handleChange} placeholder="2nd floor" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="amenities" className="mb-2 block text-sm font-medium text-slate-700">Amenities <span className="font-normal text-slate-400">(comma separated)</span></label>
              <input id="amenities" name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, Parking, Power backup" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="roomPhotos" className="mb-2 block text-sm font-medium text-slate-700">Room photos <span className="font-normal text-slate-400">(select up to 5 photos)</span></label>
              <input id="roomPhotos" type="file" accept="image/*" multiple onChange={handleImageSelection} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-semibold file:text-rose-600" />
              {uploadedImages.length > 0 && <div className="mt-3 flex flex-wrap gap-3">{uploadedImages.map((image, index) => <div key={index} className="relative"><img src={image} alt={`Room photo ${index + 1}`} className="h-24 w-28 rounded-lg object-cover" /><button type="button" onClick={() => setUploadedImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute -right-2 -top-2 rounded-full bg-slate-900 px-2 py-1 text-xs text-white" aria-label={`Remove photo ${index + 1}`}>×</button></div>)}</div>}
              <label htmlFor="images" className="mb-2 mt-4 block text-sm font-medium text-slate-700">Or add image URLs <span className="font-normal text-slate-400">(comma separated)</span></label>
              <input id="images" name="images" value={form.images} onChange={handleChange} placeholder="https://example.com/room.jpg" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50" />
            </div>

            <div className="lg:col-span-2 rounded-xl border border-rose-50 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Use Ranchi coordinates unless your room is in another city.</div>
            </div>

            {error && <p className="lg:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            {success && <p className="lg:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{success}</p>}

            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                <Plus className="h-4 w-4" /> {loading ? 'Submitting...' : 'Submit room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
