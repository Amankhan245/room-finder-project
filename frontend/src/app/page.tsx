'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, Star, ShieldCheck, Users, Home, Building2, ArrowRight, CheckCircle2, Heart, MessageCircle, Menu } from 'lucide-react';
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
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; username: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [rooms, setRooms] = useState(demoRooms);
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('roomfinder_token')) {
      setAuthChecked(true);
      return;
    }

    setIsLoggedIn(true);
    try {
      const user = JSON.parse(localStorage.getItem('roomfinder_user') || 'null');
      if (user && typeof user.username === 'string') {
        setLoggedInUser({
          name: typeof user.name === 'string' ? user.name : user.username,
          username: user.username,
        });
      } else {
        setLoggedInUser(null);
      }
      setIsOwner(user?.role === 'owner');
      setIsAdmin(user?.role === 'admin');
    } catch {
      setLoggedInUser(null);
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

  useEffect(() => {
    try {
      setSavedRoomIds(JSON.parse(localStorage.getItem('roomfinder_saved_rooms') || '[]'));
    } catch {
      setSavedRoomIds([]);
    }
  }, []);

  const toggleSavedRoom = async (roomId: string) => {
    const isSaved = savedRoomIds.includes(roomId);
    const nextSavedIds = isSaved ? savedRoomIds.filter((id) => id !== roomId) : [...savedRoomIds, roomId];
    setSavedRoomIds(nextSavedIds);
    localStorage.setItem('roomfinder_saved_rooms', JSON.stringify(nextSavedIds));

    const token = localStorage.getItem('roomfinder_token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/favorites${isSaved ? `/${roomId}` : ''}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        ...(isSaved ? {} : { body: JSON.stringify({ roomId }) }),
      });
    } catch {
      // Keep the local saved list if the API is unavailable.
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('roomfinder_token');
    localStorage.removeItem('roomfinder_user');
    setIsLoggedIn(false);
    setLoggedInUser(null);
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
    <main id="home" className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="#home" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-rose-500" aria-label="Room Finder home">
            <Home className="h-6 w-6 fill-rose-100" /> <span className="hidden sm:inline">Room Finder</span><span className="sm:hidden">RoomFinder</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-medium text-slate-700 transition hover:text-rose-500">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/owner/add-room" className="hidden whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
              List your room
            </Link>
            <Link href="/favorites" aria-label="Saved rooms" title="Saved rooms" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-rose-500">
              <Heart className="h-5 w-5" />
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/messages" aria-label="Messages" title="Messages" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-rose-500"><MessageCircle className="h-5 w-5" /></Link>
                {isOwner && (
                  <Link href="/owner/rooms" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex">My Rooms</Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">Log in</Link>
                <Link href="/register" aria-label="Create account" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 shadow-sm transition hover:shadow-md sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2">
                  <Menu className="h-4 w-4" /><span className="hidden text-sm font-semibold sm:inline">Sign up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-rose-600">
              <ShieldCheck className="h-4 w-4" />
              Ranchi stays, made simple
            </div>

            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
              Find a place that feels like <span className="text-rose-500">yours.</span>
            </h1>
            {loggedInUser && (
              <p className="mt-3 break-words text-sm text-slate-700">
                Welcome back, <span className="font-semibold">{loggedInUser.name}</span>.
                <span className="mt-1 block text-slate-600">Signed in as @{loggedInUser.username}</span>
              </p>
            )}
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Browse welcoming rooms and PGs around Ranchi, with clear pricing and verified owners.
            </p>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:rounded-full sm:p-2">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div className="min-w-0 rounded-xl px-4 py-2 transition hover:bg-slate-50 sm:rounded-full">
                  <label className="mb-1 block text-xs font-semibold text-slate-800">Where</label>
                  <select
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocation(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-sm text-slate-500 outline-none"
                  >
                    <option>Choose locality</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 rounded-xl px-4 py-2 transition hover:bg-slate-50 sm:rounded-full sm:border-l sm:border-slate-200">
                  <label className="mb-1 block text-xs font-semibold text-slate-800">Monthly budget</label>
                  <select
                    value={selectedBudget}
                    onChange={(event) => setSelectedBudget(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-sm text-slate-500 outline-none"
                  >
                    <option>₹3k - ₹8k</option>
                    <option>₹3k - ₹5k</option>
                    <option>₹5k - ₹8k</option>
                    <option>₹8k+</option>
                  </select>
                </div>
                <div className="min-w-0 rounded-xl px-4 py-2 transition hover:bg-slate-50 sm:rounded-full sm:border-l sm:border-slate-200">
                  <label className="mb-1 block text-xs font-semibold text-slate-800">Room type</label>
                  <select
                    value={selectedRoomType}
                    onChange={(event) => setSelectedRoomType(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-sm text-slate-500 outline-none"
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
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 sm:rounded-full"
                >
                  <Search className="h-4 w-4" /> <span className="sm:hidden lg:inline">Search</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-xl">
              <img
                src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                alt="Bright, welcoming room with a comfortable bed"
                className="h-[280px] w-full rounded-2xl object-cover sm:h-[360px] lg:h-[410px]"
              />
              <div className="absolute bottom-4 left-4 rounded-xl border border-white/70 bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-6 sm:left-6 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-rose-50 p-2 text-rose-500">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Typical monthly rent</div>
                    <div className="text-lg font-bold">₹5,800 <span className="text-sm font-normal text-slate-500">/ month</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="locations" className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Get to know the neighbourhood</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Popular areas in Ranchi</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              className="group rounded-xl border border-slate-200 bg-white p-3 text-left transition duration-200 hover:border-slate-400 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition group-hover:bg-rose-100">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-semibold text-slate-900">{area.name}</span>
                  <span className="text-sm text-slate-500">{area.count} room options</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
                <span>From {area.budget}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-rose-500" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="find-rooms" className="scroll-mt-24 border-t border-slate-100 bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Good places to start</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{hasSearched ? 'Rooms matching your search' : 'Popular stays in Ranchi'}</h2>
            </div>
            {hasSearched && (
              <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                {visibleRooms.length} {visibleRooms.length === 1 ? 'room' : 'rooms'} found
              </div>
            )}
          </div>

          {visibleRooms.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-xl font-semibold text-slate-800">No rooms found just yet</p>
              <p className="mt-2 text-sm text-slate-500">Try another location, budget range, or room type.</p>
              <button type="button" onClick={() => { setSelectedLocation('Choose locality'); setSelectedBudget('₹3k - ₹8k'); setSelectedRoomType('Single Room'); setHasSearched(false); }} className="mt-5 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900">Clear search</button>
            </div>
          ) : (
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleRooms.map((room) => (
                <article key={room._id} className="group min-w-0">
                  <div className="relative overflow-hidden rounded-xl bg-slate-100">
                    <img src={room.images[0]} alt={room.title} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <button type="button" onClick={() => toggleSavedRoom(room._id)} aria-label={savedRoomIds.includes(room._id) ? `Unsave ${room.title}` : `Save ${room.title}`} className="absolute right-3 top-3 rounded-full p-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition hover:scale-110"><Heart className={`h-6 w-6 ${savedRoomIds.includes(room._id) ? 'fill-rose-500 text-rose-500' : 'fill-black/30'}`} /></button>
                    {room.ownerDetails?.isVerified && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">Verified stay</span>}
                  </div>
                  <div className="pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 font-semibold text-slate-900">{room.title}</h3>
                      <div className="flex shrink-0 items-center gap-1 text-sm text-slate-900"><Star className="h-3.5 w-3.5 fill-current" /> {room.rating}</div>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {room.location} <span aria-hidden="true">·</span> {room.roomType}</div>
                    <div className="mt-2 text-sm text-slate-900">
                      <span className="font-semibold">₹{room.rent.toLocaleString()}</span><span className="text-slate-600"> / month</span>
                    </div>
                    <Link href={`/rooms/${room._id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700">View room <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="map" className="mx-auto max-w-[1440px] px-5 pb-10 pt-14 sm:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-7">
            <Users className="mb-4 h-7 w-7 text-rose-500" />
            <h3 className="text-xl font-semibold">Verified owners</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Every listing is reviewed for authenticity and quality standards.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-7">
            <CheckCircle2 className="mb-4 h-7 w-7 text-rose-500" />
            <h3 className="text-xl font-semibold">Transparent pricing</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">See rent, deposit, room details and amenities before contacting owners.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-7">
            <MapPin className="mb-4 h-7 w-7 text-rose-500" />
            <h3 className="text-xl font-semibold">Neighbourhood-first search</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Find rentals near colleges, transport and markets across Ranchi.</p>
          </div>
        </div>
      </section>

      <section id="about" className="overflow-hidden border-t border-slate-200 bg-slate-50 text-slate-900">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold text-rose-600">About Room Finder</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">A better way to find your next room in Ranchi.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">Room Finder brings students and trusted room owners together in one simple place. We make it easier to compare rent, understand the neighbourhood, and choose a stay that feels right before you visit.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Student-first search</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Clear pricing</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Trusted owners</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <ShieldCheck className="h-7 w-7 text-rose-500" />
              <h3 className="mt-5 text-lg font-semibold">Built for confidence</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Room details, deposit, furnishing, and location stay visible before you contact an owner.</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-6">
              <Home className="h-7 w-7 text-rose-500" />
              <h3 className="mt-5 text-lg font-semibold">Made for real life</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">From budget rooms to private studios, discover options around the places that matter to you.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white text-slate-700">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-4">
          <div>
            <div className="mb-4 text-xl font-bold text-rose-500">Room Finder</div>
            <p className="text-sm leading-6 text-slate-500">Helping students find secure, affordable and verified room options in Ranchi.</p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="#about" className="hover:underline">About</Link></li>
              <li><Link href="/messages" className="hover:underline">Contact</Link></li>
              <li><Link href="/register" className="hover:underline">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Explore</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="#find-rooms" className="hover:underline">Find Rooms</Link></li>
              <li><Link href="#map" className="hover:underline">Why Room Finder</Link></li>
              <li><Link href="#locations" className="hover:underline">Locations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Get Started</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/login" className="hover:underline">Log in</Link></li>
              <li><Link href="/register" className="hover:underline">Create account</Link></li>
              <li><Link href="/owner/add-room" className="hover:underline">List your room</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
