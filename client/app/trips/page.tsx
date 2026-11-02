'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Train,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Users,
  MessageCircle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { tripsApi, chatApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import type { TrainTrip, TrainBuddyMatch } from '@docs/types';

export default function TrainBuddyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [trips, setTrips] = useState<TrainTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TrainTrip | null>(null);
  const [buddies, setBuddies] = useState<TrainBuddyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingBuddies, setSearchingBuddies] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [date, setDate] = useState('');
  const [departureTime, setDepartureTime] = useState('16:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch my trips
  useEffect(() => {
    loadMyTrips();
  }, []);

  async function loadMyTrips() {
    try {
      setLoading(true);
      const data = await tripsApi.getMine();
      setTrips(data);
      if (data.length > 0) {
        handleSelectTrip(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTrip(trip: TrainTrip) {
    setSelectedTrip(trip);
    setSearchingBuddies(true);
    try {
      const matchData = await tripsApi.getBuddies(trip.id);
      setBuddies(matchData);
    } catch (err) {
      console.error('Failed to fetch buddies:', err);
    } finally {
      setSearchingBuddies(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trainNumber || !fromStation || !toStation || !date) {
      toast.error('Please fill in train number, origin, destination, and departure date.');
      return;
    }

    try {
      setSubmitting(true);
      const newTrip = await tripsApi.post({
        trainNumber: trainNumber.trim(),
        trainName: trainName.trim() || undefined,
        fromStation: fromStation.trim().toUpperCase(),
        toStation: toStation.trim().toUpperCase(),
        date,
        departureTime,
        notes: notes.trim() || undefined,
      });

      toast.success(`Train #${newTrip.trainNumber} posted! Radar scanning for fellow students.`);

      // Reset form
      setTrainNumber('');
      setTrainName('');
      setFromStation('');
      setToStation('');
      setDate('');
      setNotes('');
      setShowAddForm(false);

      // Reload
      const updated = await tripsApi.getMine();
      setTrips(updated);
      handleSelectTrip(newTrip);
    } catch (err: any) {
      toast.error(err.message || 'Could not register your train journey.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(tripId: string) {
    try {
      await tripsApi.delete(tripId);
      toast.info('Your train journey has been removed from radar.');
      const updated = await tripsApi.getMine();
      setTrips(updated);
      if (selectedTrip?.id === tripId) {
        if (updated.length > 0) {
          handleSelectTrip(updated[0]);
        } else {
          setSelectedTrip(null);
          setBuddies([]);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete trip.');
    }
  }

  async function handleStartChat(recipientId: string, recipientName: string) {
    try {
      const conv = await chatApi.startConversation(recipientId);
      toast.success(`Starting direct conversation with ${recipientName}.`);
      router.push(`/chat?id=${conv.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Error creating chat session.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-500/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Train className="w-4 h-4" />
            <span>Train Buddy Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Find Batchmates on Your Train
          </h1>
          <p className="text-sm text-teal-100 max-w-xl">
            Never travel alone. Discover fellow campus students booked on the same train, route, and date to share auto-rickshaws, chai, and company!
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="self-start md:self-center flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-teal-900 font-bold text-sm shadow-md hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Post My Train Trip'}</span>
        </button>
      </div>

      {/* Strict Privacy Notice Required by Contract */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-bold">Strict Privacy Guaranteed:</strong> Your PNR and seat number are <span className="underline font-bold">never stored</span> or requested.
          Buddy Radar only matches on public journey parameters (Train #, Date, and Route). Contact details like phone and email remain private.
        </div>
      </div>

      {/* Post Trip Form Modal / Collapsible */}
      {showAddForm && (
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Train className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Post Your Train Journey</span>
            </h2>
            <span className="text-xs text-neutral-500">All fields required except notes</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Train Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12951"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Train Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Rajdhani"
                  value={trainName}
                  onChange={(e) => setTrainName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Boarding Station (Code or Name) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. NDLS (New Delhi)"
                  value={fromStation}
                  onChange={(e) => setFromStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Destination Station *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BCT (Mumbai Central)"
                  value={toStation}
                  onChange={(e) => setToStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Departure Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Approx. Departure Time
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Journey Notes (e.g. coach preferences, luggage)
              </label>
              <input
                type="text"
                placeholder="e.g. Traveling in 3AC, carrying guitar and 1 large bag"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Activate Radar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split: My Trips List & Radar Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Registered Trips */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>My Active Journeys</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold">
                {trips.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-500 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              Scanning your trips...
            </div>
          ) : trips.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                <Train className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">No Upcoming Trips Posted</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Post your upcoming train details to discover fellow students traveling with you.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
              >
                + Post Your First Trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                return (
                  <div
                    key={trip.id}
                    onClick={() => handleSelectTrip(trip)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                          #{trip.trainNumber}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-neutral-900 dark:text-white">
                            {trip.trainName || `Train #${trip.trainNumber}`}
                          </div>
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{trip.departureDate || (trip as any).date}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(trip.id);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Delete Journey"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{trip.originStation || (trip as any).fromStation}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-400" />
                        <span>{trip.destinationStation || (trip as any).toStation}</span>
                      </div>

                      {trip.departureTime && (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{trip.departureTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Train Buddy Radar Match Results */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTrip ? (
            <div className="space-y-4">
              {/* Radar Status Header Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Radar Scan</span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white mt-1">
                      {searchingBuddies ? (
                        'Searching for fellow passengers...'
                      ) : (
                        `${buddies.length} student${buddies.length === 1 ? '' : 's'} on your train`
                      )}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Train #{selectedTrip.trainNumber} ({selectedTrip.originStation || (selectedTrip as any).fromStation} ➔ {selectedTrip.destinationStation || (selectedTrip as any).toStation}) on {selectedTrip.departureDate || (selectedTrip as any).date}
                    </p>
                  </div>

                  <div className="px-3 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
                    {buddies.length > 0 ? 'Matches Available' : 'Watching for Buddies'}
                  </div>
                </div>
              </div>

              {/* Buddy Cards */}
              {searchingBuddies ? (
                <div className="p-12 text-center text-sm text-neutral-500 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                  <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <span>Scanning batchmate databases for Train #{selectedTrip.trainNumber}...</span>
                </div>
              ) : buddies.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 mx-auto flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                    No Buddies Found Yet
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    You are the first student registered on this train. We will notify you instantly via push/chat when another batchmate registers this trip!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buddies.map((buddy, idx) => {
                    const matchTrip = buddy.trip;
                    const buddyUser = matchTrip.user;

                    return (
                      <div
                        key={matchTrip.id || idx}
                        className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={buddyUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                              alt={buddyUser?.name || 'Student'}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-500/20"
                            />
                            <div>
                              <div className="font-bold text-base text-neutral-900 dark:text-white">
                                {buddyUser?.name || 'Fellow Student'}
                              </div>
                              <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                                <span className="font-medium text-teal-700 dark:text-teal-400">
                                  {(buddyUser as any)?.department || 'Student'}
                                </span>
                                <span>•</span>
                                <span>{(buddyUser as any)?.year || 'Campus'}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartChat(matchTrip.userId, buddyUser?.name || 'Student')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm hover:scale-105 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Start Chat</span>
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                            <Train className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span>Train #{matchTrip.trainNumber} ({matchTrip.trainName || 'Express'})</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                            <span>{matchTrip.originStation || (matchTrip as any).fromStation} ➔ {matchTrip.destinationStation || (matchTrip as any).toStation}</span>
                          </div>
                        </div>

                        {matchTrip.notes && (
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 italic bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                            &ldquo;{matchTrip.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <Train className="w-10 h-10 text-neutral-400 mx-auto" />
              <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                Select or Post a Journey to Activate Radar
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
