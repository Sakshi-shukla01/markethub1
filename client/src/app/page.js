'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/Loader';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { isAdmin } = useAuth();
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => (await api.get('/products?limit=8&sort=newest')).data.data,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });

  return (
    <Shell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Buy & sell <span className="gradient-text">anything</span> near you.
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            MarketHub is a modern marketplace — list your products in seconds, discover great deals, and pay securely.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/marketplace" className="btn-primary px-6 py-3 text-base">
              <Search className="h-5 w-5" /> Browse Marketplace
            </Link>
            {!isAdmin && (
              <Link href="/sell" className="btn-outline px-6 py-3 text-base">Post your ad</Link>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure payments</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Instant listings</span>
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-500" /> Real-time updates</span>
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Browse by category</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/marketplace?category=${encodeURIComponent(c.name)}`}
                className="flex min-w-[120px] flex-col items-center gap-2 rounded-2xl glass p-4 transition hover:-translate-y-1"
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Fresh recommendations</h2>
          <Link href="/marketplace" className="text-sm font-semibold text-brand-600 hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products?.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>
    </Shell>
  );
}