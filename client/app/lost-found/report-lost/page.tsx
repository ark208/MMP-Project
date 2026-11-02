'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  HelpCircle,
  ArrowLeft,
  Upload,
  Calendar,
  MapPin,
  Tag,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const reportLostSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(2, 'Please specify the campus location where you lost it'),
  dateLost: z.string().min(1, 'Please select the date lost'),
  description: z
    .string()
    .min(10, 'Please describe the item in detail (colors, brand, scratches, distinguishing marks)')
    .max(1000, 'Description too long'),
  imageUrl: z.string().optional(),
});

type ReportLostFormValues = z.infer<typeof reportLostSchema>;

const CATEGORIES = [
  'Electronics',
  'Stationery',
  'Personal',
  'Accessories',
  'Bags',
  'Books',
  'Clothing',
  'Keys',
  'Other',
];

export default function ReportLostPage() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportLostFormValues>({
    resolver: zodResolver(reportLostSchema),
    defaultValues: {
      title: '',
      category: 'Electronics',
      location: '',
      dateLost: new Date().toISOString().split('T')[0],
      description: '',
      imageUrl: '',
    },
  });

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      try {
        const res = await api.uploads.uploadFile(file);
        setImagePreview(res.url);
        setValue('imageUrl', res.url);
        toast.success('Image uploaded successfully');
      } catch (err: any) {
        toast.error('Failed to upload image preview');
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('imageUrl', '');
  };

  const onSubmit = (data: ReportLostFormValues) => {
    startTransition(async () => {
      try {
        const item = await api.lost.create({
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          dateLost: new Date(data.dateLost).toISOString(),
          imageUrl: data.imageUrl,
        });

        toast.success('Lost item report posted! Campus peers are on the lookout.');
        router.push(`/lost-found/${item.id}`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to post lost item report');
      }
    });
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-0">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/lost-found"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Lost & Found</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 shrink-0">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Report a Lost Item
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Provide specific details. When someone finds an item matching your description, you&apos;ll be notified.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Item Title *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g. Black AirPods Pro Case with blue carabiner"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Category & Date Lost Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Date Lost *
                </label>
                <div className="relative">
                  <input
                    {...register('dateLost')}
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  />
                </div>
                {errors.dateLost && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">
                    {errors.dateLost.message}
                  </p>
                )}
              </div>
            </div>

            {/* Campus Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Last Seen Location *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  {...register('location')}
                  type="text"
                  placeholder="e.g. Student Union 2nd Floor, near cafeteria sofa"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
              {errors.location && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Detailed Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Include scratches, custom stickers, case colors, serial number fragments, or accessories attached..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Photo (Optional but recommended)
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 w-full h-48 bg-neutral-100 dark:bg-neutral-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-2xl cursor-pointer bg-neutral-50/50 dark:bg-neutral-800/40 transition-colors">
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Click or drag photo here
                  </span>
                  <span className="text-xs text-neutral-400 mt-1">PNG, JPG or WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isPending ? 'Publishing Report...' : 'Publish Lost Item Report'}</span>
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
