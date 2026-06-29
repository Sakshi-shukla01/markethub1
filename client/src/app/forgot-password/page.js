'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import { Spinner } from '@/components/Loader';
import api from '@/lib/api';
import { errMsg } from '@/lib/format';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('If that email exists, a reset code was sent.');
      const q = new URLSearchParams({ email });
      if (data.devOtp) q.set('devOtp', data.devOtp);
      router.push(`/reset-password?${q.toString()}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto flex max-w-md flex-col justify-center py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-8">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-500/15">
            <KeyRound className="h-7 w-7 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we&apos;ll send a code to reset your password.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                className="input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Spinner /> : 'Send reset code'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="font-medium text-brand-600 hover:underline">Back to login</Link>
          </p>
        </motion.div>
      </div>
    </Shell>
  );
}
