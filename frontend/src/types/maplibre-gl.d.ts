// Minimal MapLibre GL type declarations for CDN-loaded library
export interface MapLibreLngLatBounds {
  extend(coords: [number, number]): MapLibreLngLatBounds;
}

export interface MapLibrePopup {
  setHTML(html: string): MapLibrePopup;
}

export interface MapLibreMarker {
  setLngLat(coords: [number, number]): MapLibreMarker;
  setPopup(popup: MapLibrePopup): MapLibreMarker;
  addTo(map: MapLibreMap): MapLibreMarker;
  remove(): void;
}

export interface MapLibreMap {
  addControl(control: unknown, position?: string): void;
  addSource(id: string, source: unknown): void;
  addLayer(layer: unknown): void;
  getSource(id: string): unknown;
  isStyleLoaded(): boolean;
  on(event: string, handler: (...args: unknown[]) => void): void;
  fitBounds(bounds: MapLibreLngLatBounds, options?: Record<string, unknown>): void;
  easeTo(options: Record<string, unknown>): void;
  remove(): void;
}

export interface MapLibreGL {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
  Marker: new (options?: Record<string, unknown>) => MapLibreMarker;
  Popup: new (options?: Record<string, unknown>) => MapLibrePopup;
  NavigationControl: new () => unknown;
  LngLatBounds: new () => MapLibreLngLatBounds;
}

export interface MapLibreWindow extends Window {
  maplibregl?: MapLibreGL;
}
