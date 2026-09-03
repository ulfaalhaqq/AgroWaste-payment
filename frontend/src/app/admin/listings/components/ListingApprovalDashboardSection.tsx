"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import type { Listing } from "./AdminListing";

interface ListingApprovalDashboardSectionProps {
  listings: Listing[];
  onApprove: (listing: Listing) => void;
  onReject: (listing: Listing) => void;
}

const PRODUCT_ICONS: Record<string, React.ReactElement> = {
  grain: (
    <svg
      className="w-5 h-5 text-admin-semamber"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  ),
  liquid: (
    <svg
      className="w-5 h-5 text-admin-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
      />
    </svg>
  ),
  organic: (
    <svg
      className="w-5 h-5 text-admin-semgreen"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
      />
    </svg>
  ),
};

function sellerBadgeClass(badge: string) {
  if (badge.includes("VERIFIED")) return "text-green-600 bg-green-50";
  if (badge.includes("ELITE")) return "text-purple-600 bg-purple-50";
  return "text-admin-textsecondary bg-admin-warmbg";
}

export const ListingApprovalDashboardSection = ({
  listings,
  onApprove,
  onReject,
}: ListingApprovalDashboardSectionProps) => {
  const [activeFilter, setActiveFilter] = useState<string>("All Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "All Pending",
    "Kotoran Padat",
    "Limbah Cair",
    "Limbah Olahan",
  ]);
  const [detailModalItem, setDetailModalItem] = useState<Listing | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    apiFetch("/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const catNames: string[] = json.data
            .map((c: { name?: string; slug?: string }) => {
              const raw = (c.name || c.slug || "").toLowerCase();
              if (raw.includes("pakan")) return null; // Exclude pakan
              if (raw.includes("cair")) return "Limbah Cair";
              if (raw.includes("olahan")) return "Limbah Olahan";
              if (raw.includes("padat") || raw.includes("kotoran")) return "Kotoran Padat";
              return c.name || "Lainnya";
            })
            .filter((name: string | null): name is string => Boolean(name));
          const uniqueCats = Array.from(new Set(["All Pending", ...catNames]));
          setCategoriesList(uniqueCats);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result =
      activeFilter === "All Pending"
        ? listings
        : listings.filter((l) => l.category === activeFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.seller.toLowerCase().includes(q),
      );
    }

    return result;
  }, [listings, activeFilter, searchQuery]);

  return (
    <div className="bg-admin-surfacewhite border border-admin-hairline rounded-2xl overflow-hidden shadow-sm">
      {/* Controls */}
      <div className="p-4 border-b border-admin-hairline flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          className="flex bg-admin-warmbg p-1 rounded-xl gap-1 max-w-full overflow-x-auto w-full lg:w-auto"
          role="tablist"
          aria-label="Category filter"
        >
          {categoriesList.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={activeFilter === f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 font-bold rounded-lg text-xs transition-all whitespace-nowrap ${
                activeFilter === f
                  ? "bg-admin-surfacewhite text-admin-primary shadow-sm"
                  : "text-admin-textsecondary hover:text-admin-textprimary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-admin-textsecondary">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk atau nama penjual..."
            className="w-full pl-9 pr-4 py-2 bg-admin-warmbg border border-admin-hairline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-admin-hairline bg-[#F9F8F6] text-[11px] font-bold text-admin-textsecondary uppercase tracking-wider">
              <th className="px-4 py-3">Produk Komoditas</th>
              <th className="px-4 py-3">Nama Penjual</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Tanggal Pengajuan</th>
              <th className="px-4 py-3">Harga / Satuan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Aksi Moderasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-hairline">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="font-bold text-admin-textprimary mb-1">
                    {searchQuery.trim()
                      ? "Tidak ditemukan"
                      : "Semua pengajuan selesai"}
                  </p>
                  <p className="text-xs text-admin-textsecondary">
                    {searchQuery.trim()
                      ? "Tidak ada listing yang cocok dengan pencarian ini."
                      : "Tidak ada listing yang perlu ditinjau saat ini."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((listing) => {
                const displayId = `AGW-${listing.id.slice(0, 8).toUpperCase()}`;
                return (
                  <tr
                    key={listing.id}
                    className="hover:bg-admin-warmbg/40 transition-colors group text-xs"
                  >
                    {/* Product Image & Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-admin-warmbg flex items-center justify-center shrink-0 border border-admin-hairline">
                          {listing.imageUrl ? (
                            <img
                              src={listing.imageUrl}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            PRODUCT_ICONS[listing.icon] || (
                              <svg
                                className="w-5 h-5 text-admin-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            )
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <div className="font-bold text-admin-textprimary truncate group-hover:text-admin-primary transition-colors">
                            {listing.title}
                          </div>
                          <span className="text-[11px] text-admin-textsecondary font-tabular block truncate">
                            ID: {displayId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-admin-textprimary truncate max-w-[150px]">
                        {listing.seller}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sellerBadgeClass(listing.sellerBadge)}`}
                      >
                        {listing.sellerBadge}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-admin-warmbg text-admin-textsecondary rounded-full whitespace-nowrap">
                        {listing.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-admin-textsecondary font-tabular whitespace-nowrap">
                      {listing.date}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-admin-primary font-tabular">
                        IDR {listing.price}{" "}
                        <span className="text-[10px] font-normal text-admin-textsecondary">
                          / {listing.unit}
                        </span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                          aria-hidden="true"
                        />
                        Pending
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailModalItem(listing)}
                          className="px-2.5 py-1 bg-white border border-admin-hairline text-admin-textprimary hover:bg-admin-warmbg text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-admin-textsecondary"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Detail
                        </button>
                        <button
                          type="button"
                          aria-label={`Setujui listing ${listing.title}`}
                          onClick={() => onApprove(listing)}
                          className="p-1.5 bg-green-50 border border-green-200 text-admin-semgreen hover:bg-admin-semgreen hover:text-white hover:border-transparent rounded-lg transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label={`Tolak listing ${listing.title}`}
                          onClick={() => onReject(listing)}
                          className="p-1.5 bg-red-50 border border-red-200 text-admin-semred hover:bg-admin-semred hover:text-white hover:border-transparent rounded-lg transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {isMounted && detailModalItem && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-admin-surfacewhite rounded-[32px] max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 border border-admin-hairline relative animate-fade-in">
            <button
              type="button"
              aria-label="Tutup detail modal"
              onClick={() => setDetailModalItem(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-admin-warmbg flex items-center justify-center text-admin-textsecondary hover:text-admin-textprimary hover:bg-admin-hairline transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-admin-warmbg shrink-0 border border-admin-hairline flex items-center justify-center shadow-inner">
                {detailModalItem.imageUrl ? (
                  <img
                    src={detailModalItem.imageUrl}
                    alt={detailModalItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-admin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary bg-admin-primary-light px-2.5 py-0.5 rounded-full inline-block">
                    {detailModalItem.category}
                  </span>
                  {detailModalItem.jenisTernak && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block">
                      {detailModalItem.jenisTernak}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-admin-textprimary leading-snug">
                  {detailModalItem.title}
                </h3>
                <p className="text-xs text-admin-textsecondary font-tabular mt-0.5">
                  ID: AGW-{detailModalItem.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Informational Grid of Form Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-admin-warmbg/80 border border-admin-hairline p-4 rounded-2xl text-xs">
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Nama Penjual</span>
                <span className="font-bold text-admin-textprimary truncate block">{detailModalItem.seller}</span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Harga Satuan</span>
                <span className="font-bold text-admin-primary font-tabular">IDR {detailModalItem.price} / {detailModalItem.unit}</span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Stok Tersedia</span>
                <span className="font-bold text-admin-textprimary font-tabular">
                  {detailModalItem.stockKg ? `${detailModalItem.stockKg.toLocaleString("id-ID")} ${detailModalItem.unit}` : "5.000 kg"}
                </span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Min. Pembelian</span>
                <span className="font-bold text-admin-textprimary font-tabular">
                  {detailModalItem.minOrderKg ? `${detailModalItem.minOrderKg.toLocaleString("id-ID")} ${detailModalItem.unit}` : "100 kg"}
                </span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Kondisi Produk</span>
                <span className="font-semibold text-admin-textprimary">{detailModalItem.kondisi || "Kering Fermentasi"}</span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Asal Lokasi</span>
                <span className="font-semibold text-admin-textprimary truncate block">
                  {detailModalItem.kabupaten ? `${detailModalItem.kabupaten}, ${detailModalItem.provinsi || ""}` : "Malang, Jawa Timur"}
                </span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Tanggal Pengajuan</span>
                <span className="font-semibold text-admin-textprimary">{detailModalItem.date}</span>
              </div>
              <div>
                <span className="text-admin-textsecondary block text-[10px] font-bold uppercase tracking-wider mb-0.5">Status Moderasi</span>
                <span className="font-bold text-amber-600">Pending Review</span>
              </div>
            </div>

            {/* Kandungan Nutrisi (Uji Lab) jika ada */}
            {detailModalItem.nutrisi && Object.keys(detailModalItem.nutrisi).length > 0 && (
              <div>
                <span className="text-xs font-bold text-admin-textsecondary uppercase tracking-wider block mb-1.5">
                  Kandungan Nutrisi / Uji Lab
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(detailModalItem.nutrisi).map(([key, val]) => (
                    <span key={key} className="px-2.5 py-1 bg-green-50 border border-green-200 text-admin-semgreen font-bold text-[11px] rounded-lg">
                      {key.toUpperCase()}: {val}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deskripsi Lengkap */}
            <div>
              <span className="text-xs font-bold text-admin-textsecondary uppercase tracking-wider block mb-1.5">
                Deskripsi Produk Lengkap
              </span>
              <p className="text-xs text-admin-textprimary leading-relaxed bg-white border border-admin-hairline p-3.5 rounded-2xl max-h-36 overflow-y-auto">
                {detailModalItem.description || "Tidak ada deskripsi tambahan dari penjual."}
              </p>
            </div>

            <div className="flex gap-3 pt-2 border-t border-admin-hairline justify-end">
              <button
                type="button"
                onClick={() => {
                  const item = detailModalItem;
                  setDetailModalItem(null);
                  onReject(item);
                }}
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-admin-semred border border-red-200 text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                Tolak Listing
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailModalItem;
                  setDetailModalItem(null);
                  onApprove(item);
                }}
                className="px-5 py-2.5 bg-admin-primary hover:bg-admin-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-admin-primary/20 active:scale-95"
              >
                Setujui Listing
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pagination */}
      <div className="p-4 border-t border-admin-hairline flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-admin-textsecondary font-medium font-tabular">
          Menampilkan{" "}
          <span className="text-admin-textprimary font-bold">
            {filtered.length}
          </span>{" "}
          dari{" "}
          <span className="text-admin-textprimary font-bold">
            {listings.length}
          </span>{" "}
          pengajuan
        </span>
      </div>
    </div>
  );
};