// Minimal Leaflet type declarations for CDN-loaded library
export interface LeafletLatLng {
  lat: number;
  lng: number;
}

export interface LeafletMouseEvent {
  latlng: LeafletLatLng;
}

export interface LeafletMarker {
  getLatLng(): LeafletLatLng;
  setLatLng(coords: LeafletLatLng | [number, number]): LeafletMarker;
  addTo(map: LeafletMap): LeafletMarker;
  on(event: string, handler: (e: LeafletMouseEvent) => void): void;
}

export interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap;
  on(event: string, handler: (e: LeafletMouseEvent) => void): void;
}

export interface LeafletTileLayer {
  addTo(map: LeafletMap): LeafletTileLayer;
}

export interface LeafletGL {
  map(id: string): LeafletMap;
  tileLayer(url: string, options?: Record<string, unknown>): LeafletTileLayer;
  marker(coords: [number, number], options?: Record<string, unknown>): LeafletMarker;
}

export interface LeafletWindow extends Window {
  L?: LeafletGL;
}
