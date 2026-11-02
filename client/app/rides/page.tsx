'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  UserMinus,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { ridesApi, chatApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import type { Ride, RideStatus, FareSplitInfo } from '@docs/types';

const CAMPUS_PRESETS = ['Main Gate', 'Hostels', 'Library', 'Station'];

export default function RidesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [origin, setOrigin] = useState('Main Gate');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [totalSeats, setTotalSeats] = useState<number>(4);
  const [estimatedFare, setEstimatedFare] = useState<number>(60);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Fare Splitter State
  const [activeRideForSplit, setActiveRideForSplit] = useState<Ride | null>(null);
  const [customFareInput, setCustomFareInput] = useState<number>(60);
  const [fareSplitResult, setFareSplitResult] = useState<FareSplitInfo | null>(null);

  useEffect(() => {
    loadRides();
  }, [filterStatus]);

  async function loadRides() {
    try {
      setLoading(true);
      const params = filterStatus !== 'ALL' ? { status: filterStatus } : undefined;
      const data = await ridesApi.list(params);
      setRides(data);
      if (data.length > 0 && !activeRideForSplit) {
        selectRideForSplit(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load rides:', err);
    } finally {
      setLoading(false);
    }
  }

  async function selectRideForSplit(ride: Ride) {
    setActiveRideForSplit(ride);
    setCustomFareInput(ride.estimatedFare || 60);
    try {
      const split = await ridesApi.getFareSplit(ride.id, ride.estimatedFare);
      setFareSplitResult(split);
    } catch (err) {
      console.warn('Fare split fetch error:', err);
    }
  }

  async function handleRecalculateFare(newFare: number) {
    setCustomFareInput(newFare);
    if (!activeRideForSplit) return;
    try {
      const split = await ridesApi.getFareSplit(activeRideForSplit.id, newFare);
      setFareSplitResult(split);
    } catch (err) {
      console.warn('Fare split update error:', err);
    }
  }

  async function handleCreateRide(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      toast.error('Please specify pickup origin, destination, and departure date.');
      return;
    }

    try {
      setSubmitting(true);
      const combinedDateTime = new Date(`${departureDate}T${departureTime}:00`).toISOString();
      const newRide = await ridesApi.create({
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: combinedDateTime,
        totalSeats: Number(totalSeats),
        estimatedFare: Number(estimatedFare),
        notes: notes.trim() || undefined,
      });

      toast.success(`Ride from ${newRide.origin} to ${newRide.destination} posted!`);

      setShowCreateForm(false);
      setDestination('');
      setNotes('');
      loadRides();
      selectRideForSplit(newRide);
    } catch (err: any) {
      toast.error(err.message || 'Could not register ride offer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinRide(rideId: string) {
    try {
      const result = await ridesApi.join(rideId);
      toast.success(`Seat Confirmed! ${result.availableSeats} seat(s) remaining.`);
      await loadRides();
      const updated = await ridesApi.get(rideId);
      selectRideForSplit(updated);
    } catch (err: any) {
      toast.error(err.message || 'This ride might be full or already joined.');
    }
  }

  async function handleLeaveRide(rideId: string) {
    try {
      await ridesApi.leave(rideId);
      toast.info('You have left the ride.');
      await loadRides();
      const updated = await ridesApi.get(rideId);
      selectRideForSplit(updated);
    } catch (err: any) {
      toast.error(err.message || 'Could not leave ride.');
    }
  }

  async function handleOpenRideChat(rideId: string) {
    // Navigate directly to chat
    router.push('/chat');
  }

  const getStatusBadge = (status: RideStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open
          </span>
        );
      case 'FULL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Full
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Car className="w-4 h-4" />
            <span>Campus Ride Sharing & Splitting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Share Cabs, Save Money, Split Fares
          </h1>
          <p className="text-sm text-indigo-100 max-w-xl">
            Book cabs together to the airport, railway station, or weekend spots. Equal split calculated instantly, with zero overbooking.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="self-start md:self-center flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-sm shadow-md hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Close Form' : 'Offer Ride Share'}</span>
        </button>
      </div>

      {/* Create Ride Form */}
      {showCreateForm && (
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Offer a New Ride Share</span>
            </h2>
            <span className="text-xs text-neutral-500">Pick campus presets for fast posting</span>
          </div>

          <form onSubmit={handleCreateRide} className="space-y-4">
            {/* Campus Pickup Presets */}
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2">
                Campus Pickup Point Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {CAMPUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOrigin(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      origin === preset
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    📍 {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Pickup Origin *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Gate"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Destination *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Airport Terminal 3, Railway Station"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Departure Date *
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Departure Time *
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Total Vehicle Capacity (Including Driver/Creator) *
                </label>
                <select
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 Passengers (1 available)</option>
                  <option value={3}>3 Passengers (2 available)</option>
                  <option value={4}>4 Passengers (3 available - Standard Cab)</option>
                  <option value={6}>6 Passengers (5 available - XL Cab)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Estimated Total Fare (₹ or $)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={estimatedFare}
                  onChange={(e) => setEstimatedFare(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Notes & Luggage Capacity
              </label>
              <input
                type="text"
                placeholder="e.g. Leaving promptly at 6 AM. Room for 1 large suitcase per passenger."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Post Ride Offer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split: Ride List & Interactive Live Fare Splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ride Offers List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
              {['ALL', 'OPEN', 'FULL', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterStatus === st
                      ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Rides' : st}
                </button>
              ))}
            </div>

            <span className="text-xs text-neutral-500">
              Showing {rides.length} ride offer{rides.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-neutral-500 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              Loading campus rides...
            </div>
          ) : rides.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <Car className="w-10 h-10 text-neutral-400 mx-auto" />
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">No Rides Found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No active rides matching this status. Be the first to offer a ride share!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                + Offer Ride
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => {
                const isSelected = activeRideForSplit?.id === ride.id;
                const isCreator = user && (ride.creatorId === user.id || ride.creator?.id === user.id);
                const isPassenger = user && ride.passengers?.some((p) => p.userId === user.id);
                const hasSeats = ride.availableSeats > 0 && ride.status === 'OPEN';

                const depFormatted = new Date(ride.departureTime).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ride.id}
                    onClick={() => selectRideForSplit(ride)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {getStatusBadge(ride.status)}
                          <span className="text-xs text-neutral-500 font-medium">
                            {depFormatted}
                          </span>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-2 font-black text-base text-neutral-900 dark:text-white">
                          <span>{ride.origin}</span>
                          <ArrowRight className="w-4 h-4 text-indigo-500" />
                          <span>{ride.destination}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          ₹{ride.estimatedFare}
                        </div>
                        <span className="text-[10px] text-neutral-400 block">Total Est. Fare</span>
                      </div>
                    </div>

                    {/* Middle bar: Seats & Passengers */}
                    <div className="mt-4 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={ride.creator?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={ride.creator?.name || 'Creator'}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {ride.creator?.name || 'Student Creator'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                          💺 {ride.availableSeats} of {ride.totalSeats} seats left
                        </span>

                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          ≈ ₹{(ride.estimatedFare / (ride.passengers?.length || 1)).toFixed(0)}/person
                        </span>
                      </div>
                    </div>

                    {ride.notes && (
                      <div className="mt-2.5 text-xs text-neutral-500 italic">
                        &ldquo;{ride.notes}&rdquo;
                      </div>
                    )}

                    {/* Bottom Actions Bar */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectRideForSplit(ride);
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Live Fare Splitter</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isPassenger && !isCreator && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveRide(ride.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Leave</span>
                          </button>
                        )}

                        {isPassenger ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRideChat(ride.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Ride Chat</span>
                          </button>
                        ) : hasSeats ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinRide(ride.id);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Join Ride</span>
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400 font-semibold px-2 py-1">
                            Ride Full
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Fare Splitter Tool */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Live Fare Splitter
                  </h3>
                  <span className="text-[11px] text-neutral-500">
                    Real-time equal division calculator
                  </span>
                </div>
              </div>

              {activeRideForSplit && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                  {fareSplitResult?.passengerCount || activeRideForSplit.passengers?.length || 1} Rider{(fareSplitResult?.passengerCount || 1) === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {activeRideForSplit ? (
              <div className="space-y-4">
                {/* Active Ride Indicator */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Selected Journey
                  </div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>{activeRideForSplit.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{activeRideForSplit.destination}</span>
                  </div>
                </div>

                {/* Input: Total Fare */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Enter Estimated or Actual Total Fare (₹ or $)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={customFareInput}
                      onChange={(e) => handleRecalculateFare(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Change this value anytime (e.g. meter reading or Uber surge price)
                  </span>
                </div>

                {/* Equal Share Result Callout */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg space-y-1 text-center">
                  <div className="text-xs uppercase font-bold tracking-wider text-indigo-100">
                    Each Person Pays
                  </div>
                  <div className="text-3xl font-black font-mono tracking-tight">
                    ₹{fareSplitResult?.farePerPerson || (customFareInput / (activeRideForSplit.passengers?.length || 1)).toFixed(2)}
                  </div>
                  <div className="text-xs text-indigo-200">
                    Split equally across {fareSplitResult?.passengerCount || activeRideForSplit.passengers?.length || 1} passenger(s)
                  </div>
                </div>

                {/* Participant breakdown list */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Confirmed Passengers Share:
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(fareSplitResult?.participants || activeRideForSplit.passengers || []).map((p: any, idx: number) => {
                      const name = p.name || p.user?.name || `Passenger ${idx + 1}`;
                      const amount = p.amount || fareSplitResult?.farePerPerson || (customFareInput / (activeRideForSplit.passengers?.length || 1)).toFixed(2);
                      const isMe = user && (p.userId === user.id);

                      return (
                        <div
                          key={p.userId || idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                              {name[0]}
                            </div>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {name} {isMe && '(You)'}
                            </span>
                          </div>

                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                Click any ride on the left to inspect its live fare split!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
