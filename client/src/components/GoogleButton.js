'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { errMsg } from '@/lib/format';

// Renders the official Google Sign-In button ONLY when a client id is configured.
// If NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing, this renders nothing (demo mode).
export default function GoogleButton() {
  const ref = useRef(null);
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !ref.current) return;

    const handleCredential = async (response) => {
      try {
        await loginWithGoogle(response.credential);
        toast.success('Signed in with Google');
        router.push('/marketplace');
      } catch (e) {
        toast.error(errMsg(e));
      }
    };

    const init = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      });
    };

    if (window.google) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [clientId, loginWithGoogle, router]);

  if (!clientId) return null;

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> OR <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}
