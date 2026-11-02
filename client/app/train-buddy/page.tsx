'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Train,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  Users,
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TrainTrip, TrainBuddyMatch } from '@docs/types';

function TrainBuddyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingTrips, setFetchingTrips] = useState(true);
  const [myTrips, setMyTrips] = useState<TrainTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TrainTrip | null>(null);
  const [buddies, setBuddies] = useState<TrainBuddyMatch[]>([]);
  const [loadingBuddies, setLoadingBuddies] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);

  // Form State
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [date, setDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');

  // Load user trips
  const loadTrips = async () => {
    try {
      setFetchingTrips(true);
      const trips = await api.trips.listMine();
      setMyTrips(trips);
      if (trips.length > 0 && !selectedTrip) {
        handleSelectTrip(trips[0]);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setFetchingTrips(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleSelectTrip = async (trip: TrainTrip) => {
    setSelectedTrip(trip);
    try {
      setLoadingBuddies(true);
      const matches = await api.trips.getBuddies(trip.id);
      setBuddies(matches);
    } catch (err) {
      console.error('Failed to get buddies:', err);
    } finally {
      setLoadingBuddies(false);
    }
  };

  const handlePostTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainNumber.trim() || !fromStation.trim() || !toStation.trim() || !date) {
      toast.error('Please fill in train number, route, and travel date.');
      return;
    }

    try {
      setLoading(true);
      const newTrip = await api.trips.create({
        trainNumber: trainNumber.trim(),
        trainName: trainName.trim() || undefined,
        fromStation: fromStation.trim().toUpperCase(),
        toStation: toStation.trim().toUpperCase(),
        date,
        departureTime: departureTime || undefined,
      });

      toast.success('Train journey saved! Checking buddy radar...');

      // Reset form
      setTrainNumber('');
      setTrainName('');
      setFromStation('');
      setToStation('');
      setDate('');
      setDepartureTime('');

      // Refresh and select
      await loadTrips();
      handleSelectTrip(newTrip);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register trip');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to remove this journey from your radar?')) return;
    try {
      await api.trips.delete(tripId);
      toast.info('Journey removed.');
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
        setBuddies([]);
      }
      loadTrips();
    } catch (err) {
      toast.error('Failed to delete trip');
    }
  };

  const handleStartChat = async (peerUserId: string) => {
    try {
      setStartingChatUserId(peerUserId);
      const conv = await api.chat.getOrCreate(peerUserId);
      router.push(`/chat?id=${conv.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start chat');
      setStartingChatUserId(null);
    }
  };

  const handleQuickPreset = (tNum: string, tName: string, from: string, to: string) => {
    setTrainNumber(tNum);
    setTrainName(tName);
    setFromStation(from);
    setToStation(to);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                Train Buddy Radar
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Discover campus classmates & batchmates traveling on the same train journey.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRIVACY ASSURANCE NOTE (MANDATORY REQUIREMENT) */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm tracking-tight text-emerald-900 dark:text-emerald-300">
              Your PNR and seat number are never stored.
            </h3>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
              CampusLoop only matches the public train number, travel date, and station route.
              Your private booking credentials, phone number, and student email are strictly protected and never exposed.
            </p>
          </div>
        </div>

        {/* Main Grid: Form on Left / Top, Results on Right / Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================== */}
          {/* LEFT: ADD TRAIN JOURNEY FORM */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Register Upcoming Trip</span>
                </h2>
                <span className="text-[11px] font-semibold text-neutral-400">Step 1</span>
              </div>

              {/* Route Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Popular Student Routes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('12951', 'Mumbai Rajdhani', 'NDLS', 'BCT')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-neutral-700 transition-colors"
                  >
                    12951 Rajdhani (NDLS → BCT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('12002', 'Bhopal Shatabdi', 'NDLS', 'BPL')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-neutral-700 transition-colors"
                  >
                    12002 Shatabdi (NDLS → BPL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('12432', 'Trivandrum Rajdhani', 'NZM', 'TVC')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-neutral-700 transition-colors"
                  >
                    12432 Rajdhani (NZM → TVC)
                  </button>
                </div>
              </div>

              <form onSubmit={handlePostTrip} className="space-y-4">
                {/* Train Number & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Train Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12951"
                      value={trainNumber}
                      onChange={(e) => setTrainNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Train Name <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajdhani Express"
                      value={trainName}
                      onChange={(e) => setTrainName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Stations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      From Station <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. NDLS"
                        value={fromStation}
                        onChange={(e) => setFromStation(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      To Station <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. BCT"
                        value={toStation}
                        onChange={(e) => setToStation(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Date of Journey <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Departure Time <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Train className="w-4 h-4" />
                  <span>{loading ? 'Registering...' : 'Find Train Buddies'}</span>
                </button>
              </form>
            </div>

            {/* My Saved Journeys */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                My Active Journeys ({myTrips.length})
              </h3>
              {fetchingTrips ? (
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse text-xs text-neutral-400">
                  Loading journeys...
                </div>
              ) : myTrips.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center text-xs text-neutral-400">
                  No upcoming train journeys registered yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {myTrips.map((trip) => {
                    const isSelected = selectedTrip?.id === trip.id;
                    return (
                      <div
                        key={trip.id}
                        onClick={() => handleSelectTrip(trip)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">
                              #{trip.trainNumber}
                            </span>
                            {trip.trainName && (
                              <span className="text-xs text-neutral-500 truncate max-w-[140px]">
                                {trip.trainName}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {trip.fromStation || trip.originStation}
                            </span>
                            <span>&rarr;</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {trip.toStation || trip.destinationStation}
                            </span>
                            <span>•</span>
                            <span>{trip.date || trip.departureDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrip(trip.id);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Remove journey"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT: BUDDY RADAR RESULT CARD (CRITICAL REQUIREMENT) */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {selectedTrip ? (
              <div className="space-y-6">
                {/* Result Card Banner */}
                <div className="p-6 rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Radar Match</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      Train #{selectedTrip.trainNumber} • {selectedTrip.fromStation || selectedTrip.originStation} &rarr; {selectedTrip.toStation || selectedTrip.destinationStation}
                    </span>
                  </div>

                  {/* "X students are on your train" Display (CRITICAL) */}
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                      {loadingBuddies
                        ? 'Scanning radar...'
                        : `${buddies.length} student${buddies.length === 1 ? '' : 's'} ${buddies.length === 1 ? 'is' : 'are'} on your train`}
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Departing on {selectedTrip.date || selectedTrip.departureDate}
                      {selectedTrip.departureTime ? ` at ${selectedTrip.departureTime}` : ''}.
                    </p>
                  </div>
                </div>

                {/* Buddies Grid */}
                {loadingBuddies ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-44 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                    ))}
                  </div>
                ) : buddies.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No other students matched yet"
                    description={`You're the first student registered for Train #${selectedTrip.trainNumber} on ${selectedTrip.date || selectedTrip.departureDate}. We'll notify you as soon as a peer registers!`}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {buddies.map((buddy, index) => {
                      const peer = buddy.trip.user;
                      const peerName = peer?.name || 'Classmate';
                      const peerDept = peer?.department || 'Engineering Student';
                      const peerYear = peer?.year || 'Campus Peer';
                      const isConnecting = startingChatUserId === peer?.id;

                      return (
                        <div
                          key={buddy.trip.id || index}
                          className="flex flex-col justify-between p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-all space-y-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <img
                              src={
                                peer?.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName}`
                              }
                              alt={peerName}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-base text-neutral-900 dark:text-white truncate">
                                {peerName}
                              </h4>
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                                {peerDept}
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate">
                                {peerYear}
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                              <span>Same route & date:</span>
                              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                Confirmed
                              </span>
                            </div>

                            {/* Privacy Note Badge on Peer Card */}
                            <div className="text-[10px] text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-xl flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Contact details protected</span>
                            </div>

                            {/* "Start chat" Button (CRITICAL REQUIREMENT) */}
                            {peer?.id && (
                              <button
                                onClick={() => handleStartChat(peer.id)}
                                disabled={isConnecting}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs transition-colors shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{isConnecting ? 'Opening Chat...' : 'Start chat'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-3">
                <Train className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto" />
                <h3 className="font-bold text-base text-neutral-700 dark:text-neutral-300">
                  Select or Register a Train Journey
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Submit the form on the left to activate your radar and discover batchmates on your exact train & route.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function TrainBuddyPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-neutral-400">Loading Train Buddy...</div>}>
      <TrainBuddyContent />
    </React.Suspense>
  );
}
