"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Plus,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Calculator,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  MessageSquare,
  LogOut,
  X,
  Loader2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportButton } from "@/components/report/ReportButton";
import { SafetyBanner } from "@/components/safety/SafetyBanner";
import type { Ride, RideStatus, FareSplitInfo } from "@docs/types";

const CAMPUS_PICKUP_PRESETS = ["Main Gate", "Hostels", "Library", "Station"];

type GeoapifySuggestion = {
  place_id?: string;
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  lat: number;
  lon: number;
};

// Verified permanent campus location: Ranpur, Kota, Rajasthan.
// Geoapify can return unrelated results for the short query "IIIT Kota",
// so this exact local result is supplied directly.
const IIIT_KOTA_SUGGESTION: GeoapifySuggestion = {
  place_id: "campus-iiit-kota",
  formatted:
    "Indian Institute of Information Technology, Kota, Ranpur, Rajasthan, India",
  address_line1: "Indian Institute of Information Technology, Kota",
  address_line2: "Ranpur, Kota, Rajasthan, India",
  lat: 25.0499,
  lon: 75.8321,
};

const isIIITKotaQuery = (value: string) => {
  const query = value.trim().toLowerCase().replace(/[.,]/g, " ");
  return (
    query === "iiit" ||
    query.includes("iiit kota") ||
    query.includes("indian institute of information technology kota")
  );
};

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

const RideNavigationMap = dynamic(
  () => import("@/components/rides/RideNavigationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] rounded-3xl bg-neutral-100 dark:bg-neutral-900 animate-pulse flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#B9573B] border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-bold text-neutral-500">
          Loading interactive campus map...
        </span>
      </div>
    ),
  },
);

