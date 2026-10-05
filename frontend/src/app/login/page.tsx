'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Check your email and password.');
      }

      localStorage.setItem('roomfinder_token', data.token);
      localStorage.setItem('roomfinder_user', JSON.stringify(data.user));

      const destination = data.user?.role === 'admin'
        ? '/admin'
        : data.user?.role === 'owner'
          ? '/owner/rooms'
          : '/';

      window.location.assign(destination);
    } catch (err) {
      setError(err instanceof TypeError
        ? `Cannot reach the server at ${API_URL}. Start the backend and try again.`
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] lg:grid-cols-2">
          <div className="bg-rose-50 p-8 text-slate-900 lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1 text-sm font-semibold text-rose-600">
              <ShieldCheck className="h-4 w-4" />
              Trusted stays
            </div>
            <h1 className="mt-8 text-4xl font-black tracking-tight">Welcome back</h1>
            <p className="mt-4 max-w-md text-slate-600">
              Log in to manage your saved rooms, compare options, and contact verified owners faster.
            </p>

            <div className="mt-10 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">✓</div>
                <span>Verified listings and secure contact flow</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">✓</div>
                <span>Track your shortlisted rooms in one place</span>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Login</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Access your account</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email or user ID</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input id="email" name="email" value={form.email} onChange={handleChange} type="text" placeholder="Enter any ID" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-rose-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input id="password" name="password" value={form.password} onChange={handleChange} type="password" placeholder="Enter your password" className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500" />
                  Remember me
                </label>
                <Link href="/" className="font-medium text-rose-600 hover:text-rose-700">Forgot password?</Link>
              </div>

              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Logging in...' : 'Login to account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don’t have an account?{' '}
              <Link href="/register" className="font-semibold text-rose-600 hover:text-rose-700">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
