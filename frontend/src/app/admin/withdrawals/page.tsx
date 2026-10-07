"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type WithdrawalStatus = "pending" | "diproses" | "selesai" | "ditolak";

interface AdminWithdrawal {
  id: string;
  amount: string | number;
  fee: string | number;
  net_amount: string | number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: WithdrawalStatus;
  admin_note: string | null;
  created_at: string;
  processed_at?: string | null;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

type Tab = "Semua" | "Menunggu" | "Selesai" | "Ditolak";
type Action = "approve" | "reject";

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

function waitingTime(d: string) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(d).getTime()) / 3600000),
  );
  if (hours < 1) return "kurang dari 1 jam";
  if (hours < 24) return `${hours} jam`;
  return `${Math.floor(hours / 24)} hari`;
}

function statusInfo(status: WithdrawalStatus) {
  switch (status) {
    case "pending":
      return { label: "MENUNGGU", cls: "bg-amber-100 text-amber-700" };
    case "diproses":
      return { label: "DIPROSES", cls: "bg-blue-100 text-blue-700" };
    case "selesai":
      return { label: "SELESAI", cls: "bg-green-100 text-green-700" };
    case "ditolak":
      return { label: "DITOLAK", cls: "bg-red-100 text-red-700" };
    default:
      return { label: String(status), cls: "bg-gray-100 text-gray-600" };
  }
}

function roleLabel(role?: string) {
  switch (role) {
    case "peternak":
      return "Peternak";
    case "logistik":
      return "Kurir";
    case "pembeli":
      return "Pembeli";
    case "admin":
      return "Admin";
    default:
      return role ?? "Pengguna";
  }
}

const isWaiting = (w: AdminWithdrawal) =>
  w.status === "pending" || w.status === "diproses";

