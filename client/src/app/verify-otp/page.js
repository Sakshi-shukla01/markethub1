'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import { Spinner } from '@/components/Loader';
import api from '@/lib/api';
import { errMsg } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { finishVerification } = useAuth();

  const email = params.get('email') || '';
  const devOtp = params.get('devOtp') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // In demo mode the OTP is passed through the URL — prefill it so testing is instant.
  useEffect(() => {
    if (devOtp) setCode(devOtp);
  }, [devOtp]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code });
      finishVerification(data);
      toast.success('Email verified! You are now logged in.');
      router.push('/marketplace');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      toast.success('A new OTP was sent.');
      if (data.devOtp) {
        setCode(data.devOtp);
        toast(`Demo OTP: ${data.devOtp}`, { icon: '🔑', duration: 6000 });
      }
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-500/15">
          <ShieldCheck className="h-7 w-7 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit code to <span className="font-medium">{email || 'your email'}</span>.
        </p>

        {devOtp && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600">
            Demo mode — your code is <b>{devOtp}</b> (auto-filled below).
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            inputMode="numeric"
            maxLength={6}
            required
            className="input text-center text-2xl tracking-[0.5em]"
            placeholder="------"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full py-2.5">
            {loading ? <Spinner /> : 'Verify'}
          </button>
        </form>

        <button onClick={resend} className="mt-4 text-sm text-brand-600 hover:underline">
          Didn&apos;t get it? Resend code
        </button>
        <p className="mt-4 text-sm text-slate-500">
          <Link href="/login" className="hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Shell>
      <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading...</div>}>
        <VerifyInner />
      </Suspense>
    </Shell>
  );
}
