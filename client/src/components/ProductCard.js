'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MapPin } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, timeAgo, errMsg } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

export default function ProductCard({ product, inWishlist = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const wishlistMutation = useMutation({
    mutationFn: () => api.post(`/wishlist/${product._id}`),
    onSuccess: (res) => {
      toast.success(res.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please log in to use wishlist');
    wishlistMutation.mutate();
  };

  const cover = product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl glass"
    >
      <Link href={`/product/${product._id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
          {/* plain img with native lazy loading */}
          <img
            src={cover}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <button
            onClick={handleWishlist}
            className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 backdrop-blur transition hover:bg-white dark:bg-slate-900/70 ${isAdmin ? 'hidden' : ''}`}
            aria-label="wishlist"
          >
            <Heart
              className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'}`}
            />
          </button>
          {product.condition === 'new' && (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
              New
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {formatPrice(product.price)}
          </p>
          <h3 className="mt-1 line-clamp-1 font-medium">{product.title}</h3>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {product.location || 'Unknown'}
            </span>
            <span>{timeAgo(product.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
