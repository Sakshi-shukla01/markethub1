'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductCard from '@/components/ProductCard';
import { PageLoader } from '@/components/Loader';
import EmptyState from '@/components/EmptyState';
import api from '@/lib/api';

function WishlistInner() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/wishlist')).data.data,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold">My wishlist</h1>
      <p className="text-sm text-slate-500">Items you saved for later.</p>

      {!products || products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your wishlist is empty"
            subtitle="Tap the heart on any product to save it here."
            action={<Link href="/marketplace" className="btn-primary">Browse marketplace</Link>}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p._id} product={p} inWishlist />)}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <Shell>
        <WishlistInner />
      </Shell>
    </ProtectedRoute>
  );
}
