"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  AlertCircle,
  Loader2,
  Clock,
  Milestone,
  Check,
  Search,
  Crosshair,
} from "lucide-react";
// MapLibre GL JS v6 requires its worker to be explicitly resolved by the bundler.
// This is the documented setup for Next.js 15+ with Webpack.
setWorkerUrl(
  new URL(
    "maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ).toString(),
);

export interface RouteMetrics {
  distanceKm: number;
  durationMinutes: number;
  summary?: string;
}

interface RideNavigationMapProps {
  originText: string;
  destinationText: string;
  onOriginSelect?: (address: string, coords: [number, number]) => void;
  onDestinationSelect?: (address: string, coords: [number, number]) => void;
  /** Coordinates returned by the autocomplete selection in the parent form. */
  selectedOriginCoords?: [number, number] | null;
  selectedDestinationCoords?: [number, number] | null;
  className?: string;
}

// Verified permanent IIIT Kota campus anchor [longitude, latitude].
// Do not assign invented coordinates to individual campus gates/buildings.
export const CAMPUS_PRESET_COORDINATES: Record<string, [number, number]> = {
  "IIIT Kota": [75.8321, 25.0499],
};

const DEFAULT_CENTER: [number, number] = [75.8321, 25.0499]; // IIIT Kota, Ranpur
const DEFAULT_ZOOM = 13.5;

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;
export default function RideNavigationMap({
  originText,
  destinationText,
  onOriginSelect,
  onDestinationSelect,
  selectedOriginCoords = null,
  selectedDestinationCoords = null,
  className = "",
}: RideNavigationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    selectedOriginCoords,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(
    selectedDestinationCoords,
  );
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isRouting, setIsRouting] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [clickTarget, setClickTarget] = useState<"origin" | "destination">(
    "destination",
  );
  const [clickPopupInfo, setClickPopupInfo] = useState<{
    lngLat: [number, number];
    label: string;
  } | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "carto-voyager": {
              type: "raster",
              tiles: [
                `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
                `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
                `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            },
          },
          layers: [
            {
              id: "carto-voyager-layer",
              type: "raster",
              source: "carto-voyager",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitchWithRotate: false,
        attributionControl: false,
      });

      // Add zoom and compass controls
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
        "top-right",
      );
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
        }),
        "bottom-right",
      );

      map.on("load", () => {
        setIsMapLoading(false);

        // Add empty route source & layers
        if (!map.getSource("route-source")) {
          map.addSource("route-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });

          // Route casing (darker border for high contrast)
          map.addLayer({
            id: "route-casing",
            type: "line",
            source: "route-source",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#064e3b",
              "line-width": 8,
              "line-opacity": 0.7,
            },
          });

          // Route line (vibrant emerald)
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route-source",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#10b981",
              "line-width": 5,
              "line-opacity": 0.95,
            },
          });
        }
      });

      // Map Click Handler for interactive coordinate picking
      map.on("click", async (e) => {
        const clickedLngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        // Reverse geocode or create fallback label
        let resolvedLabel = `${clickedLngLat[1].toFixed(4)}, ${clickedLngLat[0].toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLngLat[1]}&lon=${clickedLngLat[0]}`,
            { headers: { "Accept-Language": "en" } },
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(",");
              resolvedLabel = parts.slice(0, 2).join(",").trim();
            }
          }
        } catch {
          // fallback string
        }

        setClickPopupInfo({
          lngLat: clickedLngLat,
          label: resolvedLabel,
        });
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error("Failed to initialize MapLibre:", err);
      setIsMapLoading(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update pickup marker on originCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || isMapLoading) return;

    if (!originCoords) {
      if (originMarkerRef.current) {
        originMarkerRef.current.remove();
        originMarkerRef.current = null;
      }
      return;
    }

    if (!originMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "pickup-marker";
      el.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:#059669; border:3px solid #ffffff; border-radius:50%; box-shadow:0 4px 12px rgba(5,150,105,0.45); cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `;

      originMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(originCoords)
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setHTML(
            '<div class="p-1 font-bold text-xs text-neutral-800">Pickup Origin</div>',
          ),
        )
        .addTo(map);
    } else {
      originMarkerRef.current.setLngLat(originCoords);
    }
  }, [originCoords, isMapLoading]);

  // Update destination marker on destCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || isMapLoading) return;

    if (!destCoords) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      return;
    }

    if (!destMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "dest-marker";
      el.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:#e11d48; border:3px solid #ffffff; border-radius:50%; box-shadow:0 4px 12px rgba(225,29,72,0.45); cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      `;

      destMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(destCoords)
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setHTML(
            '<div class="p-1 font-bold text-xs text-neutral-800">Drop-off Destination</div>',
          ),
        )
        .addTo(map);
    } else {
      destMarkerRef.current.setLngLat(destCoords);
    }
  }, [destCoords, isMapLoading]);

  // Keep selected locations visible immediately. Once both are selected,
  // frame both points while OSRM calculates the road geometry.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || isMapLoading) return;

    if (originCoords && destCoords) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(originCoords);
      bounds.extend(destCoords);
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 90, left: 90, right: 90 },
        maxZoom: 14.5,
        duration: 800,
      });
      return;
    }

    const selectedPoint = originCoords ?? destCoords;
    if (selectedPoint) {
      map.flyTo({ center: selectedPoint, zoom: 14, essential: true });
    }
  }, [originCoords, destCoords, isMapLoading]);

  // Coordinates come from an explicit autocomplete selection in the parent form.
  // Do not geocode raw input text here: typing must not move the map prematurely.
  useEffect(() => {
    setOriginCoords(selectedOriginCoords ?? null);
  }, [selectedOriginCoords]);

  useEffect(() => {
    setDestCoords(selectedDestinationCoords ?? null);
  }, [selectedDestinationCoords]);

  // Fetch actual road route from OSRM when both coordinates exist
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!originCoords || !destCoords || !map || isMapLoading) {
      if (map && map.getSource("route-source")) {
        const source = map.getSource(
          "route-source",
        ) as maplibregl.GeoJSONSource;
        source.setData({ type: "FeatureCollection", features: [] });
      }
      setRouteMetrics(null);
      setRoutingError(null);
      return;
    }

    let isSubscribed = true;
    setIsRouting(true);
    setRoutingError(null);

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("OSRM routing service unavailable");
        }

        const data = await res.json();
        if (!isSubscribed) return;

        if (
          data.code === "Ok" &&
          Array.isArray(data.routes) &&
          data.routes.length > 0
        ) {
          const mainRoute = data.routes[0];
          const distanceKm = parseFloat((mainRoute.distance / 1000).toFixed(1));
          const durationMinutes = Math.max(
            1,
            Math.round(mainRoute.duration / 60),
          );

          setRouteMetrics({
            distanceKm,
            durationMinutes,
            summary: mainRoute.legs?.[0]?.summary || "Fastest Route",
          });

          // Update Map Source with real road geometry
          if (map.getSource("route-source")) {
            const source = map.getSource(
              "route-source",
            ) as maplibregl.GeoJSONSource;
            source.setData({
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: mainRoute.geometry,
                },
              ],
            });
            map.triggerRepaint();
          }

          // Auto-fit bounds to route
          const coordinates = mainRoute.geometry.coordinates;
          if (coordinates.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            coordinates.forEach((coord: [number, number]) =>
              bounds.extend(coord),
            );
            map.fitBounds(bounds, {
              padding: { top: 70, bottom: 70, left: 70, right: 70 },
              maxZoom: 15.5,
              duration: 1200,
            });
          }
        } else {
          setRoutingError("No road route found between selected points.");
          setRouteMetrics(null);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.warn("[RideMap] Routing error:", err);
        setRoutingError("Road route calculation unavailable (network error)");
        setRouteMetrics(null);
      } finally {
        if (isSubscribed) {
          setIsRouting(false);
        }
      }
    };

    fetchRoute();

    return () => {
      isSubscribed = false;
    };
  }, [originCoords, destCoords, isMapLoading]);

  // Handle setting location from click popup
  const handleApplyClickLocation = (type: "origin" | "destination") => {
    if (!clickPopupInfo) return;
    const { lngLat, label } = clickPopupInfo;

    if (type === "origin") {
      setOriginCoords(lngLat);
      onOriginSelect?.(label, lngLat);
    } else {
      setDestCoords(lngLat);
      onDestinationSelect?.(label, lngLat);
    }
    setClickPopupInfo(null);
  };

  // Re-center on campus
  const handleRecenterCampus = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      essential: true,
    });
  };

  return (
    <div
      className={`relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 shadow-inner ${className}`}
    >
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Loading Overlay */}
      {isMapLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs z-20">
          <Loader2 className="w-8 h-8 text-[#B9573B] animate-spin" />
          <p className="mt-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            Initializing campus navigation map...
          </p>
        </div>
      )}

      {/* Top Left: Route Metrics HUD (Uber/Rapido-styled) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[280px]">
        {routeMetrics ? (
          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-700/80 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#B9573B] dark:text-[#d4795c]">
                <Navigation className="w-3.5 h-3.5" />
                Road Navigation
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5DDD6] dark:bg-[#2a1410]/70 text-[#8f3f27] dark:text-[#d4795c]">
                Live OSRM
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-neutral-900 dark:text-white">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#B9573B]">
                  <Milestone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 block">
                    Distance
                  </span>
                  <span className="text-sm font-black tracking-tight">
                    {routeMetrics.distanceKm} km
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#B9573B]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 block">
                    Est. Time
                  </span>
                  <span className="text-sm font-black tracking-tight">
                    {routeMetrics.durationMinutes} mins
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : isRouting ? (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-md text-xs font-bold text-neutral-700 dark:text-neutral-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-[#B9573B] animate-spin" />
            <span>Calculating road route...</span>
          </div>
        ) : routingError ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 backdrop-blur-md text-xs font-semibold shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{routingError}</span>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-xs text-xs font-semibold text-neutral-500">
            Select or search pickup & destination to render road route.
          </div>
        )}
      </div>

      {/* Floating Control: Re-center Campus & Tap-to-pick indicator */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRecenterCampus}
          title="Re-center on Campus"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-bold shadow-md border border-neutral-200 dark:border-neutral-800 transition-all"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#B9573B]" />
          <span>Campus Center</span>
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/60 dark:border-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
          Tip: Click map to pin location
        </span>
      </div>

      {/* Click-to-pin Action Popover */}
      {clickPopupInfo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3 w-[270px] animate-in zoom-in-95">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Selected Location
              </span>
              <p className="text-xs font-bold text-neutral-800 dark:text-white line-clamp-2">
                {clickPopupInfo.label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setClickPopupInfo(null)}
              className="text-neutral-400 hover:text-neutral-600 text-xs font-bold p-1"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleApplyClickLocation("origin")}
              className="px-2.5 py-2 rounded-xl bg-[#B9573B] hover:bg-[#a34e34] text-white text-xs font-bold shadow-xs transition-colors"
            >
              Set Pickup
            </button>
            <button
              type="button"
              onClick={() => handleApplyClickLocation("destination")}
              className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Set Drop-off
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
