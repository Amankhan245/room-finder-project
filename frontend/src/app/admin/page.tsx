'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type VerifiedOwner = { name: string; email: string; phone: string; verificationStatus: string; createdAt: string };
type Stats = { totalUsers: number; totalListings: number; activeListings: number; pendingListings: number; verifiedOwners: number; pendingReports: number; userNames: string[]; verifiedOwnerDetails: VerifiedOwner[] };
type Listing = { _id: string; title: string; location: string; rent: number; status: string; owner?: { name?: string; email?: string }; ownerDetails?: { name?: string; phone?: string; email?: string } };
type ActivityLog = { _id: string; action: string; target: string; details: string; createdAt: string };
type AdminUser = { name: string; username?: string; email: string; phone?: string; role: string; accountStatus?: string; lastLogin?: string | null; createdAt?: string };

const emptyStats: Stats = { totalUsers: 0, totalListings: 0, activeListings: 0, pendingListings: 0, verifiedOwners: 0, pendingReports: 0, userNames: [], verifiedOwnerDetails: [] };

const readApiResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(data.message || `Request failed (${response.status}).`), { status: response.status });
  }
  return data;
};

export default function AdminPage() {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>('Total users');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await readApiResponse(response);
      if (data.user?.role !== 'admin') {
        throw new Error('This account does not have admin access. Sign in with an admin account to continue.');
      }

      const token = data.token;
      const headers = { Authorization: `Bearer ${token}` };
      const [meData, dashboard, listingData, activityData] = await Promise.all([
        fetch(`${API_URL}/auth/me`, { headers }).then(readApiResponse),
        fetch(`${API_URL}/admin/dashboard`, { headers }).then(readApiResponse),
        fetch(`${API_URL}/admin/listings`, { headers }).then(readApiResponse),
        fetch(`${API_URL}/admin/activity`, { headers }).then(readApiResponse),
      ]);
      const user = meData.user as AdminUser;
      if (user?.role !== 'admin') {
        throw new Error('This account does not have admin access. Sign in with an admin account to continue.');
      }
      if (dashboard.message) throw new Error(dashboard.message);

      setAdminUser(user);
      setAdminUsername(user.username || user.name || 'admin');
      setStats(dashboard.stats || emptyStats);
      setListings(listingData.listings || []);
      setActivity(activityData.logs || []);
      localStorage.setItem('roomfinder_token', data.token);
      localStorage.setItem('roomfinder_user', JSON.stringify(data.user));
      setError('');
      setIsAuthenticated(true);
    } catch (loginRequestError) {
      setLoginError(loginRequestError instanceof TypeError
        ? `Cannot reach the server at ${API_URL}. Start the backend and try again.`
        : loginRequestError instanceof Error ? loginRequestError.message : 'Unable to sign in.');
    } finally {
      setLoginLoading(false);
      setLoading(false);
    }
  };

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
      color: 'bg-rose-50 text-rose-600',
      detail: stats.userNames?.length ? `Users: ${stats.userNames.join(', ')}` : 'No users registered yet.',
    },
    {
      label: 'Total rooms',
      value: stats.totalListings,
      icon: Home,
      color: 'bg-rose-50 text-rose-600',
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
      color: 'bg-rose-50 text-rose-600',
      detail: stats.verifiedOwnerDetails?.length ? `${stats.verifiedOwnerDetails.length} verified owners` : 'No verified owners yet.',
    },
  ];

  const [activeView, setActiveView] = useState<'Overview' | 'Listings' | 'Owners' | 'Reports' | 'Settings'>('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { label: 'Overview', key: 'Overview' },
    { label: 'Listings', key: 'Listings' },
    { label: 'Owners', key: 'Owners' },
    { label: 'Reports', key: 'Reports' },
    { label: 'Settings', key: 'Settings' },
  ] as const;

  const primaryListings: Listing[] = listings.filter((listing: Listing) => listing.status === 'pending').slice(0, 5);

  const filteredListings: Listing[] = listings.filter((listing: Listing) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return [listing.title, listing.location, listing.owner?.name || listing.ownerDetails?.name || '', listing.ownerDetails?.email || ''].some((value) => value.toLowerCase().includes(term));
  });

  const filteredOwners: VerifiedOwner[] = stats.verifiedOwnerDetails.filter((owner: VerifiedOwner) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return [owner.name, owner.email, owner.phone].some((value) => value.toLowerCase().includes(term));
  });

  const visibleListings = activeView === 'Listings' ? filteredListings : primaryListings;

  const renderOverviewContent = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isExpanded = expandedCard === card.label;

          return (
            <button
              type="button"
              key={card.label}
              onClick={() => setExpandedCard(isExpanded ? null : card.label)}
              className={`w-full rounded-[24px] border bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(255,63,108,0.08)] ${isExpanded ? 'border-[#ffbfd1] ring-2 ring-[#ffe0ea]' : 'border-slate-200'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Live</span>
              </div>

              <p className="mt-5 text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{loading ? '...' : card.value}</p>

              {isExpanded && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600">
                  {card.detail}
                  {card.label === 'Verified owners' && stats.verifiedOwnerDetails?.map((owner) => (
                    <div key={owner.email} className="mt-2 border-t border-slate-200 pt-2">
                      <p className="font-semibold text-slate-800">{owner.name}</p>
                      <p>{owner.email} · {owner.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_0.8fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Approval queue</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Pending rooms</h2>
            </div>
            <span className="rounded-full bg-[#fff1f5] px-3 py-1.5 text-xs font-semibold text-[#ff3f6c]">
              {stats.pendingListings} pending
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Room</span>
              <span>Owner</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>

            {visibleListings.length === 0 && !loading && (
              <p className="p-4 text-sm text-slate-500">No pending rooms right now.</p>
            )}

            {visibleListings.map((listing) => (
              <div key={listing._id} className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{listing.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{listing.location}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">{listing.owner?.name || listing.ownerDetails?.name || 'Owner'}</p>
                  <p className="mt-1 text-xs text-slate-500">₹{listing.rent.toLocaleString()}</p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                    {listing.status}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => updateListing(listing._id, 'approved')} className="rounded-lg bg-[#ff3f6c] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#ea2d5d]">
                    Approve
                  </button>
                  <button type="button" onClick={() => updateListing(listing._id, 'rejected')} className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Activity</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Recent</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1f5] text-[#ff3f6c]">
                <Activity className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {activity.length === 0 && !loading && <p className="text-sm text-slate-500">No activity recorded yet.</p>}
              {activity.slice(0, 4).map((log) => (
                <div key={log._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{log.target}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Quick stats</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Summary</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1f5] text-[#ff3f6c]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Active listings</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.activeListings}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Reports</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.pendingReports}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Verified owners</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.verifiedOwners}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );

  const renderListingsContent = () => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Management</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">All listings</h2>
        </div>
        <span className="rounded-full bg-[#fff1f5] px-3 py-1.5 text-xs font-semibold text-[#ff3f6c]">{filteredListings.length} results</span>
      </div>

      <div className="space-y-3">
        {filteredListings.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No rooms match your search.</p>}
        {filteredListings.map((listing) => (
          <div key={listing._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-800">{listing.title}</p>
              <p className="mt-1 text-sm text-slate-500">{listing.location} · ₹{listing.rent.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${listing.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : listing.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {listing.status}
              </span>
              {listing.status === 'pending' && <button type="button" onClick={() => updateListing(listing._id, 'approved')} className="rounded-lg bg-[#ff3f6c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ea2d5d]">Approve</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderOwnersContent = () => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Owners</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Verified owner list</h2>
        </div>
        <span className="rounded-full bg-[#fff1f5] px-3 py-1.5 text-xs font-semibold text-[#ff3f6c]">{filteredOwners.length} owners</span>
      </div>

      <div className="space-y-3">
        {filteredOwners.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No verified owners match your search.</p>}
        {filteredOwners.map((owner) => (
          <div key={owner.email} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-semibold text-slate-800">{owner.name}</p>
              <p className="mt-1 text-sm text-slate-500">{owner.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-600">Verified</p>
              <p className="mt-1 text-xs text-slate-500">{owner.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderReportsContent = () => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Reports</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Issue monitoring</h2>
        </div>
        <span className="rounded-full bg-[#fff1f5] px-3 py-1.5 text-xs font-semibold text-[#ff3f6c]">{stats.pendingReports} new</span>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
        <p className="text-lg font-semibold text-slate-800">No active report details are available yet.</p>
        <p className="mt-2 text-sm">New issue reports will appear here once submitted by users.</p>
      </div>
    </section>
  );

  const renderSettingsContent = () => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Settings</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">Admin preferences</h2>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Account</p>
          <p className="mt-2 text-sm text-slate-600">{adminUser?.email || 'admin@roomfinder.local'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Role</p>
          <p className="mt-2 text-sm text-slate-600">{adminUser?.role || 'admin'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Notifications</p>
          <p className="mt-2 text-sm text-slate-600">Email and activity alerts are enabled.</p>
        </div>
      </div>
    </section>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'Listings':
        return renderListingsContent();
      case 'Owners':
        return renderOwnersContent();
      case 'Reports':
        return renderReportsContent();
      case 'Settings':
        return renderSettingsContent();
      default:
        return renderOverviewContent();
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f5f6] px-4 py-10 text-slate-900">
        <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f5] text-[#ff3f6c]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your admin email and password to open the dashboard.</p>

          <form className="mt-7 space-y-5" onSubmit={handleAdminLogin}>
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#ff3f6c] focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Enter admin email"
                  className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#ff3f6c] focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                  className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {loginError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-[#ff3f6c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ea2d5d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loginLoading ? 'Signing in...' : 'Sign in to dashboard'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f5f6] p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1500px] gap-6">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:block">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff3f6c] text-sm font-black text-white">
              R
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Room Finder</p>
              <h2 className="text-xl font-black text-slate-900">Admin</h2>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeView === item.key ? 'bg-[#fff1f5] text-[#ff3f6c]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <span>{item.label}</span>
                {activeView === item.key && <span className="h-2.5 w-2.5 rounded-full bg-[#ff3f6c]" />}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-[#fff1f5] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff3f6c]">Support</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">Need help reviewing listings?</p>
            <button
              type="button"
              onClick={() => window.location.href = 'mailto:admin@roomfinder.local?subject=Support%20Request'}
              className="mt-4 w-full rounded-xl bg-[#ff3f6c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ea2d5d]"
            >
              Contact team
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 lg:hidden">
                  <Home className="h-5 w-5 text-slate-700" />
                </div>
                <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search rooms, owners, reports"
                    className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end lg:self-auto">
                <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button type="button" onClick={() => setError('Notifications panel opened successfully.')} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff3f6c] text-sm font-bold text-white">
                    {adminUsername.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-slate-800">{adminUsername}</p>
                    <p className="text-[11px] text-slate-500">Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mt-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff3f6c]">Dashboard</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{activeView}</h1>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                {adminUser ? (
                  <span>
                    {adminUser.email} · {adminUser.role}
                  </span>
                ) : (
                  <span>Admin access active</span>
                )}
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{error}</p>
                {error.includes('does not have admin access') && <Link href="/login" className="mt-2 inline-block font-semibold underline">Sign in with another account</Link>}
              </div>
            )}

            {renderActiveView()}
          </main>
        </div>
      </div>
    </main>
  );
}
