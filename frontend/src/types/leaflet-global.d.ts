// Minimal type declarations for Leaflet loaded via CDN (window.L)
// Covers only methods and constructors used in courier/settings pages.

interface LeafletLatLng {
  lat: number;
  lng: number;
}

interface LeafletLayer {
  _leaflet_id?: number;
}

interface LeafletMarker extends LeafletLayer {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(content: string): LeafletMarker;
  openPopup(): LeafletMarker;
  getLatLng(): LeafletLatLng;
  setLatLng(latlng: [number, number] | LeafletLatLng): void;
  on(event: string, handler: () => void): void;
}

type LeafletPolyline = LeafletLayer;

interface LeafletBounds {
  _southWest?: LeafletLatLng;
  _northEast?: LeafletLatLng;
}

interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap;
  eachLayer(fn: (layer: LeafletLayer) => void): void;
  removeLayer(layer: LeafletLayer): void;
  fitBounds(bounds: LeafletBounds, options?: Record<string, unknown>): void;
  panTo(center: [number, number]): void;
  on(event: string, handler: (e: LeafletMouseEvent) => void): void;
  remove(): void;
}

interface LeafletMouseEvent {
  latlng: LeafletLatLng;
}

interface LeafletStatic {
  map(id: string): LeafletMap;
  tileLayer(
    url: string,
    options?: Record<string, unknown>,
  ): { addTo(map: LeafletMap): void };
  marker(
    latlng: [number, number],
    options?: Record<string, unknown>,
  ): LeafletMarker;
  polyline(
    latlngs: [number, number][],
    options?: Record<string, unknown>,
  ): { addTo(map: LeafletMap): void };
  latLngBounds(latlngs: [number, number][]): LeafletBounds;
  icon(options: Record<string, unknown>): unknown;
  Marker: new (...args: unknown[]) => LeafletMarker;
  Polyline: new (...args: unknown[]) => LeafletPolyline;
}

interface Window {
  L: LeafletStatic;
}
