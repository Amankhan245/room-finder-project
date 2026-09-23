'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, ArrowLeft, CheckCircle2, Clock3, Home, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Stats = { totalUsers: number; totalListings: number; activeListings: number; pendingListings: number; verifiedOwners: number; pendingReports: number };
type Listing = { _id: string; title: string; location: string; rent: number; status: string; owner?: { name?: string; email?: string } };
type ActivityLog = { _id: string; action: string; target: string; details: string; createdAt: string };

const emptyStats: Stats = { totalUsers: 0, totalListings: 0, activeListings: 0, pendingListings: 0, verifiedOwners: 0, pendingReports: 0 };

const readApiResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(data.message || `Request failed (${response.status}).`), { status: response.status });
  }
  return data;
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(emptyStats);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>('Total users');
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    try {
      const token = localStorage.getItem('roomfinder_token');
      const rawUser = localStorage.getItem('roomfinder_user');
      const user = rawUser ? JSON.parse(rawUser) : null;

      if (user?.name) {
        setAdminName(user.name);
      }

      if (!token || user?.role !== 'admin') {
        router.replace('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { headers }).then(readApiResponse),
        fetch(`${API_URL}/admin/listings`, { headers }).then(readApiResponse),
        fetch(`${API_URL}/admin/activity`, { headers }).then(readApiResponse),
      ])
        .then(([dashboard, listingData, activityData]) => {
          if (dashboard.message) throw new Error(dashboard.message);
          setStats(dashboard.stats || emptyStats);
          setListings(listingData.listings || []);
          setActivity(activityData.logs || []);
        })
        .catch((requestError) => {
          if (requestError instanceof Error && [401, 403].includes((requestError as Error & { status?: number }).status || 0)) {
            localStorage.removeItem('roomfinder_token');
            localStorage.removeItem('roomfinder_user');
            router.replace('/login');
            return;
          }
          setError(requestError instanceof TypeError
            ? `Cannot reach the server at ${API_URL}. Start the backend and reload this page.`
            : requestError instanceof Error ? requestError.message : 'Unable to load admin data.');
        })
        .finally(() => setLoading(false));
    } catch {
      router.replace('/login');
      setLoading(false);
    }
  }, [router]);

  const updateListing = async (listingId: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('roomfinder_token');
      const response = await fetch(`${API_URL}/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await readApiResponse(response);
      setListings((current) => current.map((listing) => listing._id === listingId ? { ...listing, status: data.room.status } : listing));
      setStats((current) => ({
        ...current,
        pendingListings: Math.max(0, current.pendingListings - 1),
        activeListings: current.activeListings + (status === 'approved' ? 1 : 0),
      }));
      const logs = await fetch(`${API_URL}/admin/activity`, { headers: { Authorization: `Bearer ${token}` } }).then(readApiResponse);
      setActivity(logs.logs || []);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? `Cannot reach the server at ${API_URL}. Start the backend and try again.`
        : requestError instanceof Error ? requestError.message : 'Unable to update listing.');
    }
  };

  const statCards = [
    {
      label: 'Total users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-sky-50 text-sky-700',
      detail: `Active user base: ${stats.totalUsers}`,
    },
    {
      label: 'Total rooms',
      value: stats.totalListings,
      icon: Home,
      color: 'bg-emerald-50 text-emerald-700',
      detail: `Approved + pending rooms: ${stats.totalListings}`,
    },
    {
      label: 'Pending approval',
      value: stats.pendingListings,
      icon: Clock3,
      color: 'bg-amber-50 text-amber-700',
      detail: `${stats.pendingListings} listings waiting for review`,
    },
    {
      label: 'Verified owners',
      value: stats.verifiedOwners,
      icon: ShieldCheck,
      color: 'bg-violet-50 text-violet-700',
      detail: `${stats.verifiedOwners} trusted property owners`,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Back to app</Link>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Control center</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Admin dashboard</h1>
            <p className="mt-2 text-slate-600">Welcome back, <span className="font-semibold text-emerald-700">{adminName}</span></p>
            <p className="mt-1 text-slate-600">Monitor users, rooms, approvals, and recent activity.</p>
          </div>
          <LayoutDashboard className="hidden h-12 w-12 text-emerald-600 sm:block" />
        </div>

        {error && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => { const Icon = card.icon; const isExpanded = expandedCard === card.label; return <button type="button" key={card.label} onClick={() => setExpandedCard(isExpanded ? null : card.label)} className={`w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md ${isExpanded ? 'ring-2 ring-emerald-200' : ''}`}><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}><Icon className="h-5 w-5" /></div><p className="mt-5 text-sm text-slate-500">{card.label}</p><p className="mt-1 text-3xl font-black">{loading ? '...' : card.value}</p>{isExpanded && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">{card.detail}</div>}</button>; })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Room approvals</h2><p className="mt-1 text-sm text-slate-500">Review every uploaded room.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{stats.pendingListings} pending</span></div>
            <div className="mt-6 space-y-3">
              {listings.length === 0 && !loading && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No listings available yet.</p>}
              {listings.map((listing) => <div key={listing._id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">{listing.title}</h3><p className="mt-1 text-sm text-slate-500">{listing.location} · ₹{listing.rent.toLocaleString()} · {listing.owner?.name || 'Owner'}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${listing.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : listing.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{listing.status}</span></div>{listing.status === 'pending' && <div className="flex gap-2"><button type="button" onClick={() => updateListing(listing._id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" /> Approve</button><button type="button" onClick={() => updateListing(listing._id, 'rejected')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Reject</button></div>}</div>)}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-emerald-400" /><h2 className="text-2xl font-bold">Recent activity</h2></div><div className="mt-6 space-y-4">{activity.length === 0 && !loading && <p className="text-sm text-slate-400">No activity recorded yet.</p>}{activity.slice(0, 6).map((log) => <div key={log._id} className="border-l-2 border-emerald-500/50 pl-4"><p className="text-sm font-semibold">{log.action}</p><p className="mt-1 text-xs text-slate-400">{log.target}</p></div>)}</div></section>
        </div>
      </div>
    </main>
  );
}
