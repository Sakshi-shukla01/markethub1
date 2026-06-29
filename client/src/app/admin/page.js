'use client';

import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Package, ShoppingBag, IndianRupee, Clock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminTabs from '@/components/AdminTabs';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { formatPrice, timeAgo, errMsg } from '@/lib/format';

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-5">
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </motion.div>
  );
}

function AdminOverview() {
  const queryClient = useQueryClient();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data.data,
  });

  const { data: pending } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => (await api.get('/admin/products?status=pending')).data.data,
  });

  const moderate = useMutation({
    mutationFn: ({ id, action }) => api.put(`/admin/products/${id}/approve`, { action }),
    onSuccess: (_, { action }) => {
      toast.success(action === 'approve' ? 'Listing approved' : 'Listing rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return <PageLoader />;

  const maxTrend = Math.max(1, ...((analytics?.trend || []).map((t) => t.count)));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Admin overview</h1>
      <p className="mb-6 text-sm text-slate-500">Platform analytics and moderation.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Users} label="Users" value={analytics?.users ?? 0} color="bg-brand-500" />
        <MetricCard icon={Package} label="Products" value={analytics?.products ?? 0} color="bg-indigo-500" />
        <MetricCard icon={ShoppingBag} label="Paid orders" value={analytics?.orders ?? 0} color="bg-emerald-500" />
        <MetricCard icon={IndianRupee} label="Revenue" value={formatPrice(analytics?.revenue ?? 0)} color="bg-amber-500" />
      </div>

      {/* 7-day trend */}
      <div className="mt-6 rounded-2xl glass p-6">
        <h2 className="mb-4 text-lg font-semibold">Orders — last 7 days</h2>
        {analytics?.trend?.length ? (
          <div className="flex h-40 items-end gap-3">
            {analytics.trend.map((t) => (
              <div key={t._id} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-brand-500/80 transition-all"
                  style={{ height: `${(t.count / maxTrend) * 100}%`, minHeight: '6px' }}
                  title={`${t.count} orders · ${formatPrice(t.revenue)}`}
                />
                <span className="text-[10px] text-slate-400">{t._id.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No paid orders in the last 7 days yet.</p>
        )}
      </div>

      {/* Pending moderation */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Pending approval</h2>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-600">
            {pending?.length || 0}
          </span>
        </div>

        {!pending || pending.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-sm text-slate-400">
            Nothing waiting for review. 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p._id} className="flex items-center gap-4 rounded-2xl glass p-4">
                <Link href={`/product/${p._id}`}>
                  <img src={p.images?.[0] || 'https://picsum.photos/seed/p/200'} alt="" className="h-16 w-20 flex-shrink-0 rounded-xl object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-sm text-slate-500">{formatPrice(p.price)} · by {p.seller?.name} · {timeAgo(p.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moderate.mutate({ id: p._id, action: 'approve' })}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => moderate.mutate({ id: p._id, action: 'reject' })}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <Shell>
        <AdminTabs />
        <AdminOverview />
      </Shell>
    </ProtectedRoute>
  );
}
