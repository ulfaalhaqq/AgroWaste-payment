"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Sprout,
  ShieldCheck,
  Store,
  Check,
  ArrowRight,
  Ticket,
  Leaf,
} from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface CartProduct {
  id: string;
  name: string;
  price: string;
  unit: string;
  min_order_kg: string;
  kondisi: string | null;
  jenis_ternak: string;
  image_url?: string | null;
  peternak_profile?: { nama_peternakan: string; badge: string };
}

interface CartItem {
  id: string;
  product_id: string;
  quantity_kg: string;
  product: CartProduct;
}

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

const SHIPPING = 24500;

export default function CartContent() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?callbackUrl=/cart");
      return;
    }
    apiFetch("/cart-items")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat keranjang.");
        return res.json();
      })
      .then((json) => {
        setItems(json.data as CartItem[]);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.product.price) * Number(item.quantity_kg),
    0,
  );

  const handleQtyChange = async (item: CartItem, delta: number) => {
    const step = Math.max(1, parseFloat(item.product.min_order_kg));
    const current = parseFloat(item.quantity_kg);
    const newQty = Math.max(step, current + delta * step);
    if (newQty === current) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, quantity_kg: String(newQty) } : i,
      ),
    );
    setUpdating(item.id);

    try {
      const res = await apiFetch(`/cart-items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity_kg: newQty }),
      });
      if (!res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, quantity_kg: String(current) } : i,
          ),
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantity_kg: String(current) } : i,
        ),
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleDirectQtyChange = async (item: CartItem, newQty: number) => {
    const minQty = Math.max(1, parseFloat(item.product.min_order_kg));
    const finalQty = Math.max(minQty, newQty);
    const current = parseFloat(item.quantity_kg);
    if (finalQty === current) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, quantity_kg: String(finalQty) } : i,
      ),
    );
    setUpdating(item.id);

    try {
      const res = await apiFetch(`/cart-items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity_kg: finalQty }),
      });
      if (!res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, quantity_kg: String(current) } : i,
          ),
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantity_kg: String(current) } : i,
        ),
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    window.dispatchEvent(new Event("cart-change"));
    try {
      await apiFetch(`/cart-items/${id}`, { method: "DELETE" });
    } catch {
      // restore by re-fetching
      apiFetch("/cart-items")
        .then((r) => r.json())
        .then((j) => {
          setItems(j.data as CartItem[]);
          window.dispatchEvent(new Event("cart-change"));
        });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 animate-fade-in pb-24 bg-land-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
          <div className="h-12 w-72 bg-[#E8E0D5] rounded-xl mb-10 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E8E0D5]/60 rounded-[32px] p-6 animate-pulse"
                >
                  <div className="h-6 bg-[#E8E0D5] rounded-full w-1/2 mb-6" />
                  <div className="flex gap-6">
                    <div className="w-24 h-24 bg-[#E8E0D5] rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-[#E8E0D5] rounded-full w-3/4" />
                      <div className="h-4 bg-[#E8E0D5] rounded-full w-1/2" />
                      <div className="h-4 bg-[#E8E0D5] rounded-full w-1/3 mt-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white border border-[#E8E0D5] rounded-[32px] p-6 animate-pulse space-y-4">
                <div className="h-6 bg-[#E8E0D5] rounded-full" />
                <div className="h-4 bg-[#E8E0D5] rounded-full" />
                <div className="h-4 bg-[#E8E0D5] rounded-full" />
                <div className="h-4 bg-[#E8E0D5] rounded-full" />
                <div className="h-12 bg-[#E8E0D5] rounded-xl mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-land-muted font-bold text-lg mb-2">{error}</p>
          <Link
            href="/marketplace"
            className="text-[#009A44] font-bold text-sm hover:underline"
          >
            ← Kembali ke Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 animate-fade-in pb-24 bg-land-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
          <div className="mb-10 pb-6 border-b border-[#E8E0D5]/60">
            <h1 className="text-4xl md:text-5xl font-land-heading font-bold text-land-ink tracking-tight mb-2">
              Keranjang Belanja
            </h1>
            <p className="text-land-muted text-sm">
              Dukung keberlanjutan pertanian dengan memanfaatkan limbah ternak.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Leaf className="w-16 h-16 text-[#E8E0D5] mb-6" />
            <p className="text-xl font-bold text-land-ink mb-2">
              Keranjang masih kosong
            </p>
            <p className="text-land-muted text-sm mb-8">
              Mulai belanja produk pupuk organik berkualitas.
            </p>
            <Link href="/marketplace" className="btn-clay-primary px-8 py-3">
              Jelajahi Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const co2 = Math.round(
    items.reduce((a, i) => a + parseFloat(i.quantity_kg) * 0.7, 0),
  );

  return (
    <div className="flex-1 animate-fade-in pb-24 bg-land-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-[#E8E0D5]/60">
          <div>
            <h1 className="text-4xl md:text-5xl font-land-heading font-bold text-land-ink tracking-tight mb-2">
              Keranjang Belanja
            </h1>
            <p className="text-land-muted text-sm">
              Dukung keberlanjutan pertanian dengan memanfaatkan limbah ternak.
            </p>
          </div>
          <div className="px-4 py-2 bg-white border border-[#E8E0D5] rounded-full text-xs font-bold text-land-muted tracking-wider uppercase shadow-sm">
            {items.length} Barang Terpilih
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column — Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => {
              const farmerName =
                item.product.peternak_profile?.nama_peternakan ??
                "Peternak AgroWaste";
              const badge = item.product.peternak_profile?.badge;
              const isVerified =
                !badge ||
                badge === "none" ||
                badge === "verified" ||
                badge === "terverifikasi";
              const badgeLabel = isVerified
                ? "Produsen Terverifikasi"
                : "Pilihan Berkelanjutan";
              const step = Math.max(1, parseFloat(item.product.min_order_kg));
              const qty = parseFloat(item.quantity_kg);
              const descParts = [
                item.product.kondisi,
                item.product.jenis_ternak,
              ].filter(Boolean);

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#E8E0D5]/60 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  {/* Farmer Info Header */}
                  <div className="bg-[#F0EDE6]/30 px-6 py-4 border-b border-[#E8E0D5]/50 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/LOGO.png"
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-sm font-bold text-land-ink flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-land-clay" />
                        {farmerName}
                      </span>
                    </div>
                    <div
                      className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        isVerified
                          ? "bg-[#E6F5EC] border-[#B2DFCB] text-[#009A44]"
                          : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}
                    >
                      {isVerified ? (
                        <Check className="w-3.5 h-3.5 text-[#009A44]" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {badgeLabel}
                    </div>
                  </div>

                  {/* Product details */}
                  <div className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-start">
                    {/* Product photo */}
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-[#F0F5F1] border border-[#E8E0D5]/40 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.product.image_url ? (
                        <img
                          src={getProductImageUrl(item.product.image_url)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Leaf className="w-7 h-7 sm:w-10 sm:h-10 text-[#009A44]/20" />
                      )}
                    </div>

                    {/* Content block */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-land-heading text-lg sm:text-xl font-bold text-land-ink leading-snug truncate sm:whitespace-normal">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-land-muted mt-0.5">
                            {descParts.length > 0
                              ? descParts.join(" • ")
                              : `${qty} ${item.product.unit}`}
                          </p>
                        </div>
                        <div className="text-base sm:text-xl font-bold text-[#009A44] font-tabular whitespace-nowrap mt-1 md:mt-0">
                          {formatRupiah(item.product.price)}
                          <span className="text-xs font-normal text-land-muted">
                            /{item.product.unit}
                          </span>
                        </div>
                      </div>

                      {/* Controls row */}
                      <div className="flex flex-wrap justify-between items-center pt-3 mt-4 border-t border-[#E8E0D5]/40 gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQtyChange(item, -1)}
                            disabled={updating === item.id || qty <= step}
                            className="w-8 h-8 rounded-full border border-[#E8E0D5] flex items-center justify-center text-land-ink hover:bg-land-warm hover:border-land-clay transition-all duration-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          >
                            -
                          </button>
                          <div className="flex items-center border border-[#E8E0D5] rounded-xl overflow-hidden bg-white px-2 py-1">
                            <input
                              type="number"
                              min={step}
                              value={qty || ""}
                              disabled={updating === item.id}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                const nextVal = isNaN(val) ? 0 : Math.max(0, val);
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id ? { ...i, quantity_kg: String(nextVal) } : i
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                handleDirectQtyChange(item, isNaN(val) ? step : val);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-16 text-center text-sm font-bold text-land-ink focus:outline-none font-tabular [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs font-bold text-land-muted pr-1">
                              {item.product.unit}
                            </span>
                          </div>
                          <button
                            onClick={() => handleQtyChange(item, 1)}
                            disabled={updating === item.id}
                            className="w-8 h-8 rounded-full border border-[#E8E0D5] flex items-center justify-center text-land-ink hover:bg-land-warm hover:border-land-clay transition-all duration-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors p-1 group"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column — Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Impact Metric Card */}
            <div className="bg-[#2C3930] text-[#FBFAF7] rounded-[32px] p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px] group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#009A44] rounded-full blur-3xl opacity-35 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-[#4ADE80]" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-widest text-[#4ADE80]">
                    Dampak Lingkungan
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-5xl font-bold font-land-heading tracking-tight">
                    {co2}
                  </span>
                  <span className="text-base font-bold opacity-90">
                    kg CO₂e Berkurang
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[#FBFAF7]/80 relative z-10 pt-4 border-t border-white/10">
                Membeli produk ini berkontribusi pada reduksi emisi metana
                (dalam satuan CO₂e) dan mencegah emisi gas rumah kaca berbahaya.
              </p>
            </div>

            {/* Billing */}
            <div className="bg-white border border-[#E8E0D5]/80 rounded-[32px] p-6 shadow-sm">
              <h3 className="font-land-heading text-xl font-bold text-land-ink mb-6">
                Ringkasan Belanja
              </h3>

              <div className="space-y-4 text-sm border-b border-dashed border-[#E8E0D5] pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-land-muted">Subtotal Produk</span>
                  <span className="font-bold text-land-ink font-tabular">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-land-muted">Ongkir Layanan (GIS)</span>
                  <span className="font-bold text-land-ink font-tabular">
                    {formatRupiah(SHIPPING)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-bold text-land-ink">
                  Total Tagihan
                </span>
                <span className="text-2xl font-bold text-[#009A44] font-tabular">
                  {formatRupiah(subtotal + SHIPPING)}
                </span>
              </div>
              <Link
                href="/checkout"
                className="btn-clay-primary py-4 w-full flex items-center justify-center gap-2 mb-4"
              >
                Lanjut ke Pembayaran
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Secure Payment */}
            <div className="text-center text-[10px] text-land-muted font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#009A44]" />
              Pembayaran aman dengan enkripsi SSL 256-bit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
