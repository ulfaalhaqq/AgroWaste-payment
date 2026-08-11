"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import EarthyCard from "@/components/public/EarthyCard";

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
  kecamatan: string;
  rating_avg: string | number;
  review_count: number;
  image_url?: string | null;
  image_urls?: string[];
  category?: { name: string };
  nutrisi?: [string, string][] | null;
  peternak_profile?: {
    id?: string;
    nama_kandang?: string;
    nama_peternakan?: string;
    badge?: string;
    user_id?: string;
    user?: {
      id?: string;
      name?: string;
      avatar_url?: string | null;
    };
  };
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: { id: string; name: string; email: string; avatar_url?: string | null };
}

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [canReviewOrderId, setCanReviewOrderId] = useState<string | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"deskripsi" | "ulasan">(
    "deskripsi",
  );

  useEffect(() => {
    apiFetch(`/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Produk tidak ditemukan (${res.status})`);
        return res.json();
      })
      .then((json) => {
        const p: Product = json.data;
        if (p.image_url) {
          p.image_url = getProductImageUrl(p.image_url);
        }
        if (p.image_urls) {
          p.image_urls = p.image_urls.map((url) => getProductImageUrl(url));
        }
        setProduct(p);
        setActiveImage(p.image_url ?? null);
        setQty(Math.max(1, Math.ceil(parseFloat(p.min_order_kg))));
        setLoading(false);

        // Fetch similar products dynamically from DB
        apiFetch(`/products?sort=terbaru`)
          .then((r) => (r.ok ? r.json() : null))
          .then((simJson) => {
            if (simJson?.data?.data) {
              const list: Product[] = simJson.data.data.filter(
                (item: Product) => item.id !== p.id,
              );
              setSimilarProducts(list.slice(0, 4));
            }
          })
          .catch(() => {});
      })
      .catch((err: Error) => {
        setFetchError(err.message);
        setLoading(false);
      });

    // Fetch product reviews
    apiFetch(`/products/${id}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) setReviews(json.data);
      })
      .catch(() => {});

    // Check if user is eligible to review
    if (getToken()) {
      apiFetch(`/products/${id}/can-review`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.can_review) {
            setCanReview(true);
            setCanReviewOrderId(json.order_id ?? null);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewMsg(null);
    setSubmittingReview(true);

    try {
      const res = await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          product_id: id,
          order_id: canReviewOrderId,
          rating: newRating,
          comment: newComment.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReviewMsg({ type: "success", text: json.message });
        setNewComment("");
        setCanReview(false); // Sembunyikan form setelah sukses (1 kali per transaksi pesanan)
        // Reload reviews & product info so rating_avg & review_count update instantly
        apiFetch(`/products/${id}/reviews`)
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => j?.data && setReviews(j.data));

        apiFetch(`/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            if (j?.data) {
              const p: Product = j.data;
              if (p.image_url) p.image_url = getProductImageUrl(p.image_url);
              if (p.image_urls) p.image_urls = p.image_urls.map((url) => getProductImageUrl(url));
              setProduct(p);
            }
          });
      } else {
        setReviewMsg({
          type: "error",
          text: json.message || "Gagal mengirim ulasan.",
        });
      }
    } catch {
      setReviewMsg({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!getToken()) {
      router.push(`/login?callbackUrl=/marketplace/${id}`);
      return;
    }
    setCartError(null);
    setCartLoading(true);
    try {
      const res = await apiFetch("/cart-items", {
        method: "POST",
        body: JSON.stringify({ product_id: product!.id, quantity_kg: qty }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCartError(json.message ?? "Gagal menambahkan ke keranjang.");
      } else {
        setCartSuccess(true);
        window.dispatchEvent(new Event("cart-change"));
        setTimeout(() => setCartSuccess(false), 2500);
      }
    } catch {
      setCartError("Tidak dapat terhubung ke server.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!getToken()) {
      router.push(`/login?callbackUrl=/marketplace/${id}`);
      return;
    }
    setCartError(null);
    setBuyNowLoading(true);
    try {
      const res = await apiFetch("/cart-items", {
        method: "POST",
        body: JSON.stringify({ product_id: product!.id, quantity_kg: qty }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCartError(json.message ?? "Gagal menambahkan ke keranjang.");
      } else {
        window.dispatchEvent(new Event("cart-change"));
        router.push("/checkout");
      }
    } catch {
      setCartError("Tidak dapat terhubung ke server.");
    } finally {
      setBuyNowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 pb-20">
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="h-3 w-48 bg-[#E8E0D5] rounded-full mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-[4/3] bg-[#E8E0D5] rounded-3xl animate-pulse" />
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-[#E8E0D5] animate-pulse" />
              </div>
              <div className="h-4 bg-[#E8E0D5] rounded-full animate-pulse" />
              <div className="h-4 bg-[#E8E0D5] rounded-full w-4/5 animate-pulse" />
              <div className="h-4 bg-[#E8E0D5] rounded-full w-3/4 animate-pulse" />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="h-8 bg-[#E8E0D5] rounded-full" />
                <div className="h-6 bg-[#E8E0D5] rounded-full w-2/3" />
                <div className="h-24 bg-[#E8E0D5] rounded-xl" />
                <div className="h-14 bg-[#E8E0D5] rounded-xl" />
                <div className="h-14 bg-[#E8E0D5] rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-lg font-bold text-[#111111] mb-2">
            {fetchError ?? "Produk tidak ditemukan."}
          </p>
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

  const minQty = Math.max(1, Math.ceil(parseFloat(product.min_order_kg)));
  const step = minQty;

  return (
    <div className="flex-1 animate-fade-in pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-[10px] text-[#555555] font-bold tracking-wider uppercase mb-8">
          <Link
            href="/marketplace"
            className="hover:text-[#009A44] transition-colors"
          >
            Marketplace
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[#111111] line-clamp-1 max-w-[180px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="mb-8">
              {/* Main image */}
              <div className="aspect-[4/3] bg-[#F0F5F1] rounded-3xl overflow-hidden mb-4 border border-[#E8E0D5] flex items-center justify-center relative">
                {activeImage && (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
                <Leaf className="w-24 h-24 text-[#009A44]/15" />
              </div>

              {/* Thumbnails */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {product.image_urls && product.image_urls.length > 0 ? (
                  product.image_urls.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center transition-colors relative ${
                        activeImage === url
                          ? "border-2 border-[#009A44] bg-[#F0F5F1]"
                          : "border border-[#E8E0D5] bg-[#F0F5F1] hover:border-[#009A44]"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Gambar ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                      <Leaf className="w-6 h-6 text-[#009A44]/30" />
                    </button>
                  ))
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-[#009A44] bg-[#F0F5F1] flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-[#009A44]/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E8E0D5] mb-8">
              <button
                type="button"
                onClick={() => setActiveTab("deskripsi")}
                className={`px-6 py-3 font-bold text-sm transition-colors ${
                  activeTab === "deskripsi"
                    ? "text-[#009A44] border-b-2 border-[#009A44]"
                    : "text-[#555555] hover:text-[#111111]"
                }`}
              >
                Deskripsi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ulasan")}
                className={`px-6 py-3 font-bold text-sm transition-colors ${
                  activeTab === "ulasan"
                    ? "text-[#009A44] border-b-2 border-[#009A44]"
                    : "text-[#555555] hover:text-[#111111]"
                }`}
              >
                Ulasan ({reviews.length})
              </button>
            </div>

            {/* Description/Reviews Content Area */}
            {activeTab === "deskripsi" ? (
              <div className="space-y-8 animate-fade-in">
                <p className="text-[#555555] text-sm leading-relaxed">
                  {product.description ??
                    "Belum ada deskripsi untuk produk ini."}
                </p>

                {/* Lab Test Section — Dynamic from DB or Standard Reference */}
                {(() => {
                  const nutrisiItems: [string, string][] =
                    product.nutrisi &&
                    Array.isArray(product.nutrisi) &&
                    product.nutrisi.length > 0
                      ? product.nutrisi
                      : [
                          ["1.5%", "Nitrogen (N)"],
                          ["0.8%", "Fosfor (P)"],
                          ["1.2%", "Kalium (K)"],
                          ["25%", "C-Organik"],
                        ];

                  return (
                    <div className="bg-[#FFF8F5] border border-[#E8E0D5] rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-[#009A44]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <h3 className="font-bold text-[#111111] text-sm">
                          Kandungan Nutrisi (Uji Lab)
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {nutrisiItems.map(([val, label]) => (
                          <div
                            key={label}
                            className="bg-white border border-[#E8E0D5] p-4 rounded-xl text-center shadow-sm"
                          >
                            <div className="font-bold text-lg text-[#009A44] mb-1">
                              {val}
                            </div>
                            <div className="text-[10px] font-bold text-[#555555] uppercase">
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {/* Form Ulasan Jika User Memenuhi Syarat (Sudah Menerima Pesanan) */}
                {canReview && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="bg-[#E6F5EC]/50 border border-[#009A44]/30 rounded-3xl p-6 sm:p-8"
                  >
                    <h3 className="font-bold text-[#111111] text-base mb-1">
                      Berikan Ulasan Anda
                    </h3>
                    <p className="text-xs text-[#555555] mb-4">
                      Anda dapat memberikan ulasan karena telah menerima pesanan
                      produk ini.
                    </p>

                    {reviewMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold mb-4 ${
                          reviewMsg.type === "success"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {reviewMsg.text}
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-xs font-bold text-[#555555] mb-2">
                        Rating Produk *
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                          >
                            <svg
                              className={`w-7 h-7 ${star <= newRating ? "fill-amber-400" : "text-gray-300 fill-transparent"}`}
                              stroke="currentColor"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              />
                            </svg>
                          </button>
                        ))}
                        <span className="text-xs font-bold text-[#009A44] ml-2">
                          {newRating} / 5 Bintang
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-bold text-[#555555] mb-1">
                        Komentar Ulasan
                      </label>
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tuliskan pengalaman Anda menggunakan produk pupuk ini..."
                        className="w-full p-3 bg-white border border-[#E8E0D5] rounded-xl text-xs sm:text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#009A44] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 bg-[#009A44] hover:bg-[#008139] text-white font-bold rounded-full text-xs shadow-md transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {submittingReview ? "Mengirim Ulasan..." : "Kirim Ulasan"}
                    </button>
                  </form>
                )}

                {/* List Ulasan Produk */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rev) => {
                      const userName = rev.user?.name ?? "Pembeli Organik";
                      const initial = userName.charAt(0).toUpperCase();

                      return (
                        <div
                          key={rev.id}
                          className="bg-white border border-[#E8E0D5] rounded-2xl p-5 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {rev.user?.avatar_url ? (
                                <img
                                  src={rev.user.avatar_url}
                                  alt={userName}
                                  className="w-9 h-9 rounded-full object-cover border border-[#E8E0D5]"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#009A44]/10 text-[#009A44] font-bold flex items-center justify-center text-sm">
                                  {initial}
                                </div>
                              )}
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-[#111111]">
                                  {userName}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-[#555555]">
                                  <span>
                                    {new Date(
                                      rev.created_at,
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <svg
                                  key={s}
                                  className={`w-4 h-4 ${s <= rev.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          {rev.comment && (
                            <p className="text-xs sm:text-sm text-[#333333] leading-relaxed pl-12">
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !canReview && (
                    <div className="py-12 text-center border border-dashed border-[#E8E0D5] rounded-3xl bg-[#FBFAF7]/50 animate-fade-in w-full">
                      <svg
                        className="w-12 h-12 text-[#555555]/30 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-[#555555]">
                        Belum ada ulasan
                      </p>
                      <p className="text-xs text-[#555555]/75 mt-1">
                        Lakukan pembelian dan konfirmasi penerimaan barang untuk
                        memberikan ulasan!
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Right Column — Sticky Checkout Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Main Card */}
              <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-[#111111] mb-3">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 text-xs mb-6">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-[#111111]">
                      {Number(product.rating_avg).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[#555555]">
                    {product.review_count} ulasan
                  </div>
                  <div className="text-[#009A44] font-bold flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      ></path>
                    </svg>
                    Stok: {parseFloat(product.stock_kg).toLocaleString("id-ID")}{" "}
                    {product.unit}
                  </div>
                </div>

                <div className="bg-[#E6F5EC] border border-[#009A44]/20 rounded-xl p-4 mb-6">
                  <div className="text-[10px] font-bold text-[#009A44] uppercase tracking-wider mb-1">
                    Harga Satuan
                  </div>
                  <div className="flex items-end gap-1">
                    <div className="text-3xl font-bold text-[#009A44] font-tabular">
                      {formatRupiah(product.price)}
                    </div>
                    <div className="text-xs text-[#009A44]/80 mb-1">
                      /{product.unit}
                    </div>
                  </div>
                </div>

                {/* Farmer Info */}
                <Link
                  href={`/sellers/${product.peternak_profile?.user_id || product.peternak_profile?.id}`}
                  className="flex items-center justify-between border border-[#E8E0D5] rounded-xl p-3 mb-6 hover:border-[#009A44] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {product.peternak_profile?.user?.avatar_url ? (
                      <img
                        src={product.peternak_profile.user.avatar_url}
                        alt={product.peternak_profile?.nama_kandang || "Peternak"}
                        className="w-10 h-10 rounded-full object-cover border border-[#E8E0D5]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#2C3930] flex items-center justify-center text-white text-sm font-bold">
                        {(
                          product.peternak_profile?.nama_kandang ||
                          product.peternak_profile?.nama_peternakan ||
                          "P"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#111111]">
                          {product.peternak_profile?.nama_kandang ||
                            product.peternak_profile?.nama_peternakan ||
                            "Peternak Organik"}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-[10px] text-[#555555] flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          ></path>
                        </svg>
                        {product.kabupaten}, {product.provinsi}
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-[#E8E0D5] group-hover:text-[#009A44]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </Link>

                {/* Quantity + Actions */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[#111111]">
                      Atur Jumlah ({product.unit})
                    </span>
                    <div className="flex items-center border border-[#E8E0D5] rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          setQty((q) => Math.max(minQty, q - step))
                        }
                        className="w-8 h-8 flex items-center justify-center text-[#555555] hover:bg-[#F5F1E8] transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={minQty}
                        max={parseFloat(product.stock_kg) || 999999}
                        value={qty || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val)) {
                            setQty(0);
                          } else {
                            const maxStock = parseFloat(product.stock_kg) || 999999;
                            setQty(Math.min(maxStock, Math.max(0, val)));
                          }
                        }}
                        onBlur={() => {
                          if (!qty || qty < minQty) {
                            setQty(minQty);
                          }
                        }}
                        className="w-16 h-8 text-center text-sm font-bold text-[#111111] border-x border-[#E8E0D5] focus:outline-none focus:ring-1 focus:ring-[#009A44] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQty((q) => Math.min(parseFloat(product.stock_kg) || 999999, q + step))}
                        className="w-8 h-8 flex items-center justify-center text-[#555555] hover:bg-[#F5F1E8] transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {minQty > 1 && (
                    <p className="text-[10px] text-[#555555] mb-3">
                      Min. order: {minQty} {product.unit}
                    </p>
                  )}

                  {cartSuccess && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-[#E6F5EC] border border-[#B2DFCB] text-[#009A44] text-xs font-bold flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Berhasil ditambahkan ke keranjang!
                    </div>
                  )}
                  {cartError && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      {cartError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      className="btn-clay-secondary py-3 px-4 flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {cartLoading ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          ></path>
                        </svg>
                      )}
                      Keranjang
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={buyNowLoading || cartLoading}
                      className="btn-clay-primary py-3 px-4 flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {buyNowLoading && (
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      )}
                      Beli Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-[#FFF4E5] border border-[#FFD8A8] rounded-2xl p-5 flex gap-4">
                <svg
                  className="w-6 h-6 text-[#E67700] shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  ></path>
                </svg>
                <div>
                  <h4 className="font-bold text-[#111111] text-xs mb-1">
                    Estimasi Pengiriman
                  </h4>
                  <p className="text-[#555555] text-xs leading-relaxed">
                    Layanan Logistik AgroWaste tersedia untuk wilayah{" "}
                    {product.provinsi}.
                  </p>
                </div>
              </div>

              {/* Specs Table */}
              <div className="bg-[#F5F1E8] rounded-2xl p-5">
                <h4 className="font-bold text-[#111111] text-xs mb-4">
                  Spesifikasi Produk
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                    <span className="text-[#555555]">Jenis Ternak</span>
                    <span className="font-bold text-[#111111] capitalize">
                      {product.jenis_ternak}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                    <span className="text-[#555555]">Kondisi</span>
                    <span className="font-bold text-[#111111]">
                      {product.kondisi ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                    <span className="text-[#555555]">Min. Order</span>
                    <span className="font-bold text-[#111111]">
                      {parseFloat(product.min_order_kg).toLocaleString("id-ID")}{" "}
                      {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555555]">Stok Tersedia</span>
                    <span className="font-bold text-[#111111]">
                      {parseFloat(product.stock_kg).toLocaleString("id-ID")}{" "}
                      {product.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Produk Serupa Dynamic from DB */}
        {similarProducts.length > 0 && (
          <div className="mt-20 border-t border-[#E8E0D5] pt-12">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[#111111] mb-1">
                  Produk Serupa
                </h2>
                <p className="text-[#555555] text-sm">
                  Lengkapi kebutuhan pertanian organik Anda
                </p>
              </div>
              <Link
                href="/marketplace"
                className="text-[#009A44] hover:text-[#008139] text-sm font-bold flex items-center gap-1 transition-colors"
              >
                Lihat Semua
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => {
                const formattedKab = p.kabupaten
                  ? p.kabupaten.replace(/^Kabupaten\s+/i, "Kab. ")
                  : "";
                const categoryBadge = p.category?.name
                  ? p.category.name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                  : "Organik";

                return (
                  <EarthyCard
                    key={p.id}
                    href={`/marketplace/${p.id}`}
                    title={p.name}
                    description={
                      p.description ??
                      p.peternak_profile?.nama_kandang ??
                      p.peternak_profile?.nama_peternakan ??
                      "Produk organik berkualitas."
                    }
                    imageUrl={
                      p.image_url ? getProductImageUrl(p.image_url) : null
                    }
                    imageFallbackIcon={Leaf}
                    badgeText={categoryBadge}
                    badgeDotColorClass="bg-land-accent"
                    locationText={formattedKab || undefined}
                    rating={
                      Number(p.rating_avg) > 0
                        ? Number(p.rating_avg)
                        : undefined
                    }
                    price={formatRupiah(p.price)}
                    unit={`/ ${p.unit}`}
                    ctaText="Lihat Detail"
                    className="w-full"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