export default function RidesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destinationCoords, setDestinationCoords] = useState<
    [number, number] | null
  >(null);
  const [originSuggestions, setOriginSuggestions] = useState<
    GeoapifySuggestion[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    GeoapifySuggestion[]
  >([]);
  const [originSearchLoading, setOriginSearchLoading] = useState(false);
  const [destinationSearchLoading, setDestinationSearchLoading] =
    useState(false);
  const [activeLocationInput, setActiveLocationInput] = useState<
    "origin" | "destination" | null
  >(null);
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [totalSeats, setTotalSeats] = useState(4);
  const [estimatedFare, setEstimatedFare] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingRide, setSubmittingRide] = useState(false);

  // Live Fare Splitter Modal State
  const [selectedRideForSplit, setSelectedRideForSplit] = useState<Ride | null>(
    null,
  );
  const [splitTotalFareInput, setSplitTotalFareInput] = useState<string>("");
  const [fareSplitResult, setFareSplitResult] = useState<FareSplitInfo | null>(
    null,
  );
  const [calculatingSplit, setCalculatingSplit] = useState(false);

  // Geoapify autocomplete: only selected suggestions become map coordinates.
  useEffect(() => {
    if (
      activeLocationInput !== "origin" ||
      origin.trim().length < 3 ||
      !GEOAPIFY_API_KEY
    ) {
      setOriginSuggestions([]);
      setOriginSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setOriginSearchLoading(true);
      try {
        // Always show the verified campus result for the campus alias.
        // Do not mix it with unrelated nationwide matches from Geoapify.
        if (isIIITKotaQuery(origin)) {
          setOriginSuggestions([IIIT_KOTA_SUGGESTION]);
          return;
        }

        const params = new URLSearchParams({
          text: origin.trim(),
          format: "json",
          limit: "5",
          filter: "countrycode:in|circle:75.8321,25.0499,40000",
          bias: "proximity:75.8321,25.0499",
          apiKey: GEOAPIFY_API_KEY,
        });
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(`Geoapify returned ${response.status}`);
        const data = await response.json();
        setOriginSuggestions(
          (data.results || []).filter(
            (item: GeoapifySuggestion) =>
              Number.isFinite(item.lat) &&
              Number.isFinite(item.lon) &&
              item.formatted,
          ),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[Rides] Pickup autocomplete failed:", error);
          setOriginSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setOriginSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [origin, activeLocationInput]);

  useEffect(() => {
    if (
      activeLocationInput !== "destination" ||
      destination.trim().length < 3 ||
      !GEOAPIFY_API_KEY
    ) {
      setDestinationSuggestions([]);
      setDestinationSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setDestinationSearchLoading(true);
      try {
        // Always show the verified campus result for the campus alias.
        // Do not mix it with unrelated nationwide matches from Geoapify.
        if (isIIITKotaQuery(destination)) {
          setDestinationSuggestions([IIIT_KOTA_SUGGESTION]);
          return;
        }

        const params = new URLSearchParams({
          text: destination.trim(),
          format: "json",
          limit: "5",
          filter: "countrycode:in|circle:75.8321,25.0499,40000",
          bias: "proximity:75.8321,25.0499",
          apiKey: GEOAPIFY_API_KEY,
        });
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(`Geoapify returned ${response.status}`);
        const data = await response.json();
        setDestinationSuggestions(
          (data.results || []).filter(
            (item: GeoapifySuggestion) =>
              Number.isFinite(item.lat) &&
              Number.isFinite(item.lon) &&
              item.formatted,
          ),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[Rides] Destination autocomplete failed:", error);
          setDestinationSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setDestinationSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, activeLocationInput]);

  const selectLocationSuggestion = (
    type: "origin" | "destination",
    suggestion: GeoapifySuggestion,
  ) => {
    const coordinates: [number, number] = [suggestion.lon, suggestion.lat];
    if (type === "origin") {
      setOrigin(suggestion.formatted);
      setOriginCoords(coordinates);
      setOriginSuggestions([]);
      setOriginSearchLoading(false);
    } else {
      setDestination(suggestion.formatted);
      setDestinationCoords(coordinates);
      setDestinationSuggestions([]);
      setDestinationSearchLoading(false);
    }
    setActiveLocationInput(null);
  };

  const handleOriginMapSelect = (address: string, coords: [number, number]) => {
    setOrigin(address);
    setOriginCoords(coords);
    setOriginSuggestions([]);
  };

  const handleDestinationMapSelect = (
    address: string,
    coords: [number, number],
  ) => {
    setDestination(address);
    setDestinationCoords(coords);
    setDestinationSuggestions([]);
  };

  const loadRides = async () => {
    try {
      setLoading(true);
      const data = await api.rides.list({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setRides(data || []);
    } catch (err) {
      console.error("Failed to load rides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, [statusFilter]);

  // Real-time Socket.io listener for ride updates (seats, status, joins)
  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();
      if (socket) {
        if (!socket.connected) {
          socket.connect();
        }

        const handleRideUpdated = (data: {
          id: string;
          availableSeats?: number;
          status?: string;
          updatedAt?: string;
        }) => {
          setRides((prev) =>
            prev.map((r) =>
              r.id === data.id
                ? {
                    ...r,
                    availableSeats:
                      data.availableSeats !== undefined
                        ? data.availableSeats
                        : r.availableSeats,
                    status: (data.status as any) || r.status,
                    updatedAt: data.updatedAt || new Date().toISOString(),
                  }
                : r,
            ),
          );
          setSelectedRideForSplit((prev) =>
            prev && prev.id === data.id
              ? {
                  ...prev,
                  availableSeats:
                    data.availableSeats !== undefined
                      ? data.availableSeats
                      : prev.availableSeats,
                  status: (data.status as any) || prev.status,
                }
              : prev,
          );
        };

        socket.on("ride:updated", handleRideUpdated);

        // Subscribe to listed rides
        rides.forEach((r) => {
          socket?.emit("ride:subscribe", r.id);
        });

        return () => {
          socket?.off("ride:updated", handleRideUpdated);
          rides.forEach((r) => {
            socket?.emit("ride:unsubscribe", r.id);
          });
        };
      }
    } catch (err) {
      console.warn("[Rides] Socket subscription error:", err);
    }
  }, [rides.length]);

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !origin.trim() ||
      !destination.trim() ||
      !departureDate ||
      !departureTime
    ) {
      toast.error("Please provide pickup origin, destination, date, and time.");
      return;
    }
    if (!originCoords || !destinationCoords) {
      toast.error(
        "Select a pickup and drop-off location from the search suggestions, or pin them on the map.",
      );
      return;
    }

    try {
      setSubmittingRide(true);
      const isoDateTime = new Date(
        `${departureDate}T${departureTime}`,
      ).toISOString();
      const fare = parseFloat(estimatedFare) || 0;

      await api.rides.create({
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: isoDateTime,
        totalSeats: Number(totalSeats),
        estimatedFare: fare,
        notes: notes.trim() || undefined,
      });

      toast.success("Ride offer published! Group chat activated.");
      setShowCreateForm(false);
      setOrigin("");
      setDestination("");
      setOriginCoords(null);
      setDestinationCoords(null);
      setOriginSuggestions([]);
      setDestinationSuggestions([]);
      setDepartureDate("");
      setDepartureTime("");
      setEstimatedFare("");
      setNotes("");
      loadRides();
    } catch (err: any) {
      toast.error(err.message || "Failed to create ride");
    } finally {
      setSubmittingRide(false);
    }
  };

  const handleJoinRide = async (rideId: string) => {
    try {
      setActionLoadingId(rideId);
      await api.rides.join(rideId);
      toast.success("You joined the ride! Seat reserved.");
      loadRides();
    } catch (err: any) {
      toast.error(err.message || "Failed to join ride");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeaveRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to leave this ride?")) return;
    try {
      setActionLoadingId(rideId);
      await api.rides.leave(rideId);
      toast.info("You left the ride. Seat released.");
      loadRides();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave ride");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (rideId: string, status: RideStatus) => {
    try {
      setActionLoadingId(rideId);
      await api.rides.updateStatus(rideId, status);
      toast.success(`Ride status updated to ${status}.`);
      loadRides();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Fare Splitter Modal
  const openFareSplitter = async (ride: Ride) => {
    setSelectedRideForSplit(ride);
    const initialFare = ride.estimatedFare.toString();
    setSplitTotalFareInput(initialFare);
    try {
      setCalculatingSplit(true);
      const splitInfo = await api.rides.getFareSplit(
        ride.id,
        ride.estimatedFare,
      );
      setFareSplitResult(splitInfo);
    } catch (err) {
      console.error("Failed to get fare split:", err);
    } finally {
      setCalculatingSplit(false);
    }
  };

  // Recalculate live when fare input changes
  const handleLiveFareChange = async (val: string) => {
    setSplitTotalFareInput(val);
    if (!selectedRideForSplit) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;

    try {
      const splitInfo = await api.rides.getFareSplit(
        selectedRideForSplit.id,
        num,
      );
      setFareSplitResult(splitInfo);
    } catch (err) {
      // Fallback local live computation
      const members = selectedRideForSplit.members ||
        selectedRideForSplit.passengers || [
          {
            userId: selectedRideForSplit.creatorId,
            user: selectedRideForSplit.creator,
          },
        ];
      const count = Math.max(1, members.length);
      const perPerson = parseFloat((num / count).toFixed(2));
      setFareSplitResult({
        rideId: selectedRideForSplit.id,
        totalFare: num,
        passengerCount: count,
        farePerPerson: perPerson,
        participants: members.map((m: any) => ({
          userId: m.userId,
          name: m.user?.name || "Passenger",
          amount: perPerson,
        })),
      });
    }
  };

  const getStatusBadge = (status: RideStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F5DDD6] dark:bg-[#2a1410]/60 text-[#8f3f27] dark:text-[#d4795c]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FDF4F1]0 animate-pulse" />
            OPEN
          </span>
        );
      case "FULL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            FULL
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            COMPLETED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F5DDD6] dark:bg-[#2a1410]/60 text-[#B9573B] dark:text-[#d4795c]">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                Campus Rides & Fare Splitting
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Share rides to airports, railway stations, and city hubs with
                equal automated split fares.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#a34e34] text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:shadow-lg self-start sm:self-center"
          >
            {showCreateForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{showCreateForm ? "Cancel Offer" : "Offer a Ride"}</span>
          </button>
        </div>

        {/* Safety Tips Banner */}
        <SafetyBanner type="rides" defaultExpanded={false} />

        {/* ============================================================== */}
        {/* INTERACTIVE NAVIGATION MAP & CREATE RIDE SHARE SECTION */}
        {/* ============================================================== */}
        {showCreateForm && (
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden animate-in slide-in-from-top-4">
            <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-[580px]">
              {/* LEFT COLUMN (approx 58%): Interactive Navigation Map */}
              <div className="lg:col-span-7 h-[380px] sm:h-[440px] lg:h-auto min-h-[380px] relative p-3 sm:p-4 bg-neutral-50/70 dark:bg-neutral-950/70 flex flex-col">
                <RideNavigationMap
                  originText={origin}
                  destinationText={destination}
                  selectedOriginCoords={originCoords}
                  selectedDestinationCoords={destinationCoords}
                  onOriginSelect={handleOriginMapSelect}
                  onDestinationSelect={handleDestinationMapSelect}
                  className="w-full flex-1 min-h-[350px] lg:min-h-full"
                />
              </div>

              {/* RIGHT COLUMN (approx 42%): Preserved Create Campus Ride Share Form */}
              <div className="lg:col-span-5 p-5 sm:p-6 lg:p-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#B9573B]" />
                    <span>Create Campus Ride Share</span>
                  </h2>
                  <span className="text-xs text-neutral-400">
                    Open to verified peers
                  </span>
                </div>

                <form onSubmit={handleCreateRide} className="space-y-4">
                  {/* Campus Pickup Point Presets (MANDATORY REQUIREMENT) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Campus Pickup Point Presets{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CAMPUS_PICKUP_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setOrigin(preset);
                            setOriginCoords(null);
                            setActiveLocationInput("origin");
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            origin === preset
                              ? "bg-[#B9573B] text-white shadow-xs"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Origin & Destination Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Pickup Location / Specific Gate{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#B9573B] absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="Search pickup location..."
                          value={origin}
                          onFocus={() => setActiveLocationInput("origin")}
                          onKeyDown={(e) => {
                            if (e.key === "Escape")
                              setActiveLocationInput(null);
                          }}
                          onChange={(e) => {
                            setOrigin(e.target.value);
                            setOriginCoords(null);
                            setActiveLocationInput("origin");
                          }}
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                        />
                        {originSearchLoading && (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-400 absolute right-3 top-3" />
                        )}
                        {activeLocationInput === "origin" &&
                          originSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-40 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl">
                              {originSuggestions.map((suggestion, index) => (
                                <button
                                  key={
                                    suggestion.place_id ||
                                    `${suggestion.lat}-${suggestion.lon}-${index}`
                                  }
                                  type="button"
                                  onMouseDown={(event) =>
                                    event.preventDefault()
                                  }
                                  onClick={() =>
                                    selectLocationSuggestion(
                                      "origin",
                                      suggestion,
                                    )
                                  }
                                  className="w-full flex items-start gap-2.5 px-3 py-3 text-left hover:bg-[#FDF4F1] dark:hover:bg-neutral-800 border-b last:border-b-0 border-neutral-100 dark:border-neutral-800"
                                >
                                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#B9573B]" />
                                  <span className="min-w-0">
                                    <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-100">
                                      {suggestion.address_line1 ||
                                        suggestion.formatted}
                                    </span>
                                    <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                      {suggestion.address_line2 ||
                                        suggestion.formatted}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        {activeLocationInput === "origin" &&
                          origin.trim().length >= 3 &&
                          !originSearchLoading &&
                          originSuggestions.length === 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-xs text-neutral-500 shadow-xl">
                              {GEOAPIFY_API_KEY
                                ? "No matching locations found."
                                : "Add NEXT_PUBLIC_GEOAPIFY_API_KEY to client/.env.local."}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Drop-off Destination{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="Search drop-off destination..."
                          value={destination}
                          onFocus={() => setActiveLocationInput("destination")}
                          onKeyDown={(e) => {
                            if (e.key === "Escape")
                              setActiveLocationInput(null);
                          }}
                          onChange={(e) => {
                            setDestination(e.target.value);
                            setDestinationCoords(null);
                            setActiveLocationInput("destination");
                          }}
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                        />
                        {destinationSearchLoading && (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-400 absolute right-3 top-3" />
                        )}
                        {activeLocationInput === "destination" &&
                          destinationSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-40 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl">
                              {destinationSuggestions.map(
                                (suggestion, index) => (
                                  <button
                                    key={
                                      suggestion.place_id ||
                                      `${suggestion.lat}-${suggestion.lon}-${index}`
                                    }
                                    type="button"
                                    onMouseDown={(event) =>
                                      event.preventDefault()
                                    }
                                    onClick={() =>
                                      selectLocationSuggestion(
                                        "destination",
                                        suggestion,
                                      )
                                    }
                                    className="w-full flex items-start gap-2.5 px-3 py-3 text-left hover:bg-[#FDF4F1] dark:hover:bg-neutral-800 border-b last:border-b-0 border-neutral-100 dark:border-neutral-800"
                                  >
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                                    <span className="min-w-0">
                                      <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-100">
                                        {suggestion.address_line1 ||
                                          suggestion.formatted}
                                      </span>
                                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                        {suggestion.address_line2 ||
                                          suggestion.formatted}
                                      </span>
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        {activeLocationInput === "destination" &&
                          destination.trim().length >= 3 &&
                          !destinationSearchLoading &&
                          destinationSuggestions.length === 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-xs text-neutral-500 shadow-xl">
                              {GEOAPIFY_API_KEY
                                ? "No matching locations found."
                                : "Add NEXT_PUBLIC_GEOAPIFY_API_KEY to client/.env.local."}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Date, Time, Total Seats, Estimated Fare */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Departure Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Total Seats <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={totalSeats}
                        onChange={(e) => setTotalSeats(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                      >
                        {[2, 3, 4, 5, 6, 7].map((s) => (
                          <option key={s} value={s}>
                            {s} seats (You + {s - 1} open)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Estimated Total Fare ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 80"
                          value={estimatedFare}
                          onChange={(e) => setEstimatedFare(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Ride Notes & Luggage Allowance
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leaving promptly at 6 AM. Room for 1 suitcase each."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRide}
                      className="px-6 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#a34e34] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {submittingRide ? "Publishing..." : "Publish Ride"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5">
            {["ALL", "OPEN", "FULL", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === status
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <span className="text-xs text-neutral-400 whitespace-nowrap">
            {rides.length} ride{rides.length === 1 ? "" : "s"} available
          </span>
        </div>

        {/* ============================================================== */}
        {/* RIDE LIST (WITH STATUS BADGES & JOIN/LEAVE) */}
        {/* ============================================================== */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-3xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))}
          </div>
        ) : rides.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No rides found"
            description="Be the first to offer a cab or ride share to campus peers!"
            actionLabel="Offer a Ride"
            onActionClick={() => setShowCreateForm(true)}
          />
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => {
              const members = ride.members || ride.passengers || [];
              const isMember = members.some((m) => m.userId === user?.id);
              const isCreator = ride.creatorId === user?.id;
              const isActionLoading = actionLoadingId === ride.id;

              return (
                <div
                  key={ride.id}
                  className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Top Bar: Route & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {getStatusBadge(ride.status)}
                      <div className="flex items-center gap-2 text-base font-black text-neutral-900 dark:text-white">
                        <span>{ride.origin}</span>
                        <span className="text-[#B9573B] dark:text-[#d4795c]">
                          &rarr;
                        </span>
                        <span>{ride.destination}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>
                          {new Date(ride.departureTime).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(ride.departureTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 text-xs">
                    {/* Seats Info */}
                    <div className="space-y-1">
                      <span className="text-neutral-400 font-semibold block text-[11px]">
                        Seat Availability
                      </span>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#B9573B]" />
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {ride.availableSeats} of {ride.totalSeats} seats open
                        </span>
                      </div>
                    </div>

                    {/* Fare info */}
                    <div className="space-y-1">
                      <span className="text-neutral-400 font-semibold block text-[11px]">
                        Est. Total Fare
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="text-[#B9573B] font-black">
                          ${ride.estimatedFare.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-normal">
                          (~$
                          {(
                            ride.estimatedFare / Math.max(1, members.length)
                          ).toFixed(2)}{" "}
                          / person)
                        </span>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="space-y-1">
                      <span className="text-neutral-400 font-semibold block text-[11px]">
                        Offered by
                      </span>
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={
                            ride.creator?.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${ride.creator?.name || "Driver"}`
                          }
                          alt={ride.creator?.name || "Creator"}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {ride.creator?.name || "Campus Student"}
                          {isCreator && " (You)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {ride.notes && (
                    <p className="text-xs text-neutral-500 italic pl-1">
                      &ldquo;{ride.notes}&rdquo;
                    </p>
                  )}

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Passengers Avatars */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Passengers:
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {members.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            title={m.user?.name || "Passenger"}
                            className="w-7 h-7 rounded-full bg-[#B9573B] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-neutral-900"
                          >
                            {(m.user?.name || "P")[0]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5">
                      {/* Live Fare Splitter Button (MANDATORY REQUIREMENT) */}
                      <button
                        onClick={() => openFareSplitter(ride)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs"
                      >
                        <Calculator className="w-3.5 h-3.5 text-[#B9573B]" />
                        <span>Split Fare Live</span>
                      </button>

                      {/* Creator Status Controls */}
                      {isCreator &&
                        ride.status !== "COMPLETED" &&
                        ride.status !== "CANCELLED" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleStatusChange(ride.id, "COMPLETED")
                              }
                              disabled={isActionLoading}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-[#8f3f27] bg-[#FDF4F1] hover:bg-[#F5DDD6] dark:bg-[#2a1410]/60 dark:text-[#d4795c] transition-colors"
                            >
                              Mark Completed
                            </button>
                          </div>
                        )}

                      {/* Join / Leave Button (MANDATORY REQUIREMENT) */}
                      {!isCreator && (
                        <>
                          {isMember ? (
                            <button
                              onClick={() => handleLeaveRide(ride.id)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>
                                {isActionLoading ? "Leaving..." : "Leave Ride"}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinRide(ride.id)}
                              disabled={
                                ride.availableSeats <= 0 ||
                                ride.status !== "OPEN" ||
                                isActionLoading
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#B9573B] text-white hover:bg-[#a34e34] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {isActionLoading
                                  ? "Joining..."
                                  : ride.availableSeats <= 0
                                    ? "Ride Full"
                                    : "Join Ride"}
                              </span>
                            </button>
                          )}
                        </>
                      )}

                      <ReportButton
                        variant="icon"
                        targetType="RIDE"
                        targetId={ride.id}
                        targetTitle={`${ride.origin} to ${ride.destination}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* LIVE FARE SPLITTER MODAL (MANDATORY REQUIREMENT) */}
        {/* ============================================================== */}
        {selectedRideForSplit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#F5DDD6] dark:bg-[#2a1410]/60 text-[#B9573B] dark:text-[#d4795c]">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                      Live Fare Splitter
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {selectedRideForSplit.origin} &rarr;{" "}
                      {selectedRideForSplit.destination}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRideForSplit(null)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total Fare Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Enter Total Fare ($ or ₹)
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 text-[#B9573B] absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitTotalFareInput}
                    onChange={(e) => handleLiveFareChange(e.target.value)}
                    placeholder="Enter total cab bill..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#B9573B]"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Adjust this anytime according to the final Uber/Ola/meter
                  receipt.
                </p>
              </div>

              {/* Live Calculation Banner */}
              {fareSplitResult && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#B9573B]/10 via-[#6698C2]/5 to-transparent border border-[#E8DED5] dark:border-[#B9573B]/30 text-center space-y-1">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Each Person Pays
                  </span>
                  <div className="text-3xl font-black text-[#B9573B] dark:text-[#d4795c]">
                    ${fareSplitResult.farePerPerson.toFixed(2)}
                  </div>
                  <span className="text-xs text-neutral-400">
                    Split equally among {fareSplitResult.passengerCount}{" "}
                    traveler
                    {fareSplitResult.passengerCount === 1 ? "" : "s"}
                  </span>
                </div>
              )}

              {/* Individual Breakdown List */}
              {fareSplitResult && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Participant Breakdown
                  </h4>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    {fareSplitResult.participants.map((p, idx) => (
                      <div
                        key={p.userId || idx}
                        className="flex items-center justify-between p-3 text-xs bg-white dark:bg-neutral-900"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#F5DDD6] dark:bg-[#2a1410]/60 text-[#8f3f27] dark:text-[#d4795c] font-bold text-[10px] flex items-center justify-center">
                            {p.name[0]}
                          </div>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {p.name}
                            {p.userId === user?.id && " (You)"}
                          </span>
                        </div>
                        <span className="font-extrabold text-neutral-900 dark:text-white">
                          ${p.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedRideForSplit(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
