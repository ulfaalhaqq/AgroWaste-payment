"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";

interface ProofItem {
  image_path?: string | null;
  created_at?: string | null;
}

interface ManualOrder {
  id: string;
  order_number?: string | null;
  total_price: string | number;
  status: string;
  metode_pembayaran?: string | null;
  created_at: string;
  user?: { name?: string; phone?: string | null } | null;
  peternak?: { name?: string } | null;
  payment?: {
    id?: string;
    status?: string;
    // relasi proof bisa berupa satu objek atau daftar; keduanya ditangani
    proof?: ProofItem | ProofItem[] | null;
  } | null;
}

interface AdminBank {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

type Tab = "Perlu Dicek" | "Belum Ada Bukti" | "Sudah Dikonfirmasi" | "Semua";

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

function getProof(o: ManualOrder): ProofItem | null {
  const raw = o.payment?.proof;
  if (Array.isArray(raw)) return raw[raw.length - 1] ?? null;
  return raw ?? null;
}

const hasProof = (o: ManualOrder) => Boolean(getProof(o)?.image_path);
const isWaiting = (o: ManualOrder) => o.status === "menunggu_pembayaran";

function orderStatusInfo(o: ManualOrder) {
  if (isWaiting(o)) {
    return hasProof(o)
      ? { label: "PERLU DICEK", cls: "bg-blue-100 text-blue-700" }
      : { label: "BELUM ADA BUKTI", cls: "bg-amber-100 text-amber-700" };
  }
  switch (o.status) {
    case "menunggu_konfirmasi":
      return { label: "TERKONFIRMASI · MENUNGGU PETERNAK", cls: "bg-green-100 text-green-700" };
    case "dikonfirmasi":
      return { label: "TERKONFIRMASI · DIPROSES", cls: "bg-green-100 text-green-700" };
    case "dikirim":
      return { label: "TERKONFIRMASI · DIKIRIM", cls: "bg-green-100 text-green-700" };
    case "selesai":
      return { label: "TERKONFIRMASI · SELESAI", cls: "bg-green-100 text-green-700" };
    case "ditolak":
      return { label: "TERKONFIRMASI · DITOLAK PETERNAK", cls: "bg-red-100 text-red-700" };
    default:
      return { label: o.status.toUpperCase(), cls: "bg-gray-100 text-gray-600" };
  }
}

export default function AdminManualPaymentsPage() {
  const [orders, setOrders] = useState<ManualOrder[]>([]);
  const [adminBank, setAdminBank] = useState<AdminBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("Perlu Dicek");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [target, setTarget] = useState<ManualOrder | null>(null);
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [shipRes, bankRes] = await Promise.all([
        apiFetch("/admin/shipments"),
        apiFetch("/config/admin-bank")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      const json = await shipRes.json().catch(() => null);
      if (!shipRes.ok || !json?.success || !json.data) {
        setLoadError(json?.message ?? "Gagal memuat data pembayaran.");
        return;
      }
      const all: ManualOrder[] = Array.isArray(json.data.orders)
        ? json.data.orders
        : [];
      setOrders(all.filter((o) => o.metode_pembayaran === "manual"));
      if (bankRes?.success) setAdminBank(bankRes.data as AdminBank);
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

  // ---------- Data turunan ----------
  const toCheck = orders.filter((o) => isWaiting(o) && hasProof(o));
  const noProof = orders.filter((o) => isWaiting(o) && !hasProof(o));
  const confirmed = orders.filter((o) => !isWaiting(o));
  const sum = (list: ManualOrder[]) =>
    list.reduce((acc, o) => acc + Number(o.total_price || 0), 0);

  const tabs: { label: Tab; count: number }[] = [
    { label: "Perlu Dicek", count: toCheck.length },
    { label: "Belum Ada Bukti", count: noProof.length },
    { label: "Sudah Dikonfirmasi", count: confirmed.length },
    { label: "Semua", count: orders.length },
  ];

  const query = search.trim().toLowerCase();
  const visible = orders
    .filter((o) => {
      if (tab === "Perlu Dicek" && !(isWaiting(o) && hasProof(o))) return false;
      if (tab === "Belum Ada Bukti" && !(isWaiting(o) && !hasProof(o))) return false;
      if (tab === "Sudah Dikonfirmasi" && isWaiting(o)) return false;
      if (!query) return true;
      return [o.order_number, o.user?.name, o.peternak?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      // antrean cek: yang paling lama di atas; sisanya terbaru di atas
      return tab === "Perlu Dicek" ? ta - tb : tb - ta;
    });

  // ---------- Aksi ----------
  const openConfirm = (o: ManualOrder) => {
    setTarget(o);
    setModalError(null);
  };

  const closeModal = () => {
    if (processing) return;
    setTarget(null);
    setModalError(null);
  };

  const confirmPayment = async () => {
    if (!target) return;
    setProcessing(true);
    setModalError(null);
    try {
      const res = await apiFetch(
        `/admin/orders/${target.id}/confirm-manual-payment`,
        { method: "PUT" },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        setModalError(json?.message ?? "Gagal mengonfirmasi pembayaran.");
        return;
      }

      const no = target.order_number ?? target.id.slice(0, 8).toUpperCase();
      setTarget(null);
      setNotice({
        type: "success",
        text: json?.message ?? `Pembayaran pesanan #${no} dikonfirmasi.`,
      });
      await fetchAll();
    } catch {
      setModalError("Tidak dapat terhubung ke server.");
    } finally {
      setProcessing(false);
    }
  };

  const steps = [
    {
      title: "Lihat bukti transfer",
      desc: "Klik foto bukti untuk membukanya dalam ukuran penuh.",
    },
    {
      title: "Cocokkan dengan mutasi rekening",
      desc: "Pastikan ada dana masuk sesuai nominal pesanan ke rekening admin.",
    },
    {
      title: "Konfirmasi pembayaran",
      desc: "Pesanan pindah ke Menunggu Peternak, dan peternak baru bisa menerima atau menolak.",
    },
    {
      title: "Bukti tidak sesuai?",
      desc: "Cukup jangan dikonfirmasi. Pesanan tetap menunggu pembayaran.",
    },
  ];

  const modalOrderNo = target
    ? (target.order_number ?? target.id.slice(0, 8).toUpperCase())
    : "";

  return (
    <>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">
              Transfer Manual
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Periksa bukti transfer pembeli dan konfirmasi pembayarannya.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Perlu Dicek
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : toCheck.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sum(toCheck))} menunggu verifikasi
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Belum Ada Bukti
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : noProof.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sum(noProof))} belum diunggah buktinya
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Sudah Dikonfirmasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : confirmed.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sum(confirmed))} total terkonfirmasi
              </div>
            </div>
          </div>
        </div>

        {/* Daftar (kiri) | rekening & panduan (kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari pesanan, pembeli..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-black/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-admin-primary"
                />
              </div>
            </div>

            {loading && (
              <div className="bg-white border border-black/10 rounded-2xl p-10 text-center text-xs text-gray-500 animate-pulse">
                Memuat data pembayaran...
              </div>
            )}

            {!loading && visible.length === 0 && (
              <div className="bg-white border border-dashed border-black/15 rounded-2xl px-6 py-14 text-center">
                <p className="text-sm font-bold text-gray-900">
                  {query
                    ? "Tidak ada hasil untuk pencarian ini"
                    : tab === "Perlu Dicek"
                      ? "Tidak ada bukti transfer yang perlu dicek"
                      : "Tidak ada data di tab ini"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pesanan dengan metode Transfer Manual akan muncul di sini
                  setelah pembeli mengunggah bukti.
                </p>
              </div>
            )}

            {!loading &&
              visible.map((o) => {
                const { label, cls } = orderStatusInfo(o);
                const orderNo = o.order_number ?? o.id.slice(0, 8).toUpperCase();
                const proof = getProof(o);
                const proofUrl = proof?.image_path
                  ? getProductImageUrl(proof.image_path)
                  : null;

                return (
                  <div
                    key={o.id}
                    className="bg-white border border-black/10 rounded-2xl overflow-hidden flex flex-col sm:flex-row"
                  >
                    {/* Bukti transfer */}
                    <div className="sm:w-44 shrink-0 bg-gray-50 border-b sm:border-b-0 sm:border-r border-black/5 flex items-center justify-center min-h-[160px]">
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full"
                          title="Buka bukti transfer"
                        >
                          <img
                            src={proofUrl}
                            alt={`Bukti transfer ${orderNo}`}
                            className="w-full h-full max-h-56 sm:max-h-none object-cover"
                          />
                        </a>
                      ) : (
                        <span className="px-4 text-center text-[11px] font-semibold text-gray-400">
                          Bukti belum diunggah
                        </span>
                      )}
                    </div>

                    {/* Detail */}
                    <div className="flex-1 p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">
                            #{orderNo}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Dipesan {formatDate(o.created_at)}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-right ${cls}`}
                        >
                          {label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Nominal
                          </span>
                          <span className="text-base font-bold text-admin-primary font-tabular">
                            {formatRupiah(o.total_price)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Pembeli
                          </span>
                          <span className="font-semibold text-gray-900">
                            {o.user?.name ?? "-"}
                          </span>
                          {o.user?.phone && (
                            <span className="block text-[11px] text-gray-500">
                              {o.user.phone}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Penjual
                          </span>
                          <span className="font-semibold text-gray-900">
                            {o.peternak?.name ?? "-"}
                          </span>
                        </div>
                      </div>

                      {isWaiting(o) && (
                        <div className="mt-auto flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-[11px] text-gray-500">
                            {hasProof(o)
                              ? proof?.created_at
                                ? `Bukti diunggah ${formatDate(proof.created_at)}`
                                : "Bukti sudah diunggah"
                              : "Konfirmasi dinonaktifkan sampai bukti diunggah"}
                          </span>
                          <button
                            type="button"
                            onClick={() => openConfirm(o)}
                            disabled={!hasProof(o)}
                            className="w-full sm:w-auto px-4 py-2 bg-admin-primary hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Konfirmasi Pembayaran
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Kolom kanan */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <div className="bg-admin-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block mb-2">
                Rekening Tujuan Transfer
              </span>
              {adminBank ? (
                <>
                  <div className="text-xl font-bold">
                    {adminBank.bank_name}
                  </div>
                  <div className="font-mono text-lg mt-1">
                    {adminBank.account_number}
                  </div>
                  <div className="text-xs text-white/80 mt-1">
                    a.n. {adminBank.account_name}
                  </div>
                </>
              ) : (
                <div className="text-sm text-white/80">
                  {loading ? "Memuat..." : "Data rekening tidak tersedia."}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/90">
                Cek mutasi rekening ini sebelum mengonfirmasi.
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h3 className="text-base font-bold text-gray-900">
                  Cara Memeriksa
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {steps.map((st, i) => (
                  <div key={st.title} className="flex gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-admin-primary-light text-admin-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {st.title}
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed">
                        {st.desc}
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
          <div className="bg-white w-full max-w-md rounded-2xl border border-black/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">
                Konfirmasi Pembayaran
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

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-gray-50 border border-black/5 px-4 py-3 text-xs space-y-1.5">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Pesanan</span>
                  <span className="font-bold text-gray-900">
                    #{modalOrderNo}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Pembeli</span>
                  <span className="font-bold text-gray-900">
                    {target.user?.name ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Nominal</span>
                  <span className="font-bold text-gray-900 font-tabular">
                    {formatRupiah(target.total_price)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                Pastikan dana sudah masuk ke rekening admin dan sesuai nominal
                di atas. Setelah dikonfirmasi, pesanan diteruskan ke peternak
                dan tidak bisa dibatalkan dari sini.
              </p>

              {modalError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                  {modalError}
                </div>
              )}
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
                onClick={confirmPayment}
                disabled={processing}
                className="px-4 py-2 bg-admin-primary text-white rounded-lg text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {processing ? "Memproses..." : "Ya, Dana Sudah Masuk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}