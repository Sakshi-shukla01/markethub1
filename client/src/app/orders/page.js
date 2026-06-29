'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PageLoader } from '@/components/Loader';
import EmptyState from '@/components/EmptyState';
import api from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/format';

const statusMeta = {
  paid: { icon: CheckCircle2, label: 'Paid', cls: 'text-emerald-600 bg-emerald-500/15' },
  pending: { icon: Clock, label: 'Pending', cls: 'text-amber-600 bg-amber-500/15' },
  failed: { icon: XCircle, label: 'Failed', cls: 'text-red-600 bg-red-500/15' },
};

function OrdersInner() {
  const params = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (params.get('status') !== 'success') return;
    const sessionId = params.get('session_id');
    if (sessionId) {
      // confirm the Stripe payment so the order is marked paid + item sold
      api.post('/orders/confirm', { sessionId })
        .then(() => {
          toast.success('Payment successful! Your order is confirmed.');
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        })
        .catch(() => toast.success('Order received.'));
    } else {
      toast.success('Order placed!');
    }
  }, [params, queryClient]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders/my-orders')).data.data,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold">My orders</h1>
      <p className="text-sm text-slate-500">Your purchase history.</p>

      {!orders || orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No orders yet"
            subtitle="When you buy something, it'll show up here."
            action={<Link href="/marketplace" className="btn-primary">Start shopping</Link>}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => {
            const meta = statusMeta[o.paymentStatus] || statusMeta.pending;
            const Icon = meta.icon;
            return (
              <motion.div
                key={o._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-2xl glass p-4"
              >
                <img
                  src={o.product?.images?.[0] || o.snapshot?.image || 'https://picsum.photos/seed/o/200'}
                  alt=""
                  className="h-16 w-20 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{o.product?.title || o.snapshot?.title || 'Item'}</p>
                  <p className="text-sm text-slate-500">Order #{o._id.slice(-6).toUpperCase()} · {timeAgo(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{formatPrice(o.amount)}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Shell>
        <Suspense fallback={<PageLoader />}>
          <OrdersInner />
        </Suspense>
      </Shell>
    </ProtectedRoute>
  );
}