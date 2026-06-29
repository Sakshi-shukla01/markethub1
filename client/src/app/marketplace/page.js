'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/Loader';
import EmptyState from '@/components/EmptyState';
import api from '@/lib/api';

function MarketplaceInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    category: params.get('category') || '',
    condition: params.get('condition') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page') || 1),
  });

  // keep state in sync if the URL changes (e.g. navbar search)
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      q: params.get('q') || '',
      category: params.get('category') || '',
      page: Number(params.get('page') || 1),
    }));
  }, [params]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) qs.set(k, v);
      });
      qs.set('limit', '12');
      return (await api.get(`/products?${qs.toString()}`)).data;
    },
    keepPreviousData: true,
  });

  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page || 1 }));

  const products = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="h-fit rounded-2xl glass p-5 lg:sticky lg:top-24">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>

          <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
          <input
            className="input mb-4"
            placeholder="Keyword..."
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
          />

          <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <select className="input mb-4" value={filters.category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <label className="mb-1 block text-xs font-medium text-slate-500">Condition</label>
          <select className="input mb-4" value={filters.condition} onChange={(e) => update({ condition: e.target.value })}>
            <option value="">Any</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>

          <label className="mb-1 block text-xs font-medium text-slate-500">Price range (₹)</label>
          <div className="mb-4 flex gap-2">
            <input type="number" className="input" placeholder="Min" value={filters.minPrice} onChange={(e) => update({ minPrice: e.target.value })} />
            <input type="number" className="input" placeholder="Max" value={filters.maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} />
          </div>

          <button
            className="btn-outline w-full"
            onClick={() => setFilters({ q: '', category: '', condition: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 })}
          >
            Clear filters
          </button>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{pagination.total} results</p>
            <select className="input max-w-[180px]" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="No products found" subtitle="Try changing your filters or search keywords." />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => update({ page: pagination.page - 1 })}
                className="btn-outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => update({ page: pagination.page + 1 })}
                className="btn-outline"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<Shell><div className="py-20 text-center text-slate-500">Loading marketplace...</div></Shell>}>
      <MarketplaceInner />
    </Suspense>
  );
}
