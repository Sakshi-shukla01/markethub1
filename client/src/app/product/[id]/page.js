'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Eye, ShieldCheck, Tag, ShoppingCart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import { PageLoader } from '@/components/Loader';
import EmptyState from '@/components/EmptyState';
import api from '@/lib/api';
import { formatPrice, timeAgo, errMsg } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/Avatar';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [activeImg, setActiveImg] = useState(0);
  const [buying, setBuying] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data.data,
    enabled: !!id,
  });

  const { data: recent } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: async () => (await api.get('/products/me/recently-viewed')).data.data,
    enabled: isAuthenticated,
  });

  const wishlistMutation = useMutation({
    mutationFn: () => api.post(`/wishlist/${id}`),
    onSuccess: (res) => {
      toast.success(res.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to buy.');
      return router.push('/login');
    }
    setBuying(true);
    try {
      const { data } = await api.post('/orders/create', { productId: id });
      if (data.url) {
        // real Stripe checkout
        window.location.href = data.url;
      } else {
        // demo mock order
        toast.success('Order placed (demo payment)!');
        router.push('/orders?status=success');
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBuying(false);
    }
  };

  if (isLoading) return <Shell><PageLoader /></Shell>;
  if (isError || !product) {
    return (
      <Shell>
        <EmptyState title="Product not found" subtitle="This listing may have been removed." />
      </Shell>
    );
  }

  const images = product.images?.length ? product.images : ['https://picsum.photos/seed/ph/800/600'];
  const isOwner = user && product.seller && (product.seller._id === user.id || product.seller._id === user._id);
  const otherRecent = (recent || []).filter((p) => p._id !== product._id).slice(0, 4);

  return (
    <Shell>
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden rounded-2xl glass"
          >
            <img
              src={images[activeImg]}
              alt={product.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </motion.div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    i === activeImg ? 'border-brand-500' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="rounded-2xl glass p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                  {formatPrice(product.price)}
                </p>
                <h1 className="mt-2 text-2xl font-bold">{product.title}</h1>
              </div>
              <button
                onClick={() => (isAuthenticated ? wishlistMutation.mutate() : toast.error('Log in to use wishlist'))}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/70 transition hover:bg-white dark:bg-slate-800"
                aria-label="wishlist"
              >
                <Heart className="h-5 w-5 text-red-500" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1">
                <Tag className="h-3 w-3" /> {product.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1 capitalize">
                <ShieldCheck className="h-3 w-3" /> {product.condition}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1">
                <MapPin className="h-3 w-3" /> {product.location || 'Unknown'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1">
                <Eye className="h-3 w-3" /> {product.views} views
              </span>
            </div>

            {product.isSold && (
              <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-500">
                This item has been sold.
              </div>
            )}

            <div className="mt-6">
              {isAdmin ? (
                <Link href="/admin/products" className="btn-outline w-full py-3">
                  Admin view — manage in moderation panel
                </Link>
              ) : isOwner ? (
                <Link href="/my-ads" className="btn-outline w-full py-3">
                  This is your listing — manage it
                </Link>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={buying || product.isSold}
                  className="btn-primary w-full py-3 text-base disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.isSold ? 'Sold out' : buying ? 'Processing...' : 'Buy now'}
                </button>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Posted {timeAgo(product.createdAt)}
            </p>
          </div>

          {/* Seller */}
          <div className="mt-4 rounded-2xl glass p-6">
            <h3 className="text-sm font-semibold text-slate-500">Seller</h3>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={product.seller?.avatar} name={product.seller?.name} size={48} />
              <div>
                <p className="font-medium">{product.seller?.name || 'Unknown seller'}</p>
                <p className="text-xs text-slate-400">{product.seller?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 rounded-2xl glass p-6">
        <h2 className="mb-3 text-lg font-semibold">Description</h2>
        <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
          {product.description}
        </p>
      </div>

      {/* Recently viewed */}
      {otherRecent.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recently viewed</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {otherRecent.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </Shell>
  );
}