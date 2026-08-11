// Mapping koordinat pusat kabupaten/kota utama di Indonesia (terutama Jawa & sekitarnya)
export const KOTA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  malang: { lat: -7.9839, lng: 112.6214 },
  "kabupaten malang": { lat: -8.1331, lng: 112.5684 },
  "kota malang": { lat: -7.9839, lng: 112.6214 },
  batu: { lat: -7.8711, lng: 112.5269 },
  pasuruan: { lat: -7.6453, lng: 112.9075 },
  surabaya: { lat: -7.2575, lng: 112.7521 },
  sidoarjo: { lat: -7.4478, lng: 112.7183 },
  mojokerto: { lat: -7.4726, lng: 112.4381 },
  probolinggo: { lat: -7.7543, lng: 113.2159 },
  lumajang: { lat: -8.1319, lng: 113.2246 },
  jember: { lat: -8.1724, lng: 113.7003 },
  banyuwangi: { lat: -8.2192, lng: 114.3692 },
  kediri: { lat: -7.848, lng: 112.0178 },
  blitar: { lat: -8.0983, lng: 112.1681 },
  tulungagung: { lat: -8.0664, lng: 111.9016 },
  trenggalek: { lat: -8.0503, lng: 111.7083 },
  nganjuk: { lat: -7.6042, lng: 111.9044 },
  madiun: { lat: -7.6298, lng: 111.5239 },
  ponorogo: { lat: -7.8687, lng: 111.4622 },
  magetan: { lat: -7.6534, lng: 111.3283 },
  ngawi: { lat: -7.4039, lng: 111.4447 },
  bojonegoro: { lat: -7.1502, lng: 111.8818 },
  tuban: { lat: -6.8976, lng: 112.0649 },
  lamongan: { lat: -7.1186, lng: 112.4158 },
  gresik: { lat: -7.1566, lng: 112.6555 },
  bangkalan: { lat: -7.0454, lng: 112.7351 },
  sampang: { lat: -7.1895, lng: 113.2394 },
  pamekasan: { lat: -7.1613, lng: 113.4832 },
  sumenep: { lat: -7.0167, lng: 113.8667 },
  semarang: { lat: -6.9667, lng: 110.4167 },
  surakarta: { lat: -7.5755, lng: 110.8243 },
  solo: { lat: -7.5755, lng: 110.8243 },
  yogyakarta: { lat: -7.7956, lng: 110.3695 },
  bandung: { lat: -6.9175, lng: 107.6191 },
  jakarta: { lat: -6.2088, lng: 106.8456 },
  bogor: { lat: -6.5971, lng: 106.806 },
};

/**
 * Menghitung jarak antara 2 koordinat (dalam km) menggunakan rumus Haversine
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format jarak ke string yang ramah pengguna (cth: "850 m" atau "3.4 km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Mencari koordinat berdasarkan nama kabupaten/kota
 */
export function getCoordinatesByLocationName(
  locationName?: string,
): { lat: number; lng: number } | null {
  if (!locationName) return null;
  const key = locationName.toLowerCase().trim();

  // Direct match
  if (KOTA_COORDINATES[key]) {
    return KOTA_COORDINATES[key];
  }

  // Partial match
  for (const [cityName, coords] of Object.entries(KOTA_COORDINATES)) {
    if (key.includes(cityName) || cityName.includes(key)) {
      return coords;
    }
  }

  // Default fallback jika tidak terdaftar (Default Surabaya/Malang area)
  return { lat: -7.9839, lng: 112.6214 };
}

/**
 * Meminta lokasi pengguna dari Browser (Geolocation API)
 */
export function requestUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung oleh browser Anda."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export interface ShippingCostResult {
  vehicleType: "Motor" | "Mobil Pick-up";
  vehicleCount: number;
  baseTariff: number;
  ratePerKm: number;
  deliveryCostRaw: number;
  deliveryCostDisplay: string;
}

/**
 * Kalkulator Perhitungan Ongkos Kirim AgroWaste
 * @param distanceKm Jarak dalam kilometer (km)
 * @param weightKg Berat total dalam kilogram (kg)
 */
export function calculateDeliveryCost(
  distanceKm: number,
  weightKg: number,
): ShippingCostResult {
  const distance = Math.max(0, distanceKm);
  const weight = Math.max(0, weightKg);

  let baseTariff = 0;
  let ratePerKm = 0;
  let vehicleType: "Motor" | "Mobil Pick-up" = "Motor";
  let vehicleCount = 1;

  // 1. Penentuan Armada Berdasarkan Berat
  if (weight <= 25) {
    vehicleType = "Motor";
    baseTariff = 7000;
    ratePerKm = 2000;
  } else {
    vehicleType = "Mobil Pick-up";
    baseTariff = 25000;
    ratePerKm = 3500;

    // Logika Multi-Armada (Maksimal 700 kg per mobil)
    if (weight > 700) {
      vehicleCount = Math.ceil(weight / 700);
    }
  }

  // 2. Perhitungan Biaya Jarak
  let distanceCost = distance * ratePerKm * vehicleCount;

  // 3. Logika Batas Minimum (Motor) / Tambahan Tarif Dasar per Armada (Pick-up)
  if (vehicleType === "Motor" && distanceCost < baseTariff) {
    distanceCost = baseTariff;
  } else if (vehicleType === "Mobil Pick-up") {
    // Tarif dasar sewa otomatis dikalikan jumlah mobil yang berangkat
    distanceCost = distanceCost + baseTariff * vehicleCount;
  }

  // 4. Total Ongkos Kirim Akhir
  const deliveryCostRaw = Math.round(distanceCost);
  const deliveryCostDisplay = `Rp ${Math.floor(deliveryCostRaw / 1000)}k`;

  return {
    vehicleType,
    vehicleCount,
    baseTariff,
    ratePerKm,
    deliveryCostRaw,
    deliveryCostDisplay,
  };
}
