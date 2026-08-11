"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Leaf,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sprout,
  ChevronLeft,
  Calendar,
  Layers,
  Award,
} from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import EarthyCard from "@/components/public/EarthyCard";

interface SellerProfile {
  id: string;
  nama_kandang?: string | null;
  nama_peternakan: string;
  deskripsi: string | null;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  lat: string | null;
  lng: string | null;
  jenis_ternak: string[] | string | null;
  kapasitas_ternak: string | number | null;
  badge?: string;
  created_at: string;
}

interface SellerUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  stock_kg: string;
  min_order_kg: string;
  kondisi: string | null;
  jenis_ternak: string;
  provinsi: string;
  kabupaten: string;
  image_url?: string | null;
  rating_avg?: string | number;
}

interface SellerDetailResponse {
  user: SellerUser;
  profile: SellerProfile;
  products: Product[];
}

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SellerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/sellers/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil data profil penjual.");
        }
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.message ?? "Terjadi kesalahan.");
        }
      })
      .catch((err: Error) => {
        setFetchError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 bg-land-bg min-h-screen pb-20">
        {/* Banner Skeleton */}
        <div className="bg-land-ink py-20 px-6 animate-pulse">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-6 bg-white/10 rounded-full w-1/3" />
              <div className="h-4 bg-white/10 rounded-full w-2/3" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white border border-land-cream rounded-3xl p-6 h-48 animate-pulse" />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-land-cream rounded-2xl p-4 h-80 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="flex-1 bg-land-bg min-h-screen flex items-center justify-center py-32">
        <div className="text-center px-6">
          <p className="text-lg font-bold text-land-ink mb-2">
            {fetchError ?? "Profil penjual tidak ditemukan."}
          </p>
          <Link
            href="/"
            className="text-land-accent font-bold text-sm hover:underline"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const { user, profile, products } = data;
  const initial = (profile.nama_peternakan || user.name || "P")
    .charAt(0)
    .toUpperCase();

  // Parsing animal types
  let animalTypes: string[] = [];
  if (profile.jenis_ternak) {
    if (Array.isArray(profile.jenis_ternak)) {
      animalTypes = profile.jenis_ternak;
    } else if (typeof profile.jenis_ternak === "string") {
      try {
        const parsed = JSON.parse(profile.jenis_ternak);
        if (Array.isArray(parsed)) {
          animalTypes = parsed;
        } else {
          animalTypes = [profile.jenis_ternak];
        }
      } catch {
        animalTypes = [profile.jenis_ternak];
      }
    }
  }

  const badgeText = profile.badge
    ? profile.badge.toUpperCase()
    : "MITRA TERVERIFIKASI";

  return (
    <div className="flex-1 bg-land-bg min-h-screen pb-20 animate-fade-in">
      {/* Banner / Header */}
      <section className="bg-land-ink text-white py-12 md:py-16 px-6 relative overflow-hidden">
        {/* Decorative SVG background leaf */}
        <Leaf
          className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5 pointer-events-none"
          strokeWidth={1}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={profile.nama_kandang || profile.nama_peternakan || user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/15 shadow-xl shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-land-accent flex items-center justify-center text-white text-3xl font-bold border-4 border-white/15 shadow-xl shrink-0">
                {initial}
              </div>
            )}

            {/* Seller main info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-land-heading text-3xl md:text-4xl font-bold tracking-tight">
                  {profile.nama_kandang || profile.nama_peternakan || user.name || "Peternakan Organik"}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-land-accent/20 text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {badgeText}
                </span>
              </div>

              <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
                {profile.deskripsi ??
                  "Peternakan lokal mitra terpercaya AgroWaste yang berkomitmen menyalurkan limbah ternak sirkular berkualitas tinggi untuk keberlanjutan bumi."}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-white/60 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-land-accent" />
                  {profile.kecamatan}, {profile.kabupaten}, {profile.provinsi}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-land-clay" />
                  Bergabung{" "}
                  {new Date(profile.created_at || user.id).toLocaleDateString(
                    "id-ID",
                    { month: "long", year: "numeric" },
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <aside className="md:col-span-1 space-y-6">
          <div className="bg-white border border-land-cream rounded-[24px] p-6 shadow-clay">
            <h3 className="font-land-heading text-lg font-bold text-land-ink mb-4 pb-2 border-b border-land-cream">
              Profil Peternakan
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-xs font-bold text-land-muted uppercase tracking-wider mb-1">
                  Pemilik
                </span>
                <span className="font-semibold text-land-ink">{user.name}</span>
              </div>

              {animalTypes.length > 0 && (
                <div>
                  <span className="block text-xs font-bold text-land-muted uppercase tracking-wider mb-1">
                    Jenis Hewan Ternak
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {animalTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-0.5 rounded-md bg-land-warm text-land-ink text-xs font-semibold uppercase tracking-wider"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.kapasitas_ternak && (
                <div>
                  <span className="block text-xs font-bold text-land-muted uppercase tracking-wider mb-1">
                    Kapasitas Peternakan
                  </span>
                  <span className="font-semibold text-land-ink">
                    {Number(profile.kapasitas_ternak).toLocaleString("id-ID")}{" "}
                    Ekor
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-land-cream">
                <span className="block text-xs font-bold text-land-muted uppercase tracking-wider mb-2">
                  Kontak Hubung
                </span>
                <div className="space-y-2">
                  {user.phone && (
                    <div className="flex items-center gap-2 text-xs text-land-ink">
                      <Phone className="w-4 h-4 text-land-accent shrink-0" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-land-ink">
                    <Mail className="w-4 h-4 text-land-clay shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <section className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-land-heading text-2xl font-bold text-land-ink flex items-center gap-2">
              <Sprout className="w-6 h-6 text-land-accent" />
              Katalog Produk Aktif
            </h2>
            <span className="text-xs font-bold bg-land-warm text-land-muted px-3 py-1 rounded-full uppercase tracking-wider">
              {products.length} Komoditas
            </span>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-land-cream rounded-[24px] p-12 text-center shadow-clay">
              <Layers className="w-12 h-12 text-land-secondary/20 mx-auto mb-4" />
              <p className="text-sm font-semibold text-land-muted">
                Belum ada produk aktif yang terdaftar untuk peternakan ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <EarthyCard
                  key={product.id}
                  href={`/marketplace/${product.id}`}
                  title={product.name}
                  locationText={`${product.kabupaten}`}
                  rating={product.rating_avg}
                  imageUrl={
                    product.image_url
                      ? getProductImageUrl(product.image_url)
                      : null
                  }
                  imageFallbackIcon={Leaf}
                  price={formatRupiah(product.price)}
                  unit={`per ${product.unit}`}
                  imageHeightClass="h-36"
                  decorativeIcon={Sprout}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
