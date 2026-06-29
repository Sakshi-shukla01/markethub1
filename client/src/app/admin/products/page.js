'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminTabs from '@/components/AdminTabs';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { formatPrice, errMsg } from '@/lib/format';

const filters = ['all', 'pending', 'approved', 'rejected'];
const statusStyles = {
  approved: 'bg-emerald-500/15 text-emerald-600',
  pending: 'bg-amber-500/15 text-amber-600',
  rejected: 'bg-red-500/15 text-red-600',
};

function ProductsInner() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', filter],
    queryFn: async () => {
      const qs = filter === 'all' ? '' : `?status=${filter}`;
      return (await api.get(`/admin/products${qs}`)).data.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  const moderate = useMutation({
    mutationFn: ({ id, action }) => api.put(`/admin/products/${id}/approve`, { action }),
    onSuccess: (_, { action }) => { toast.success(`Listing ${action === 'approve' ? 'approved' : 'rejected'}`); invalidate(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { toast.success('Product deleted'); invalidate(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Products</h1>
      <p className="mb-4 text-sm text-slate-500">Moderate and manage all listings.</p>

      <div className="mb-5 flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-brand-600 text-white' : 'glass hover:bg-slate-500/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !products || products.length === 0 ? (
        <div className="rounded-2xl glass p-8 text-center text-sm text-slate-400">No products in this view.</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id} className="flex items-center gap-4 rounded-2xl glass p-4">
              <Link href={`/product/${p._id}`}>
                <img src={p.images?.[0] || 'https://picsum.photos/seed/p/200'} alt="" className="h-16 w-20 flex-shrink-0 rounded-xl object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-sm text-slate-500">{formatPrice(p.price)} · {p.seller?.name || 'Unknown'}</p>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex gap-2">
                {p.status !== 'approved' && (
                  <button onClick={() => moderate.mutate({ id: p._id, action: 'approve' })} className="rounded-xl bg-emerald-500 p-2 text-white transition hover:bg-emerald-600" title="Approve">
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {p.status !== 'rejected' && (
                  <button onClick={() => moderate.mutate({ id: p._id, action: 'reject' })} className="rounded-xl border border-amber-300 p-2 text-amber-500 transition hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/20" title="Reject">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => { if (confirm('Delete this product?')) del.mutate(p._id); }} className="rounded-xl border border-red-300 p-2 text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <ProtectedRoute adminOnly>
      <Shell>
        <AdminTabs />
        <ProductsInner />
      </Shell>
    </ProtectedRoute>
  );
}
