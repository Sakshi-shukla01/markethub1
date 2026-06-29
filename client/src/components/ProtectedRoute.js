'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from './Loader';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const router = useRouter();
  const { isAuthenticated, bootstrapped, isAdmin } = useAuth();

  useEffect(() => {
    if (!bootstrapped) return;
    if (!isAuthenticated) router.replace('/login');
    else if (adminOnly && !isAdmin) router.replace('/dashboard');
  }, [bootstrapped, isAuthenticated, isAdmin, adminOnly, router]);

  if (!bootstrapped) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;
  if (adminOnly && !isAdmin) return <PageLoader />;

  return children;
}
