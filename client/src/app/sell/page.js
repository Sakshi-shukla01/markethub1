'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/Loader';
import api from '@/lib/api';
import { errMsg } from '@/lib/format';

const schema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Please choose a category'),
  condition: z.enum(['new', 'used']),
  location: z.string().min(2, 'Please add a location'),
});

function SellForm() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Admins are moderators and cannot post listings.
  useEffect(() => {
    if (isAdmin) router.replace('/admin');
  }, [isAdmin, router]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { condition: 'used' },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });

  const onFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 6);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const onSubmit = async (values) => {
    if (files.length === 0) return toast.error('Please add at least one image.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v));
      files.forEach((file) => fd.append('images', file));

      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Listing submitted! It will appear after admin approval.');
      router.push('/my-ads');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Post your ad</h1>
      <p className="mt-1 text-sm text-slate-500">List a product on MarketHub. Listings go live after a quick admin review.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 rounded-2xl glass p-6">
        {/* Images */}
        <div>
          <label className="mb-2 block text-sm font-medium">Photos (up to 6)</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < 6 && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-500 hover:text-brand-500 dark:border-slate-700">
                <div className="flex flex-col items-center">
                  <ImagePlus className="h-6 w-6" />
                  <span className="mt-1 text-xs">Add</span>
                </div>
                <input type="file" accept="image/*" multiple hidden onChange={onFiles} />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input className="input" placeholder="e.g. iPhone 13 Pro, 256GB" {...register('title')} />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea rows={5} className="input resize-none" placeholder="Describe your item, its condition, and why you're selling..." {...register('description')} />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Price (₹)</label>
            <input type="number" className="input" placeholder="0" {...register('price')} />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="input" {...register('category')}>
              <option value="">Select category</option>
              {categories?.map((c) => (
                <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Condition</label>
            <select className="input" {...register('condition')}>
              <option value="used">Used</option>
              <option value="new">New</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <input className="input" placeholder="e.g. Pune, Maharashtra" {...register('location')} />
            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
          {submitting ? <Spinner /> : <><Upload className="h-4 w-4" /> Publish listing</>}
        </button>
      </form>
    </motion.div>
  );
}

export default function SellPage() {
  return (
    <ProtectedRoute>
      <Shell>
        <SellForm />
      </Shell>
    </ProtectedRoute>
  );
}