const ITEMS_PER_PAGE = 5; // Batasan data per halaman

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<Tab>("Menunggu");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // State untuk menyimpan ID item yang sedang di-expand (diklik)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // State Paginasi
  const [currentPage, setCurrentPage] = useState(1);

  const [target, setTarget] = useState<{
    item: AdminWithdrawal;
    action: Action;
  } | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch("/admin/withdrawals");
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !Array.isArray(json.data)) {
        setLoadError(json?.message ?? "Gagal memuat daftar penarikan.");
        return;
      }
      setItems(json.data as AdminWithdrawal[]);
      setLoadError(null);
    } catch {
      setLoadError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset halaman ke 1 ketika tab atau kata kunci pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search]);

  // ---------- Statistik ----------
  const waitingList = items.filter(isWaiting);
  const doneList = items.filter((w) => w.status === "selesai");
  const rejectedList = items.filter((w) => w.status === "ditolak");
  const sum = (list: AdminWithdrawal[], key: "amount" | "fee" | "net_amount") =>
    list.reduce((acc, w) => acc + Number(w[key] || 0), 0);

  const waitingNet = sum(waitingList, "net_amount");
  const feeList = items.filter((w) => w.status !== "ditolak");
  const oldestWaiting = [...waitingList].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )[0];

  const tabs: { label: Tab; count: number }[] = [
    { label: "Semua", count: items.length },
    { label: "Menunggu", count: waitingList.length },
    { label: "Selesai", count: doneList.length },
    { label: "Ditolak", count: rejectedList.length },
  ];

  // ---------- Filter & Urutan Terbaru (DESC) ----------
  const query = search.trim().toLowerCase();
  const visible = items
    .filter((w) => {
      if (tab === "Menunggu" && !isWaiting(w)) return false;
      if (tab === "Selesai" && w.status !== "selesai") return false;
      if (tab === "Ditolak" && w.status !== "ditolak") return false;
      if (!query) return true;
      return [
        w.user?.name,
        w.user?.email,
        w.bank_name,
        w.bank_account_number,
        w.bank_account_name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    })
    .sort((a, b) => {
      // Urutkan murni berdasarkan dibuat terbaru (DESC)
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });

  // ---------- Logic Paginasi ----------
  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
  const paginatedVisible = visible.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ---------- Aksi ----------
  const openModal = (item: AdminWithdrawal, action: Action) => {
    setTarget({ item, action });
    setNote("");
    setModalError(null);
  };

  const closeModal = () => {
    if (processing) return;
    setTarget(null);
    setNote("");
    setModalError(null);
  };

  const submitProcess = async () => {
    if (!target) return;
    const { item, action } = target;
    const trimmed = note.trim();

    if (action === "reject" && trimmed.length < 3) {
      setModalError("Isi alasan penolakan (minimal 3 karakter).");
      return;
    }
    if (trimmed.length > 255) {
      setModalError("Catatan maksimal 255 karakter.");
      return;
    }

    setProcessing(true);
    setModalError(null);
    try {
      const res = await apiFetch(`/admin/withdrawals/${item.id}/process`, {
        method: "PUT",
        body: JSON.stringify({
          status: action === "approve" ? "selesai" : "ditolak",
          admin_note: trimmed || null,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setModalError(json?.message ?? "Gagal memproses penarikan.");
        return;
      }

      setTarget(null);
      setNote("");
      setNotice({
        type: "success",
        text:
          action === "approve"
            ? `Penarikan ${item.user?.name ?? ""} ditandai selesai.`
            : `Penarikan ${item.user?.name ?? ""} ditolak dan saldo dikembalikan.`,
      });
      await fetchAll();
    } catch {
      setModalError("Tidak dapat terhubung ke server.");
    } finally {
      setProcessing(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      /* clipboard error handler */
    }
  };

  const steps = [
    {
      title: "Cek rekening tujuan",
      desc: "Salin nomor rekening dan pastikan nama pemilik sesuai.",
    },
    {
      title: "Transfer manual",
      desc: "Transfer sebesar nominal “Harus ditransfer” (sudah dipotong biaya admin) lewat bank Anda.",
    },
    {
      title: "Tandai selesai",
      desc: "Klik Setujui setelah transfer berhasil. Penarikan ditutup dan tidak bisa diubah lagi.",
    },
    {
      title: "Atau tolak",
      desc: "Isi alasan penolakan. Saldo dikembalikan penuh ke pengguna dan biaya admin dibatalkan.",
    },
  ];

  const inputCls =
    "w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-admin-primary";

  return (
    <>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">
              Penarikan Saldo
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Setujui atau tolak permintaan penarikan dari peternak, kurir, dan
              pembeli.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            disabled={refreshing}
            className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-gray-50 border border-black/10 text-gray-800 font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-admin-primary ${refreshing ? "animate-spin" : ""}`}
            />
            Perbarui Data
          </button>
        </div>

        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs font-semibold flex justify-between gap-3 ${
              notice.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)}>
              ✕
            </button>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {loadError}
          </div>
        )}

        {/* Statistik */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Menunggu
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : waitingList.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(waitingNet)} harus ditransfer
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Selesai
              </span>
              <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : doneList.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sum(doneList, "net_amount"))} sudah ditransfer
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Ditolak
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : rejectedList.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sum(rejectedList, "amount"))} dikembalikan
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Biaya Penarikan
              </span>
              <div className="w-8 h-8 rounded-xl bg-admin-primary-light text-admin-primary flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 font-tabular">
                {loading ? "..." : formatRupiah(sum(feeList, "fee"))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Dari penarikan tidak ditolak
              </div>
            </div>
          </div>
        </div>

        {/* Baris utama: daftar (kiri) | panduan & antrean (kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Daftar */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex border-b border-black/10 overflow-x-auto sm:flex-1">
                {tabs.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTab(t.label)}
                    className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 flex items-center gap-2 transition-colors ${
                      tab === t.label
                        ? "border-admin-primary text-admin-primary"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {t.label}
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                        tab === t.label
                          ? "bg-admin-primary text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, bank, rekening..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-black/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-admin-primary"
                />
              </div>
            </div>

            {loading && (
              <div className="bg-white border border-black/10 rounded-2xl p-10 text-center text-xs text-gray-500 animate-pulse">
                Memuat daftar penarikan...
              </div>
            )}

            {!loading && visible.length === 0 && (
              <div className="bg-white border border-dashed border-black/15 rounded-2xl px-6 py-14 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {query
                    ? "Tidak ada hasil untuk pencarian ini"
                    : tab === "Menunggu"
                      ? "Tidak ada penarikan yang menunggu"
                      : "Belum ada data penarikan"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {query
                    ? "Coba kata kunci lain atau ganti tab."
                    : "Permintaan baru dari pengguna akan muncul di sini."}
                </p>
              </div>
            )}

            {!loading &&
              paginatedVisible.map((w) => {
                const { label, cls } = statusInfo(w.status);
                const name = w.user?.name ?? "Pengguna";
                const isExpanded = expandedId === w.id;

                return (
                  <div
                    key={w.id}
                    className="bg-white border border-black/10 rounded-2xl overflow-hidden transition-all shadow-sm hover:border-black/20"
                  >
                    {/* Ringkasan Header List (Dapat Diklik) */}
                    <div
                      onClick={() => toggleExpand(w.id)}
                      className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-admin-primary-light text-admin-primary font-bold flex items-center justify-center">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">
                            {name}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {roleLabel(w.user?.role)}
                            {w.user?.email ? ` · ${w.user.email}` : ""}
                            {" · "}
                            {formatDate(w.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                        >
                          {label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Detail Ekspansi (Hanya Muncul Saat Card Diklik) */}
                    {isExpanded && (
                      <div className="border-t border-black/5 bg-gray-50/30">
                        {/* Nominal + rekening */}
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="rounded-xl bg-white border border-black/5 px-4 py-3 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Diajukan</span>
                              <span className="font-semibold text-gray-900 font-tabular">
                                {formatRupiah(w.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Biaya admin</span>
                              <span className="font-semibold text-gray-900 font-tabular">
                                {Number(w.fee) > 0
                                  ? `- ${formatRupiah(w.fee)}`
                                  : "Gratis"}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1.5 border-t border-black/10">
                              <span className="font-bold text-gray-700">
                                Harus ditransfer
                              </span>
                              <span className="text-base font-bold text-admin-primary font-tabular">
                                {formatRupiah(w.net_amount)}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-white border border-black/5 px-4 py-3 text-xs">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Rekening Tujuan
                            </span>
                            <div className="font-bold text-gray-900">
                              {w.bank_name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-sm text-gray-900">
                                {w.bank_account_number}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyText(`${w.id}-no`, w.bank_account_number);
                                }}
                                className="p-1 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                                title="Salin nomor rekening"
                              >
                                {copiedKey === `${w.id}-no` ? (
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-gray-500 mt-0.5">
                              a.n. {w.bank_account_name}
                            </div>
                          </div>
                        </div>

                        {/* Footer Detail: Waktu + Aksi */}
                        <div className="px-5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-[11px] text-gray-500 space-y-0.5">
                            <div>Diajukan {formatDate(w.created_at)}</div>
                            {isWaiting(w) && (
                              <div className="font-bold text-amber-700">
                                Menunggu {waitingTime(w.created_at)}
                              </div>
                            )}
                            {!isWaiting(w) && w.processed_at && (
                              <div>Diproses {formatDate(w.processed_at)}</div>
                            )}
                            {w.admin_note && (
                              <div className="text-gray-700">
                                Catatan: {w.admin_note}
                              </div>
                            )}
                          </div>

                          {w.status === "pending" && (
                            <div className="flex gap-2 sm:shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(w, "reject");
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(w, "approve");
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 bg-admin-primary hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity"
                              >
                                Setujui
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Komponen Paginasi Navigasi */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between bg-white border border-black/10 rounded-2xl px-5 py-3">
                <div className="text-xs text-gray-500">
                  Halaman <span className="font-bold text-gray-900">{currentPage}</span> dari{" "}
                  <span className="font-bold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-black/10 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-black/10 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kolom kanan */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <div className="bg-admin-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block mb-2">
                Antrean Transfer
              </span>
              <div className="text-3xl font-bold font-tabular">
                {loading ? "..." : formatRupiah(waitingNet)}
              </div>
              <div className="text-xs text-white/80 mt-1">
                untuk {waitingList.length} pemohon
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/90">
                {oldestWaiting
                  ? `Terlama menunggu ${waitingTime(oldestWaiting.created_at)}`
                  : "Tidak ada antrean saat ini."}
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h3 className="text-base font-bold text-gray-900">
                  Panduan Proses
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-admin-primary-light text-admin-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {s.title}
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal konfirmasi */}
      {target && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] shadow-xl">
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">
                {target.action === "approve"
                  ? "Setujui Penarikan"
                  : "Tolak Penarikan"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="rounded-xl bg-gray-50 border border-black/5 px-4 py-3 text-xs space-y-1.5">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Pemohon</span>
                  <span className="font-bold text-gray-900 text-right">
                    {target.item.user?.name ?? "Pengguna"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    {target.action === "approve"
                      ? "Transfer sebesar"
                      : "Dikembalikan ke saldo"}
                  </span>
                  <span className="font-bold text-gray-900 font-tabular">
                    {formatRupiah(
                      target.action === "approve"
                        ? target.item.net_amount
                        : target.item.amount,
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Rekening</span>
                  <span className="font-bold text-gray-900 text-right">
                    {target.item.bank_name} {target.item.bank_account_number}
                    <br />
                    <span className="font-normal">
                      a.n. {target.item.bank_account_name}
                    </span>
                  </span>
                </div>
              </div>

              {target.action === "approve" ? (
                <p className="text-xs text-gray-600 leading-relaxed">
                  Pastikan Anda sudah mentransfer dana ke rekening di atas.
                  Setelah disetujui, status menjadi Selesai dan tidak bisa
                  diubah lagi.
                </p>
              ) : (
                <p className="text-xs text-gray-600 leading-relaxed">
                  Saldo akan dikembalikan penuh ke pengguna dan biaya admin
                  dibatalkan. Alasan penolakan akan terlihat oleh pengguna.
                </p>
              )}

              {modalError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {target.action === "approve"
                    ? "Catatan (opsional)"
                    : "Alasan penolakan *"}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={255}
                  placeholder={
                    target.action === "approve"
                      ? "Contoh: Ditransfer via BCA pukul 14.30"
                      : "Contoh: Nama pemilik rekening tidak sesuai"
                  }
                  className={`${inputCls} resize-none`}
                />
                <div className="text-[10px] text-gray-400 text-right mt-0.5">
                  {note.length}/255
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-black/10 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitProcess}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60 ${
                  target.action === "approve"
                    ? "bg-admin-primary"
                    : "bg-red-600"
                }`}
              >
                {processing
                  ? "Memproses..."
                  : target.action === "approve"
                    ? "Ya, Sudah Ditransfer"
                    : "Tolak Penarikan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}