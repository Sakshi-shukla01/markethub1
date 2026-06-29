'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import { Spinner } from '@/components/Loader';
import api from '@/lib/api';
import { errMsg } from '@/lib/format';

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const presetEmail = params.get('email') || '';
  const devOtp = params.get('devOtp') || '';

  const [form, setForm] = useState({ email: presetEmail, code: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, email: presetEmail, code: devOtp || f.code }));
  }, [presetEmail, devOtp]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', form);
      toast.success('Password reset! You can now log in.');
      router.push('/login');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-8">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the code we sent and your new password.</p>

        {devOtp && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600">
            Demo mode — your reset code is <b>{devOtp}</b> (auto-filled).
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reset code</label>
            <input
              inputMode="numeric"
              maxLength={6}
              required
              className="input tracking-[0.4em]"
              placeholder="6-digit code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                className="input pl-10"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? <Spinner /> : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Shell>
      <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading...</div>}>
        <ResetInner />
      </Suspense>
    </Shell>
  );
}
