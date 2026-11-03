"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  LogOut,
  Edit3,
  Search,
  CheckCircle,
  Tag,
  ArrowRight,
  X,
  Check,
  CheckCheck,
  Bell,
} from "lucide-react";
import type { LostItem, Listing } from "@docs/types";
import { ExtendedFoundItem } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  avatarUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"lost" | "found" | "listings">(
    "lost",
  );
  const [loading, setLoading] = useState(true);
  const [myLost, setMyLost] = useState<LostItem[]>([]);
  const [myFound, setMyFound] = useState<ExtendedFoundItem[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, reset]);

  useEffect(() => {
    async function loadUserItems() {
      if (!user) return;
      try {
        setLoading(true);
        const [allLost, allFound, allListings] = await Promise.all([
          api.lost.list(),
          api.found.list(),
          api.marketplace.list(),
        ]);

        setMyLost(allLost.filter((i) => i.userId === user.id));
        setMyFound(allFound.filter((i) => i.userId === user.id));
        setMyListings(allListings.filter((i) => i.sellerId === user.id));
      } catch (err) {
        console.error("Failed to load user items:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserItems();
  }, [user]);

  const onUpdateProfile = (data: ProfileFormValues) => {
    startTransition(async () => {
      try {
        await updateProfile({
          name: data.name,
          phone: data.phone || null,
          avatarUrl: data.avatarUrl || null,
        });
        setShowEditModal(false);
        toast.success("Profile details updated!");
      } catch (err: any) {
        toast.error(err.message || "Failed to update profile");
      }
    });
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
        {/* Profile Header Card */}
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative">
              <img
                src={
                  user?.avatarUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                }
                alt={user?.name || "User"}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-[#B9573B]/20 shadow-md"
              />
              <span className="absolute bottom-1 right-1 p-1 rounded-full bg-[#B9573B] text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                    {user?.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FBEFEA] dark:bg-[#4A2920] text-[#9E452D] dark:text-[#E8B5A4]">
                      Verified Student
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Member since{" "}
                      {user?.createdAt
                        ? new Date(user.createdAt).getFullYear()
                        : "2026"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <Link
                    href="/notifications/settings"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notification Settings</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Details line */}
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-neutral-500 justify-center sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{user?.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40">
              <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                {myLost.length}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">Lost Posts</div>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40">
              <div className="text-xl font-black text-[#B9573B] dark:text-[#D98B72]">
                {myFound.length}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Found Registered
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40">
              <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                {myListings.length}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Market Listings
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("lost")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "lost"
                ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            My Lost Posts ({myLost.length})
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "found"
                ? "border-[#B9573B] text-[#B9573B] dark:border-[#D98B72] dark:text-[#D98B72]"
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            My Found Items ({myFound.length})
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "listings"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            My Listings ({myListings.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : (
          <div>
            {/* 1. LOST ITEMS TAB */}
            {activeTab === "lost" && (
              <div>
                {myLost.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="You haven't reported any lost items"
                    description="If you ever misplace keys, laptops, or textbooks, report them right away."
                    actionHref="/lost-found/report-lost"
                    actionLabel="Report Lost Item"
                  />
                ) : (
                  <div className="space-y-3">
                    {myLost.map((item) => (
                      <Link
                        key={item.id}
                        href={`/lost-found/${item.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-[#DCA18F] dark:hover:border-[#8A5140] transition-all shadow-xs gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.imageUrl ||
                              "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=200&q=80"
                            }
                            alt={item.title}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {item.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.status === "RESOLVED"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              {item.location} •{" "}
                              {new Date(item.dateLost).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-[#B9573B] dark:text-[#D98B72] flex items-center gap-1 self-end sm:self-center">
                          <span>View & Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. FOUND ITEMS TAB */}
            {activeTab === "found" && (
              <div>
                {myFound.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="You haven't registered any found items"
                    description="Be a helpful campus member! Safely register items you find on campus grounds."
                    actionHref="/lost-found/register-found"
                    actionLabel="Register Found Item"
                  />
                ) : (
                  <div className="space-y-3">
                    {myFound.map((item) => (
                      <Link
                        key={item.id}
                        href={`/lost-found/${item.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-[#DCA18F] dark:hover:border-[#8A5140] transition-all shadow-xs gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.imageUrl ||
                              "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=200&q=80"
                            }
                            alt={item.title}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {item.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.status === "RESOLVED"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : item.status === "CLAIMED"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : "bg-[#FBEFEA] text-[#9E452D] dark:bg-[#4A2920] dark:text-[#E8B5A4]"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              Held at: {item.keptAt || "Custody"} •{" "}
                              {new Date(item.dateFound).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-[#B9573B] dark:text-[#D98B72] flex items-center gap-1 self-end sm:self-center">
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. LISTINGS TAB */}
            {activeTab === "listings" && (
              <div>
                {myListings.length === 0 ? (
                  <EmptyState
                    icon={Tag}
                    title="You have no marketplace listings"
                    description="Sell textbooks, calculators, and dorm gear to peers on campus."
                    actionHref="/marketplace/create"
                    actionLabel="Create Listing"
                  />
                ) : (
                  <div className="space-y-3">
                    {myListings.map((item) => (
                      <Link
                        key={item.id}
                        href={`/marketplace/${item.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-xs gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.imageUrls[0] ||
                              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80"
                            }
                            alt={item.title}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {item.title}
                              </h3>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800">
                                {item.status}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1 font-semibold text-purple-600 dark:text-purple-400">
                              ${item.price.toFixed(2)} •{" "}
                              {item.condition.replace("_", " ")}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 self-end sm:self-center">
                          <span>View Listing</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* EDIT PROFILE MODAL */}
        {/* ============================================================== */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">
                  Edit Profile
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onUpdateProfile)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Display Name *
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    {...register("avatarUrl")}
                    type="url"
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                  />
                  {errors.avatarUrl && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.avatarUrl.message}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#B9573B] hover:bg-[#A84932] text-white text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
