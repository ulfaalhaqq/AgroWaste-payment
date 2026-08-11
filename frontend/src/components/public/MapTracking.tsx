"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapLibreMap, MapLibreMarker, MapLibreWindow } from "@/types/maplibre-gl";

export interface MapTrackingProps {
  startCoords: [number, number]; // [longitude, latitude] of Store
  endCoords: [number, number]; // [longitude, latitude] of Home
  courierCoords: [number, number]; // [longitude, latitude] of Truck
  className?: string;
}

export default function MapTracking({
  startCoords,
  endCoords,
  courierCoords,
  className = "",
}: MapTrackingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const startMarkerRef = useRef<MapLibreMarker | null>(null);
  const endMarkerRef = useRef<MapLibreMarker | null>(null);
  const courierMarkerRef = useRef<MapLibreMarker | null>(null);

  // lazy-load MapLibre GL from CDN
  useEffect(() => {
    const cssId = "maplibre-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    const jsId = "maplibre-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.js";
      script.onload = () => setMaplibreLoaded(true);
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if ((window as unknown as MapLibreWindow).maplibregl) {
          setMaplibreLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // init map instance
  useEffect(() => {
    if (!maplibreLoaded || !containerRef.current || mapInstanceRef.current)
      return;

    // center between start and end
    const centerLng = (startCoords[0] + endCoords[0]) / 2;
    const centerLat = (startCoords[1] + endCoords[1]) / 2;

    const map = new (window as unknown as MapLibreWindow).maplibregl!.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [centerLng, centerLat],
      zoom: 12,
      attributionControl: {
        compact: true,
      },
    });

    map.addControl(
      new (window as unknown as MapLibreWindow).maplibregl!.NavigationControl(),
      "top-right",
    );

    // draw route line after style loads
    const onStyleLoad = () => {
      if (map.getSource("route")) return;

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              startCoords,
              [112.659, -7.9],
              [112.656, -7.915],
              [112.645, -7.925],
              courierCoords,
              [112.618, -7.928],
              endCoords,
            ],
          },
        },
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#59A5FE", // Bright blue color
          "line-width": 5,
        },
      });
    };

    if (map.isStyleLoaded()) {
      onStyleLoad();
    } else {
      map.on("styledata", onStyleLoad);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maplibreLoaded]);

  // render markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !maplibreLoaded) return;

    if (startMarkerRef.current) startMarkerRef.current.remove();
    if (endMarkerRef.current) endMarkerRef.current.remove();
    if (courierMarkerRef.current) courierMarkerRef.current.remove();

    // pickup marker
    const startEl = document.createElement("div");
    startEl.className =
      "flex flex-col items-center select-none pointer-events-none";
    startEl.innerHTML = `
      <span style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.4);">Store</span>
      <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #00C282; border: 2.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
    `;
    startMarkerRef.current = new (window as unknown as MapLibreWindow).maplibregl!.Marker({
      element: startEl,
      anchor: "bottom",
    })
      .setLngLat(startCoords)
      .addTo(map);

    // destination marker
    const endEl = document.createElement("div");
    endEl.className =
      "flex flex-col items-center select-none pointer-events-none";
    endEl.innerHTML = `
      <span style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.4);">Home</span>
      <div style="display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.25));">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#3B82F6"/>
          <circle cx="12" cy="9" r="3.5" fill="#FFFFFF"/>
        </svg>
      </div>
    `;
    endMarkerRef.current = new (window as unknown as MapLibreWindow).maplibregl!.Marker({
      element: endEl,
      anchor: "bottom",
    })
      .setLngLat(endCoords)
      .addTo(map);

    // courier marker
    const courierEl = document.createElement("div");
    courierEl.className =
      "w-10 h-10 rounded-full bg-[#3B82F6] border-2.5 border-white shadow-lg flex items-center justify-center text-white relative z-10 cursor-pointer hover:scale-105 transition-transform duration-200";
    courierEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 8h-2V5c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v12h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm9-8v3H3V5h12v5zm3 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1.5-6h-3.5v-3h1.5l2 3z"/>
      </svg>
    `;
    courierMarkerRef.current = new (window as unknown as MapLibreWindow).maplibregl!.Marker({
      element: courierEl,
      anchor: "center",
    })
      .setLngLat(courierCoords)
      .addTo(map);

    // fit bounds to both endpoints
    const bounds = new (window as unknown as MapLibreWindow).maplibregl!.LngLatBounds()
      .extend(startCoords)
      .extend(endCoords);

    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 14,
    });
  }, [maplibreLoaded, startCoords, endCoords, courierCoords]);

  return (
    <div
      className={`relative w-full h-full min-h-[300px] overflow-hidden ${className}`}
    >
      <div ref={containerRef} className="w-full h-full" />
      {!maplibreLoaded && (
        <div className="absolute inset-0 bg-land-ink/20 flex flex-col items-center justify-center backdrop-blur-xs z-30 rounded-2xl">
          <div className="w-10 h-10 border-4 border-land-accent border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Memuat Peta Pelacakan...
          </span>
        </div>
      )}
    </div>
  );
}
