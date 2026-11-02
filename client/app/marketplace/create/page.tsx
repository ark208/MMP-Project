'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Tag,
  ArrowLeft,
  Upload,
  DollarSign,
  Check,
  X,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import type { ListingCondition } from '@docs/types';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const createListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().min(0, 'Price must be 0 or higher (0 for free)'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  description: z
    .string()
    .min(10, 'Please provide details on item condition, included accessories, etc.')
    .max(1000, 'Description too long'),
});

type CreateListingFormValues = z.infer<typeof createListingSchema>;

const CATEGORIES = [
  'Books',
  'Electronics',
  'Furniture',
  'Appliances',
  'Clothing',
  'Accessories',
  'Other',
];

const CONDITIONS: { value: ListingCondition; label: string; desc: string }[] = [
  { value: 'NEW', label: 'Brand New', desc: 'Unopened in original box' },
  { value: 'LIKE_NEW', label: 'Like New', desc: 'Flawless condition, barely used' },
  { value: 'GOOD', label: 'Good', desc: 'Minor cosmetic signs of wear' },
  { value: 'FAIR', label: 'Fair', desc: 'Functional with noticeable wear' },
];

export default function CreateListingPage() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  ]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateListingFormValues>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: '',
      category: 'Books',
      price: 25,
      condition: 'LIKE_NEW',
      description: '',
    },
  });

  const selectedCondition = watch('condition');

  const handleMultipleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 6) {
      toast.error('You can upload a maximum of 6 images per listing');
      return;
    }

    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map((file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is larger than 5MB limit`);
        }
        return api.uploads.uploadFile(file);
      });

      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.url);
      setImages((prev) => [...prev, ...newUrls]);
      toast.success(`${newUrls.length} image(s) added!`);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading images');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImageAt = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CreateListingFormValues) => {
    if (images.length === 0) {
      toast.error('Please attach at least one image of the item');
      return;
    }

    startTransition(async () => {
      try {
        const listing = await api.marketplace.create({
          title: data.title,
          description: data.description,
          price: Number(data.price),
          category: data.category,
          condition: data.condition,
          imageUrls: images,
        });

        toast.success('Marketplace listing published!');
        router.push(`/marketplace/${listing.id}`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to publish listing');
      }
    });
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-0">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 shrink-0">
            <Tag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sell an Item on Campus
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              List your textbooks, furniture, and electronics directly to peers on campus.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Listing Title *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g. Calculus 9th Edition or Ergonomic Desk Chair"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Category & Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Asking Price ($ USD) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="25.00"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Item Condition *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue('condition', c.value, { shouldValidate: true })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedCondition === c.value
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-600/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{c.label}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      {c.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Detailed Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Mention how long you used it, reason for selling, inclusions, and preferred campus pickup spots..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Multi-Image Upload */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Photos ({images.length}/6) *
                </label>
                <span className="text-[11px] text-neutral-400">First photo is cover</span>
              </div>

              {/* Thumbnails grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 h-28 bg-neutral-100 dark:bg-neutral-800 shadow-xs"
                  >
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-neutral-900/80 text-white">
                        COVER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors shadow-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {images.length < 6 && (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-purple-500 rounded-2xl cursor-pointer bg-neutral-50/50 dark:bg-neutral-800/40 transition-colors">
                    <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      + Add Photos
                    </span>
                    <span className="text-[10px] text-neutral-400">Multi-select</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleFilesChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || uploadingImage}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isPending ? 'Publishing Listing...' : 'Publish Listing to Marketplace'}</span>
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
