'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import GoogleButton from '@/components/GoogleButton';
import { Spinner } from '@/components/Loader';
import { useAuth } from '@/hooks/useAuth';
import { errMsg } from '@/lib/format';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push('/marketplace');
    } catch (err) {
      const res = err.response?.data;
      // account not verified yet -> bounce to OTP page
      if (res?.needsVerification) {
        toast('Please verify your email first.', { icon: '✉️' });
        const q = new URLSearchParams({ email: form.email });
        if (res.devOtp) q.set('devOtp', res.devOtp);
        router.push(`/verify-otp?${q.toString()}`);
        return;
      }
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto flex max-w-md flex-col justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass p-8"
        >
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your MarketHub account.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Spinner /> : <><LogIn className="h-4 w-4" /> Log in</>}
            </button>
          </form>

          <GoogleButton />

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>

          <div className="mt-6 rounded-xl bg-brand-500/10 p-3 text-xs text-slate-500">
            <p className="font-semibold text-brand-600">Demo accounts</p>
            <p>admin@markethub.com / Admin@123</p>
            <p>alice@example.com / Test@123</p>
          </div>
        </motion.div>
      </div>
    </Shell>
  );
}
