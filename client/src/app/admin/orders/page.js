'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminTabs from '@/components/AdminTabs';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/format';

const statusMeta = {
  paid: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-500/15' },
  pending: { icon: Clock, cls: 'text-amber-600 bg-amber-500/15' },
  failed: { icon: XCircle, cls: 'text-red-600 bg-red-500/15' },
};

function OrdersInner() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get('/admin/orders')).data.data,
  });

  if (isLoading) return <PageLoader />;

  const total = (orders || [])
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Orders</h1>
      <p className="mb-6 text-sm text-slate-500">
        {orders?.length || 0} orders · {formatPrice(total)} total revenue.
      </p>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl glass p-8 text-center text-sm text-slate-400">No orders yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/50 text-xs uppercase text-slate-400 dark:border-slate-700/50">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const meta = statusMeta[o.paymentStatus] || statusMeta.pending;
                  const Icon = meta.icon;
                  return (
                    <tr key={o._id} className="border-b border-slate-100/50 last:border-0 dark:border-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs">#{o._id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3">{o.product?.title || o.snapshot?.title || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{o.buyer?.name || '—'}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(o.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${meta.cls}`}>
                          <Icon className="h-3 w-3" /> {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{timeAgo(o.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute adminOnly>
      <Shell>
        <AdminTabs />
        <OrdersInner />
      </Shell>
    </ProtectedRoute>
  );
}
