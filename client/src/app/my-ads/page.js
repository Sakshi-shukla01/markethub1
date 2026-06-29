'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PageLoader } from '@/components/Loader';
import EmptyState from '@/components/EmptyState';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, errMsg } from '@/lib/format';

const statusStyles = {
  approved: 'bg-emerald-500/15 text-emerald-600',
  pending: 'bg-amber-500/15 text-amber-600',
  rejected: 'bg-red-500/15 text-red-600',
};

function EditModal({ product, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: product.title,
    price: product.price,
    description: product.description,
    location: product.location || '',
  });

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      return api.put(`/products/${product._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Listing updated — sent for re-approval.');
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit listing</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
          <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" />
          <textarea rows={4} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary w-full py-2.5">
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MyAdsInner() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => (await api.get('/products/me/listings')).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Listing deleted');
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My ads</h1>
          <p className="text-sm text-slate-500">Manage your listings.</p>
        </div>
        {!isAdmin && (
          <Link href="/sell" className="btn-primary"><Plus className="h-4 w-4" /> Post ad</Link>
        )}
      </div>

      {!listings || listings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No listings yet"
            subtitle="Post your first ad and start selling on MarketHub."
            action={!isAdmin && <Link href="/sell" className="btn-primary">Post an ad</Link>}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {listings.map((p) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 rounded-2xl glass p-4 sm:flex-row sm:items-center"
            >
              <Link href={`/product/${p._id}`} className="flex flex-1 items-center gap-4">
                <img
                  src={p.images?.[0] || 'https://picsum.photos/seed/x/200'}
                  alt=""
                  className="h-20 w-24 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-lg font-bold text-brand-600">{formatPrice(p.price)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[p.status]}`}>
                      {p.status}
                    </span>
                    {p.isSold && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Sold
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="btn-outline px-3 py-2">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(p._id); }}
                  className="rounded-xl border border-red-300 px-3 py-2 text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {editing && <EditModal product={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export default function MyAdsPage() {
  return (
    <ProtectedRoute>
      <Shell>
        <MyAdsInner />
      </Shell>
    </ProtectedRoute>
  );
}