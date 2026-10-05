'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Building2, Mail, UserRound, LockKeyhole, Phone } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('role') === 'owner') {
      setForm((previous) => ({ ...previous, role: 'owner' }));
    }
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('roomfinder_token', data.token);
      localStorage.setItem('roomfinder_user', JSON.stringify(data.user));

      const destination = data.user?.role === 'admin'
        ? '/admin'
        : data.user?.role === 'owner'
          ? '/owner/rooms'
          : '/';

      router.push(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" aria-label="Home page" title="Home page" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-500">
          <Home className="h-5 w-5" />
        </Link>

        <div className="mt-8 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">
          <div className="bg-rose-50 p-8 text-slate-900 lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1 text-sm font-medium text-slate-700">
              <Building2 className="h-4 w-4 text-rose-500" />
              Start listing today
            </div>
            <h1 className="mt-8 text-4xl font-black tracking-tight">Create your account</h1>
            <p className="mt-4 max-w-md text-slate-600">
              Join Room Finder to save preferred rooms, contact owners, and access verified listings in your preferred area.
            </p>

            <div className="mt-10 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">1</div>
                <span>Create your profile</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">2</div>
                <span>Shortlist the best rooms</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">3</div>
                <span>Connect with trusted owners</span>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Register</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Let’s get started</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input id="name" name="name" value={form.name} onChange={handleChange} type="text" placeholder="Enter your full name" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input id="reg-email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <input id="phone" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="9876543210" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">Account type</label>
                <select id="role" name="role" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-50">
                  <option value="student">I am looking for a room</option>
                  <option value="owner">I want to list my rooms</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input id="reg-password" name="password" value={form.password} onChange={handleChange} type="password" placeholder="Create a strong password" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} type="password" placeholder="Re-enter your password" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-rose-600 hover:text-rose-700">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
