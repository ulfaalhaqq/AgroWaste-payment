"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight, Plus, Check, X, Leaf } from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import EarthyCard from "./EarthyCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  min_order_kg: string;
  kabupaten: string;
  rating_avg: string | number;
  review_count: number;
  image_url?: string | null;
  peternak_profile?: { nama_peternakan: string; badge: string };
  category?: { name: string };
}

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatCategoryBadge(text: string | undefined | null): string {
  if (!text) return "Organik";
  return text.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function FeaturedProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?sort=terbaru`)
      .then((r) => (r.ok ? r.json() : { data: { data: [] } }))
      .then((json) => {
        const list: Product[] = json.data?.data ?? [];
        setProducts(list.slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!getToken()) {
      router.push("/login?callbackUrl=/marketplace");
      return;
    }

    setAddingId(product.id);
    setErrorId(null);

    try {
      const res = await apiFetch("/cart-items", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          quantity_kg: Math.max(1, parseFloat(product.min_order_kg || "1")),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorId(product.id);
        setTimeout(() => setErrorId(null), 2500);
      } else {
        window.dispatchEvent(new Event("cart-change"));
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
      }
    } catch {
      setErrorId(product.id);
      setTimeout(() => setErrorId(null), 2500);
    } finally {
      setAddingId(null);
    }
  };

  const sectionHeader = (
    <div className="max-w-7xl mx-auto px-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-land-ink text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-[#E8E0D5]">
          <ShoppingCart className="w-4 h-4 text-land-accent" />
          Bursa Organik
        </div>
        <h2
          className="font-land-heading font-bold text-land-ink text-3xl lg:text-4xl leading-tight mb-4"
          style={{ textWrap: "balance" }}
        >
          Pupuk pilihan langsung dari sumbernya.
        </h2>
        <p className="text-land-muted text-base md:text-lg leading-relaxed">
          Jelajahi produk organik berkualitas tinggi yang telah diverifikasi.
          Membantu menyuburkan tanaman Anda sekaligus menjaga keseimbangan alam.
        </p>
      </div>
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-land-accent font-bold hover:gap-3 transition-all shrink-0"
      >
        Lihat Semua Koleksi
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );

  /* loading */
  if (loading) {
    return (
      <section className="py-10 md:py-12 w-full">
        {sectionHeader}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-6 max-w-7xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#E8E0D5] animate-pulse"
            >
              <div className="w-full h-28 sm:h-44 rounded-xl bg-[#E8E0D5] mb-3 sm:mb-5" />
              <div className="px-2 pb-2 space-y-3">
                <div className="h-4 bg-[#E8E0D5] rounded-full w-4/5" />
                <div className="h-4 bg-[#E8E0D5] rounded-full w-full" />
                <div className="h-4 bg-[#E8E0D5] rounded-full w-2/3" />
                <div className="flex justify-between items-center mt-4">
                  <div className="h-6 bg-[#E8E0D5] rounded-full w-1/3" />
                  <div className="w-12 h-12 bg-[#E8E0D5] rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* render */
  return (
    <section className="py-10 md:py-12 w-full">
      {sectionHeader}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-6 max-w-7xl mx-auto">
        {products.map((product) => (
          <EarthyCard
            key={product.id}
            href={`/marketplace/${product.id}`}
            title={product.name}
            description={
              product.description ??
              product.peternak_profile?.nama_peternakan ??
              "Produk organik berkualitas terverifikasi."
            }
            imageUrl={
              product.image_url ? getProductImageUrl(product.image_url) : null
            }
            imageFallbackIcon={Leaf}
            badgeText={formatCategoryBadge(product.category?.name || "Organik")}
            badgeDotColorClass="bg-land-accent"
            locationText={product.kabupaten || undefined}
            rating={
              Number(product.rating_avg) > 0
                ? Number(product.rating_avg)
                : undefined
            }
            price={formatRupiah(product.price)}
            unit={`/ ${product.unit}`}
            ctaText="Lihat Detail"
            onCtaClick={(e) => handleAddToCart(product, e)}
            ctaLoading={addingId === product.id}
            ctaSuccess={addedId === product.id}
            ctaError={errorId === product.id}
            ctaIcon={Plus}
            ctaSuccessIcon={Check}
            ctaErrorIcon={X}
            decorativeIcon={Leaf}
            className="w-full"
          />
        ))}
      </div>

      {/* Button link only visible on mobile at the bottom */}
      <div className="mt-8 flex justify-center md:hidden px-4">
        <Link
          href="/marketplace"
          className="w-full text-center py-3.5 border border-land-accent text-land-accent font-bold rounded-full text-sm"
        >
          Lihat Semua Koleksi →
        </Link>
      </div>
    </section>
  );
}
