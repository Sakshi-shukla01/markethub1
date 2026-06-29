'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Package, Heart, ShoppingBag, Plus, Camera, ShieldCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Spinner } from '@/components/Loader';
import api from '@/lib/api';
import { errMsg } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/Avatar';

function StatCard({ icon: Icon, label, value, href, color }) {
  return (
    <Link href={href} className="rounded-2xl glass p-5 transition hover:-translate-y-1">
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Link>
  );
}

function DashboardInner() {
  const { user, updateUser, isAdmin } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const { data: listings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => (await api.get('/products/me/listings')).data.data,
  });
  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/wishlist')).data.data,
  });
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders/my-orders')).data.data,
  });

  const saveProfile = async (e, file) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (file) fd.append('avatar', file);
      const { data } = await api.put('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user || data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? 'Account settings' : 'Dashboard'}</h1>
          <p className="text-sm text-slate-500">Welcome back, {user?.name}.</p>
        </div>
        {isAdmin ? (
          <Link href="/admin" className="btn-primary"><Shield className="h-4 w-4" /> Admin Panel</Link>
        ) : (
          <Link href="/sell" className="btn-primary"><Plus className="h-4 w-4" /> Post ad</Link>
        )}
      </div>

      {/* Marketplace stats for users. Admins manage everything from the Admin Panel,
          so their dashboard is just account settings — no duplicate shortcut cards. */}
      {!isAdmin && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard icon={Package} label="My listings" value={listings?.length ?? 0} href="/my-ads" color="bg-brand-500" />
          <StatCard icon={Heart} label="Wishlist" value={wishlist?.length ?? 0} href="/wishlist" color="bg-rose-500" />
          <StatCard icon={ShoppingBag} label="Orders" value={orders?.length ?? 0} href="/orders" color="bg-emerald-500" />
        </div>
      )}

      {/* Profile */}
      <div className="mt-8 max-w-xl rounded-2xl glass p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name} size={80} />
            <label className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-brand-600 text-white">
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && saveProfile(null, e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
            {user?.isVerified && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600">Verified</span>
            )}
          </div>
        </div>

        <form onSubmit={(e) => saveProfile(e)} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input opacity-60" value={user?.email || ''} disabled />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : 'Save changes'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Shell>
        <DashboardInner />
      </Shell>
    </ProtectedRoute>
  );
}