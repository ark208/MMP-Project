'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  CheckCircle,
  ArrowLeft,
  Upload,
  Calendar,
  MapPin,
  Lock,
  Building2,
  Check,
  X,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const registerFoundSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(2, 'Please specify where on campus you found it'),
  dateFound: z.string().min(1, 'Please select the date found'),
  description: z
    .string()
    .min(10, 'Please provide a general description without giving away secret details')
    .max(1000, 'Description too long'),
  secretQuestion: z
    .string()
    .min(5, 'Secret question is required so the true owner can verify themselves')
    .max(200, 'Secret question too long'),
  secretAnswer: z
    .string()
    .min(1, 'Secret answer is required for ownership verification'),
  holdingLocation: z
    .enum(['with finder', 'security office', 'department']),
  keptAt: z
    .string()
    .min(3, 'Please specify where the item is securely kept or surrendered'),
  imageUrl: z.string().optional(),
});

type RegisterFoundFormValues = z.infer<typeof registerFoundSchema>;

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

export default function RegisterFoundPage() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFoundFormValues>({
    resolver: zodResolver(registerFoundSchema),
    defaultValues: {
      title: '',
      category: 'Electronics',
      location: '',
      dateFound: new Date().toISOString().split('T')[0],
      description: '',
      secretQuestion: '',
      secretAnswer: '',
      holdingLocation: 'security office',
      keptAt: 'Campus Security Central Office - Room 102',
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
      } catch (err) {
        toast.error('Failed to upload image preview');
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('imageUrl', '');
  };

  const onSubmit = (data: RegisterFoundFormValues) => {
    startTransition(async () => {
      try {
        const item = await api.found.create({
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          dateFound: new Date(data.dateFound).toISOString(),
          imageUrl: data.imageUrl,
          secretQuestion: data.secretQuestion,
          secretAnswer: data.secretAnswer,
          holdingLocation: data.holdingLocation,
          keptAt: data.keptAt,
        });

        toast.success('Found item successfully registered with secret verification!');
        router.push(`/lost-found/${item.id}`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to register found item');
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
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Register a Found Item
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Safeguard the item and require the real owner to answer a verification question before claiming.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
          {/* Tip Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <span className="font-bold">Anti-Fraud Safeguard:</span> When registering a found item, do not reveal unique stickers, keychain colors, or engravings in the photo/description. Set those as the <span className="font-bold underline">Secret Verification Question</span>.
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Item Title *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g. Silver MacBook Air M2 13-inch"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Category & Date Found Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                  Date Found *
                </label>
                <input
                  {...register('dateFound')}
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {errors.dateFound && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">
                    {errors.dateFound.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location Found */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Where it was found *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  {...register('location')}
                  type="text"
                  placeholder="e.g. Tech Hub 2nd Floor study cubicle"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              {errors.location && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* General Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Public Description *
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="General description without giving away the secret answer (e.g. 'Found unattended laptop in transparent protective case')."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Secret Verification Question */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Secret Question for Owner Verification *</span>
              </label>
              <input
                {...register('secretQuestion')}
                type="text"
                placeholder="e.g. What specific anime stickers are stuck on the lid?"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                The owner must answer this question to prove ownership when submitting a claim.
              </p>
              {errors.secretQuestion && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.secretQuestion.message}
                </p>
              )}
            </div>

            {/* Where It's Kept */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Where it&apos;s kept / Safe Custody Location *</span>
              </label>
              <input
                {...register('keptAt')}
                type="text"
                placeholder="e.g. Campus Security Central Office - Room 102 or Hostel 3 Warden Desk"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[11px] text-neutral-500">
                Let peers know where they can collect the verified item in person.
              </p>
              {errors.keptAt && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.keptAt.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Photo (Optional)
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
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl cursor-pointer bg-neutral-50/50 dark:bg-neutral-800/40 transition-colors">
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
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isPending ? 'Registering...' : 'Register Found Item & Enable Claims'}</span>
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
