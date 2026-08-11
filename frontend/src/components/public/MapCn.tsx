"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapLibreMap, MapLibreMarker, MapLibreWindow } from "@/types/maplibre-gl";

export interface SellerInfo {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  kabupaten: string;
  provinsi: string;
  distance?: number;
}

export interface MapCnProps {
  userCoords: [number, number] | null; // [longitude, latitude]
  sellers: SellerInfo[];
  activeSellerId?: string | null;
  onSelectSeller?: (seller: SellerInfo) => void;
  className?: string;
}

export default function MapCn({
  userCoords,
  sellers,
  activeSellerId,
  onSelectSeller,
  className = "",
}: MapCnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);

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
      // script already injected — poll until maplibregl lands on window
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

    // default to Surabaya when no user/seller coords available
    const defaultCenter: [number, number] = [112.7521, -7.2575];
    const initialCenter =
      userCoords ||
      (sellers.length > 0 ? [sellers[0].lng, sellers[0].lat] : defaultCenter);

    const map = new (window as unknown as MapLibreWindow).maplibregl!.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: initialCenter,
      zoom: userCoords ? 11 : 8,
      attributionControl: {
        compact: true,
      },
    });

    map.addControl(
      new (window as unknown as MapLibreWindow).maplibregl!.NavigationControl(),
      "top-right",
    );

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maplibreLoaded]);

  // user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !maplibreLoaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userCoords) {
      const el = document.createElement("div");
      el.className =
        "w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse z-20";

      const popup = new (window as unknown as MapLibreWindow).maplibregl!.Popup({
        offset: 10,
      }).setHTML(
        `<div style="font-family: 'Nunito Sans', sans-serif; padding: 4px; font-weight: 700; color: #2C3930; font-size: 13px;">Lokasi Anda</div>`,
      );

      userMarkerRef.current = new (window as unknown as MapLibreWindow).maplibregl!.Marker({
        element: el,
      })
        .setLngLat(userCoords)
        .setPopup(popup)
        .addTo(map);

      // pan to user on first appearance
      map.easeTo({ center: userCoords, zoom: 11 });
    }
  }, [maplibreLoaded, userCoords]);

  // seller markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !maplibreLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    sellers.forEach((s) => {
      const el = document.createElement("div");
      el.className = "w-8 h-8 cursor-pointer z-10";

      // highlight selected seller
      const isActive = activeSellerId === s.userId;
      const innerEl = document.createElement("div");
      innerEl.className = `w-full h-full rounded-full border-2 border-white shadow-md flex items-center justify-center text-white transition-all duration-200 hover:scale-110 ${
        isActive
          ? "bg-land-accent scale-110 ring-2 ring-land-accent/40"
          : "bg-[#3F4F44]"
      }`;
      innerEl.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>`;

      el.appendChild(innerEl);

      const popup = new (window as unknown as MapLibreWindow).maplibregl!.Popup({ offset: 12 })
        .setHTML(`
        <div style="font-family: 'Nunito Sans', sans-serif; padding: 4px; color: #2C3930;">
          <h4 style="font-weight: 700; margin: 0 0 4px 0; font-size: 14px;">${s.name}</h4>
          <p style="margin: 0; font-size: 12px; color: #5C6D65;">${s.kabupaten}, ${s.provinsi}</p>
          ${s.distance ? `<p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #2E8A4E;">${s.distance.toFixed(1)} km dari Anda</p>` : ""}
        </div>
      `);

      el.addEventListener("click", () => {
        if (onSelectSeller) {
          onSelectSeller(s);
        }
      });

      const marker = new (window as unknown as MapLibreWindow).maplibregl!.Marker({ element: el })
        .setLngLat([s.lng, s.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maplibreLoaded, sellers, activeSellerId]);

  // pan to active seller
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !maplibreLoaded || !activeSellerId) return;

    const activeSeller = sellers.find((s) => s.userId === activeSellerId);
    if (activeSeller) {
      map.easeTo({
        center: [activeSeller.lng, activeSeller.lat],
        zoom: 12,
      });
    }
  }, [activeSellerId, maplibreLoaded, sellers]);

  return (
    <div
      className={`relative w-full h-full min-h-[300px] overflow-hidden ${className}`}
    >
      <div ref={containerRef} className="w-full h-full" />
      {!maplibreLoaded && (
        <div className="absolute inset-0 bg-land-ink/20 flex flex-col items-center justify-center backdrop-blur-xs z-30 rounded-2xl">
          <div className="w-10 h-10 border-4 border-land-accent border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Memuat Peta...
          </span>
        </div>
      )}
    </div>
  );
}
