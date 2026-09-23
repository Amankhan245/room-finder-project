'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, Star, ShieldCheck, Users, Home, Building2, ArrowRight, CheckCircle2, Heart } from 'lucide-react';
import { demoRooms, locations } from '@/lib/data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Find Rooms', href: '#find-rooms' },
  { label: 'Locations', href: '#locations' },
  { label: 'Map', href: '#map' },
  { label: 'About', href: '#about' },
];

const budgetRanges: Record<string, [number, number]> = {
  '₹3k - ₹8k': [3000, 8000],
  '₹3k - ₹5k': [3000, 5000],
  '₹5k - ₹8k': [5000, 8000],
  '₹8k+': [8000, Number.MAX_SAFE_INTEGER],
};

export default function HomePage() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState('Choose locality');
  const [selectedBudget, setSelectedBudget] = useState('₹3k - ₹8k');
  const [selectedRoomType, setSelectedRoomType] = useState('Single Room');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [rooms, setRooms] = useState(demoRooms);

  useEffect(() => {
    if (!localStorage.getItem('roomfinder_token')) {
      router.replace('/login');
      return;
    }

    setIsLoggedIn(true);
    try {
      const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
      setIsOwner(user?.role === 'owner');
      setIsAdmin(user?.role === 'admin');
    } catch {
      setIsOwner(false);
      setIsAdmin(false);
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    fetch(`${API_URL}/rooms`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Rooms API unavailable');
        const data = await response.json();
        if (Array.isArray(data.rooms) && data.rooms.length > 0) setRooms(data.rooms);
      })
      .catch(() => {
        setRooms(demoRooms);
      });
  }, [authChecked]);

  const handleLogout = () => {
    localStorage.removeItem('roomfinder_token');
    localStorage.removeItem('roomfinder_user');
    setIsLoggedIn(false);
    router.replace('/login');
  };

  const filteredRooms = useMemo(() => {
    const [minBudget, maxBudget] = budgetRanges[selectedBudget] ?? [0, Number.MAX_SAFE_INTEGER];

    return rooms.filter((room) => {
      const matchesLocation = selectedLocation === 'Choose locality' || room.location === selectedLocation;
      const matchesBudget = room.rent >= minBudget && room.rent <= maxBudget;
      const matchesType = room.roomType === selectedRoomType;
      return matchesLocation && matchesBudget && matchesType;
    });
  }, [rooms, selectedBudget, selectedLocation, selectedRoomType]);

  const visibleRooms = hasSearched ? filteredRooms : rooms;

  if (!authChecked) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Checking your account...</main>;
  }

  const handleSearch = () => {
    setHasSearched(true);
    document.getElementById('find-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <main id="home" className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Room Finder</div>
            </div>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
                {item.label}
              </Link>
            ))}
            {isOwner && (
              <Link href="/owner/add-room" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                Add Room
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/favorites" className="hidden items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700 md:inline-flex">
                  <Heart className="h-4 w-4" /> Saved
                </Link>
                {isOwner && (
                  <Link href="/owner/rooms" className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700 md:inline-flex">My Rooms</Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 md:inline-flex">Login</Link>
                <Link href="/register" className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Create Account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Verified listings in Ranchi
            </div>

            <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Find Your Perfect Room in Ranchi
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Discover verified rooms, PGs and rentals near your college, office or preferred area.
            </p>

            {isOwner && (
              <div className="mt-6 flex items-center justify-start">
                <Link href="/owner/add-room" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
                  <Home className="h-4 w-4" /> Add more room
                </Link>
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/70">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocation(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                  >
                    <option>Choose locality</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</label>
                  <select
                    value={selectedBudget}
                    onChange={(event) => setSelectedBudget(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                  >
                    <option>₹3k - ₹8k</option>
                    <option>₹3k - ₹5k</option>
                    <option>₹5k - ₹8k</option>
                    <option>₹8k+</option>
                  </select>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Room Type</label>
                  <select
                    value={selectedRoomType}
                    onChange={(event) => setSelectedRoomType(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                  >
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
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                >
                  <Search className="h-4 w-4" /> Find Room
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute -top-6 left-10 h-24 w-24 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-8 right-8 h-28 w-28 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="relative w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
              <img
                src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                alt="Room interior"
                className="h-[440px] w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute bottom-10 left-9 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Avg. rent</div>
                    <div className="text-xl font-bold">₹5,800/mo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="locations" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Popular Areas</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Explore the most loved localities</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {[
            { name: 'Lalpur', count: 18, budget: '₹3k - ₹5k' },
            { name: 'Ratu Road', count: 24, budget: '₹5k - ₹8k' },
            { name: 'Harmu', count: 14, budget: '₹4k - ₹6k' },
            { name: 'Morabadi', count: 10, budget: '₹6k - ₹9k' },
            { name: 'Kanke Road', count: 20, budget: '₹3k - ₹6k' },
            { name: 'Bariatu', count: 14, budget: '₹4k - ₹7k' },
            { name: 'Doranda', count: 17, budget: '₹6k - ₹10k' },
            { name: 'Main Road', count: 10, budget: '₹2.5k - ₹5k' },
            { name: 'Upper Bazar', count: 22, budget: '₹4k - ₹8k' },
            { name: 'Kokar', count: 14, budget: '₹3k - ₹7k' },
          ].map((area) => (
            <button
              key={area.name}
              type="button"
              onClick={() => {
                setSelectedLocation(area.name);
                setHasSearched(true);
                document.getElementById('find-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="group rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60"
            >
              <div className="relative mb-4 flex h-28 items-end overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 p-4">
                <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-white/40 blur-xl" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm transition group-hover:scale-110">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-bold text-slate-800">{area.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-1 pb-1 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{area.budget}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:text-white" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="find-rooms" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Featured Rooms</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Handpicked rooms for students</h2>
            </div>
            {hasSearched && (
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                {visibleRooms.length} rooms matched
              </div>
            )}
          </div>

          {visibleRooms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-xl font-semibold text-slate-700">No rooms found for this search.</p>
              <p className="mt-2 text-sm text-slate-500">Try another location, budget range, or room type.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {visibleRooms.map((room) => (
                <article key={room._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative">
                    <img src={room.images[0]} alt={room.title} className="h-56 w-full object-cover" />
                    <button className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 shadow-md">❤</button>
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{room.roomType}</span>
                      {room.ownerDetails?.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{room.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {room.location}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">₹{room.rent.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">/ month</div>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {room.rating}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <Link href={`/rooms/${room._id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">View Details <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="map" className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <Users className="mb-4 h-8 w-8 text-emerald-400" />
            <h3 className="text-2xl font-bold">Verified owners</h3>
            <p className="mt-3 text-slate-300">Every listing is reviewed for authenticity and quality standards.</p>
          </div>
          <div className="rounded-3xl bg-emerald-600 p-8 text-white shadow-xl">
            <CheckCircle2 className="mb-4 h-8 w-8" />
            <h3 className="text-2xl font-bold">Transparent pricing</h3>
            <p className="mt-3 text-emerald-50">See rent, deposit, room details and amenities before contacting owners.</p>
          </div>
          <div className="rounded-3xl bg-sky-600 p-8 text-white shadow-xl">
            <MapPin className="mb-4 h-8 w-8" />
            <h3 className="text-2xl font-bold">Location-based search</h3>
            <p className="mt-3 text-sky-50">Find rentals near colleges, transport and markets across Ranchi.</p>
          </div>
        </div>
      </section>

      <section id="about" className="overflow-hidden border-t-4 border-emerald-500 bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">About Room Finder</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-[3.25rem]">A better way to find your next room in Ranchi.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Room Finder brings students and trusted room owners together in one simple place. We make it easier to compare rent, understand the neighborhood, and choose a stay that feels right before you visit.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">Student-first search</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">Clear pricing</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">Trusted owners</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
              <h3 className="mt-5 text-xl font-bold">Built for confidence</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Room details, deposit, furnishing, and location stay visible before you contact an owner.</p>
            </div>
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500 p-6 text-slate-950">
              <Home className="h-7 w-7" />
              <h3 className="mt-5 text-xl font-bold">Made for real life</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-950/80">From budget rooms to private studios, discover options around the places that matter to you.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-4 text-2xl font-bold text-white">Room Finder</div>
            <p className="text-sm text-slate-400">Helping students find secure, affordable and verified room options in Ranchi.</p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>About</li>
              <li>Contact</li>
              <li>Privacy</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</h4>
            <ul className="space-y-3 text-sm">
              <li>Find Rooms</li>
              <li>Map</li>
              <li>Locations</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Get Started</h4>
            <ul className="space-y-3 text-sm">
              <li>Login</li>
              <li>Register</li>
              <li>Owner Dashboard</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
