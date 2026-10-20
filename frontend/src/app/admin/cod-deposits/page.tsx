"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { apiFetch, getProductImageUrl } from "@/lib/api";

interface CodOrder {
  id: string;
  order_number?: string | null;
  total_price: string | number;
  metode_pembayaran?: string | null;
  user?: {
    name?: string;
    phone?: string | null;
  } | null;
}

interface CourierUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  is_suspended?: boolean | number | string | null;
}

interface CodShipment {
  id: string;
  order_id: string;
  status: string;
  cod_deposit_status: string | null;
  cod_proof_path: string | null;
  cod_deadline: string | null;
  cod_warned_at: string | null;
  logistik_profile?: {
    id?: string;
    user_id?: string;
    user?: CourierUser | null;
  } | null;
}

interface Row {
  shipment: CodShipment;
  order: CodOrder | null;
  amount: number;
  overdue: boolean;
  warned: boolean;
  eligibleAt: number | null;
  eligible: boolean;
  courierId: string | null;
  courierName: string;
  suspended: boolean;
}

type Tab =
  | "Semua"
  | "Perlu Setor"
  | "Terlambat"
  | "Menunggu Verifikasi"
  | "Selesai";
type ActionType = "confirm" | "warn" | "suspend" | "unsuspend";

const SUSPEND_AFTER_WARN_MS = 24 * 60 * 60 * 1000;

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(d: string | number) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

function hoursText(ms: number) {
  const hours = Math.max(1, Math.ceil(Math.abs(ms) / 3600000));
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest > 0 ? `${days} hari ${rest} jam` : `${days} hari`;
}

function isSuspendedValue(v: CourierUser["is_suspended"]) {
  return v === true || v === 1 || v === "1";
}

function statusInfo(row: Row) {
  switch (row.shipment.cod_deposit_status) {
    case "menunggu_setor":
      return row.overdue
        ? { label: "TERLAMBAT", cls: "bg-red-100 text-red-700" }
        : { label: "MENUNGGU SETOR", cls: "bg-amber-100 text-amber-700" };
    case "menunggu_verifikasi":
      return { label: "MENUNGGU VERIFIKASI", cls: "bg-blue-100 text-blue-700" };
    case "selesai":
      return { label: "SELESAI", cls: "bg-green-100 text-green-700" };
    default:
      return {
        label: row.shipment.cod_deposit_status ?? "-",
        cls: "bg-gray-100 text-gray-600",
      };
  }
}

function buildRows(orders: CodOrder[], shipments: CodShipment[]): Row[] {
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const now = Date.now();

  return shipments
    .filter((s) => s.cod_deposit_status)
    .map((s) => {
      const order = orderMap.get(s.order_id) ?? null;
      const courier = s.logistik_profile?.user ?? null;
      const deadlineMs = s.cod_deadline ? new Date(s.cod_deadline).getTime() : null;
      const warnedMs = s.cod_warned_at ? new Date(s.cod_warned_at).getTime() : null;
      const waiting = s.cod_deposit_status === "menunggu_setor";
      const eligibleAt = warnedMs !== null ? warnedMs + SUSPEND_AFTER_WARN_MS : null;

      return {
        shipment: s,
        order,
        amount: Number(order?.total_price ?? 0),
        overdue: waiting && deadlineMs !== null && now > deadlineMs,
        warned: warnedMs !== null,
        eligibleAt,
        eligible: waiting && eligibleAt !== null && now >= eligibleAt,
        courierId: courier?.id ?? s.logistik_profile?.user_id ?? null,
        courierName: courier?.name ?? "Kurir",
        suspended: isSuspendedValue(courier?.is_suspended),
      };
    });
}

function priority(r: Row) {
  if (r.shipment.cod_deposit_status === "menunggu_verifikasi") return 0;
  if (r.overdue) return 1;
  if (r.shipment.cod_deposit_status === "menunggu_setor") return 2;
  return 3;
}

export default function AdminCodDepositsPage() {
  const [orders, setOrders] = useState<CodOrder[]>([]);
  const [shipments, setShipments] = useState<CodShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("Semua");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [pending, setPending] = useState<{ row: Row; type: ActionType } | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch("/admin/shipments");
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.data) {
        setLoadError(json?.message ?? "Gagal memuat data setoran COD.");
        return;
      }
      setOrders(Array.isArray(json.data.orders) ? json.data.orders : []);
      setShipments(Array.isArray(json.data.shipments) ? json.data.shipments : []);
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
  const rows = buildRows(orders, shipments);
  const waitingRows = rows.filter(
    (r) => r.shipment.cod_deposit_status === "menunggu_setor",
  );
  const overdueRows = rows.filter((r) => r.overdue);
  const verifyRows = rows.filter(
    (r) => r.shipment.cod_deposit_status === "menunggu_verifikasi",
  );
  const doneRows = rows.filter((r) => r.shipment.cod_deposit_status === "selesai");
  const sumAmount = (list: Row[]) =>
    list.reduce((acc, r) => acc + r.amount, 0);

  const tabs: { label: Tab; count: number }[] = [
    { label: "Semua", count: rows.length },
    { label: "Perlu Setor", count: waitingRows.length },
    { label: "Terlambat", count: overdueRows.length },
    { label: "Menunggu Verifikasi", count: verifyRows.length },
    { label: "Selesai", count: doneRows.length },
  ];

  const query = search.trim().toLowerCase();
  const visible = rows
    .filter((r) => {
      if (tab === "Perlu Setor" && r.shipment.cod_deposit_status !== "menunggu_setor") return false;
      if (tab === "Terlambat" && !r.overdue) return false;
      if (tab === "Menunggu Verifikasi" && r.shipment.cod_deposit_status !== "menunggu_verifikasi") return false;
      if (tab === "Selesai" && r.shipment.cod_deposit_status !== "selesai") return false;
      if (!query) return true;
      return [r.order?.order_number, r.courierName, r.order?.user?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (priority(a) !== priority(b)) return priority(a) - priority(b);
      const da = a.shipment.cod_deadline ? new Date(a.shipment.cod_deadline).getTime() : 0;
      const db = b.shipment.cod_deadline ? new Date(b.shipment.cod_deadline).getTime() : 0;
      return da - db;
    });

  // Kurir yang masih punya setoran tertunda
  const debtorMap = new Map<
    string,
    { name: string; count: number; total: number; overdue: number; suspended: boolean }
  >();
  waitingRows.forEach((r) => {
    const key = r.courierId ?? r.courierName;
    const cur = debtorMap.get(key) ?? {
      name: r.courierName,
      count: 0,
      total: 0,
      overdue: 0,
      suspended: r.suspended,
    };
    cur.count += 1;
    cur.total += r.amount;
    if (r.overdue) cur.overdue += 1;
    debtorMap.set(key, cur);
  });
  const debtors = Array.from(debtorMap.values()).sort(
    (a, b) => b.overdue - a.overdue || b.total - a.total,
  );

  // ---------- Aksi ----------
  const openAction = (row: Row, type: ActionType) => {
    setPending({ row, type });
    setModalError(null);
  };

  const closeModal = () => {
    if (processing) return;
    setPending(null);
    setModalError(null);
  };

  const runAction = async () => {
    if (!pending) return;
    const { row, type } = pending;

    let path = "";
    if (type === "confirm") path = `/admin/shipments/${row.shipment.id}/confirm-cod`;
    if (type === "warn") path = `/admin/shipments/${row.shipment.id}/warn-cod`;
    if (type === "suspend" || type === "unsuspend") {
      if (!row.courierId) {
        setModalError("ID akun kurir tidak ditemukan pada data pengiriman.");
        return;
      }
      // Endpoint suspend bersifat toggle (menangguhkan / mengaktifkan kembali)
      path = `/admin/users/${row.courierId}/suspend`;
    }

    setProcessing(true);
    setModalError(null);
    try {
      const res = await apiFetch(path, { method: "PUT" });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setModalError(json?.message ?? "Aksi gagal diproses.");
        return;
      }

      setPending(null);
      setNotice({
        type: "success",
        text: json.message ?? "Aksi berhasil.",
      });
      await fetchAll();
    } catch {
      setModalError("Tidak dapat terhubung ke server.");
    } finally {
      setProcessing(false);
    }
  };

  const modalContent = (() => {
    if (!pending) return null;
    const { row, type } = pending;
    const orderNo = row.order?.order_number ?? row.shipment.id.slice(0, 8).toUpperCase();
    const late =
      row.shipment.cod_deadline
        ? hoursText(Date.now() - new Date(row.shipment.cod_deadline).getTime())
        : "-";

    switch (type) {
      case "confirm":
        return {
          title: "Konfirmasi Setoran COD",
          desc: `Pastikan dana ${formatRupiah(row.amount)} untuk pesanan #${orderNo} sudah masuk ke rekening admin. Setelah dikonfirmasi, wallet peternak dan kurir dikreditkan dan tidak bisa dibatalkan.`,
          button: "Ya, Dana Sudah Masuk",
          cls: "bg-admin-primary",
        };
      case "warn":
        return {
          title: "Kirim Peringatan",
          desc: `${row.courierName} belum menyetor ${formatRupiah(row.amount)} untuk pesanan #${orderNo} (terlambat ${late}). Peringatan dicatat, dan suspend baru bisa dilakukan 24 jam setelahnya kalau setoran tetap belum masuk.`,
          button: "Kirim Peringatan",
          cls: "bg-amber-600",
        };
      case "suspend":
        return {
          title: "Suspend Kurir",
          desc: `Akun ${row.courierName} akan ditangguhkan karena belum menyetor ${formatRupiah(row.amount)} untuk pesanan #${orderNo}. Akun bisa diaktifkan kembali dari halaman ini atau Manajemen Pengguna.`,
          button: "Ya, Suspend Kurir",
          cls: "bg-red-600",
        };
      default:
        return {
          title: "Aktifkan Kembali Kurir",
          desc: `Akun ${row.courierName} akan diaktifkan kembali dan bisa dipakai lagi.`,
          button: "Ya, Aktifkan",
          cls: "bg-admin-primary",
        };
    }
  })();

  const steps = [
    {
      title: "Pembeli konfirmasi terima",
      desc: "Tenggat setor 1 hari dihitung sejak pembeli menekan Pesanan Selesai.",
    },
    {
      title: "Kurir menyetor dan unggah bukti",
      desc: "Status berubah jadi Menunggu Verifikasi dan muncul di urutan teratas.",
    },
    {
      title: "Cek lalu konfirmasi",
      desc: "Cocokkan bukti dengan mutasi rekening. Setelah dikonfirmasi, wallet peternak dan kurir terisi.",
    },
    {
      title: "Jika terlambat",
      desc: "Kirim peringatan dulu. Suspend baru tersedia 24 jam setelah peringatan, selama setoran belum masuk.",
    },
  ];

  return (
    <>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">
              Setoran COD
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Verifikasi uang tunai COD yang disetor kurir, tegur kurir yang
              terlambat, dan suspend bila perlu.
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
                Perlu Setor
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : waitingRows.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sumAmount(waitingRows))} belum masuk
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Terlambat
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : overdueRows.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sumAmount(overdueRows))} lewat tenggat
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Menunggu Verifikasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? "..." : verifyRows.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sumAmount(verifyRows))} perlu dicek
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
                {loading ? "..." : doneRows.length}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-tabular">
                {formatRupiah(sumAmount(doneRows))} sudah dikonfirmasi
              </div>
            </div>
          </div>
        </div>

        {/* Daftar (kiri) | ringkasan kurir & panduan (kanan) */}
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
                  placeholder="Cari pesanan, kurir..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-black/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-admin-primary"
                />
              </div>
            </div>

            {loading && (
              <div className="bg-white border border-black/10 rounded-2xl p-10 text-center text-xs text-gray-500 animate-pulse">
                Memuat data setoran...
              </div>
            )}

            {!loading && visible.length === 0 && (
              <div className="bg-white border border-dashed border-black/15 rounded-2xl px-6 py-14 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {query
                    ? "Tidak ada hasil untuk pencarian ini"
                    : rows.length === 0
                      ? "Belum ada setoran COD"
                      : "Tidak ada data di tab ini"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {rows.length === 0
                    ? "Setoran muncul setelah pembeli mengonfirmasi pesanan COD yang diantar kurir."
                    : "Coba ganti tab atau kata kunci."}
                </p>
              </div>
            )}

            {!loading &&
              visible.map((r) => {
                const { label, cls } = statusInfo(r);
                const s = r.shipment;
                const orderNo = r.order?.order_number ?? s.id.slice(0, 8).toUpperCase();
                const deadlineMs = s.cod_deadline ? new Date(s.cod_deadline).getTime() : null;
                const now = Date.now();

                return (
                  <div
                    key={s.id}
                    className={`bg-white border rounded-2xl overflow-hidden ${
                      r.overdue ? "border-red-200" : "border-black/10"
                    }`}
                  >
                    {/* Header kartu */}
                    <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-black/5">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          #{orderNo}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          Pembeli: {r.order?.user?.name ?? "-"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${cls}`}
                        >
                          {label}
                        </span>
                        {r.suspended && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-900 text-white text-[9px] font-bold tracking-wider">
                            KURIR DISUSPEND
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-xl bg-gray-50 border border-black/5 px-4 py-3">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Nominal Setoran
                        </span>
                        <span className="text-lg font-bold text-admin-primary font-tabular">
                          {formatRupiah(r.amount)}
                        </span>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-black/5 px-4 py-3">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Kurir
                        </span>
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {r.courierName}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {s.logistik_profile?.user?.phone ??
                            s.logistik_profile?.user?.email ??
                            "-"}
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-black/5 px-4 py-3">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Tenggat Setor
                        </span>
                        <div className="text-sm font-bold text-gray-900">
                          {s.cod_deadline ? formatDate(s.cod_deadline) : "-"}
                        </div>
                        {s.cod_deposit_status === "menunggu_setor" &&
                          deadlineMs !== null && (
                            <div
                              className={`text-[11px] font-bold ${r.overdue ? "text-red-600" : "text-amber-700"}`}
                            >
                              {r.overdue
                                ? `Terlambat ${hoursText(now - deadlineMs)}`
                                : `Sisa ${hoursText(deadlineMs - now)}`}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Peringatan */}
                    {s.cod_deposit_status === "menunggu_setor" && r.warned && (
                      <div className="mx-5 mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
                        <b>Diperingatkan</b>{" "}
                        {s.cod_warned_at ? formatDate(s.cod_warned_at) : ""}.{" "}
                        {r.eligible
                          ? "Kurir sudah bisa disuspend."
                          : r.eligibleAt
                            ? `Suspend tersedia ${formatDate(r.eligibleAt)} (${hoursText(r.eligibleAt - now)} lagi).`
                            : ""}
                      </div>
                    )}

                    {/* Aksi */}
                    <div className="px-5 pb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {s.cod_proof_path ? (
                          <a
                            href={getProductImageUrl(s.cod_proof_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-admin-primary hover:underline"
                          >
                            Lihat bukti setoran
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {s.cod_deposit_status === "menunggu_setor"
                              ? "Bukti belum diunggah kurir"
                              : ""}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end w-full sm:w-auto">
                        {s.cod_deposit_status === "menunggu_verifikasi" && (
                          <button
                            type="button"
                            onClick={() => openAction(r, "confirm")}
                            className="flex-1 sm:flex-none px-4 py-2 bg-admin-primary hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity"
                          >
                            Konfirmasi Setoran
                          </button>
                        )}

                        {s.cod_deposit_status === "menunggu_setor" &&
                          r.overdue &&
                          !r.warned && (
                            <button
                              type="button"
                              onClick={() => openAction(r, "warn")}
                              className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity"
                            >
                              Kirim Peringatan
                            </button>
                          )}

                        {s.cod_deposit_status === "menunggu_setor" &&
                          r.warned &&
                          !r.suspended && (
                            <button
                              type="button"
                              onClick={() => openAction(r, "suspend")}
                              disabled={!r.eligible}
                              title={
                                r.eligible
                                  ? "Suspend akun kurir"
                                  : "Suspend tersedia 24 jam setelah peringatan"
                              }
                              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Suspend Kurir
                            </button>
                          )}

                        {r.suspended &&
                          s.cod_deposit_status !== "selesai" && (
                            <button
                              type="button"
                              onClick={() => openAction(r, "unsuspend")}
                              className="flex-1 sm:flex-none px-4 py-2 border border-black/15 text-gray-800 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                      </div>
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
                Uang COD Belum Masuk
              </span>
              <div className="text-3xl font-bold font-tabular">
                {loading ? "..." : formatRupiah(sumAmount(waitingRows))}
              </div>
              <div className="text-xs text-white/80 mt-1">
                dari {debtors.length} kurir, {waitingRows.length} pesanan
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h3 className="text-base font-bold text-gray-900">
                  Kurir dengan Setoran Tertunda
                </h3>
              </div>
              <div className="divide-y divide-black/5">
                {loading && (
                  <div className="px-5 py-6 text-center text-xs text-gray-500 animate-pulse">
                    Memuat...
                  </div>
                )}
                {!loading && debtors.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm font-bold text-gray-900">
                      Semua setoran aman
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tidak ada kurir yang masih menahan uang COD.
                    </p>
                  </div>
                )}
                {!loading &&
                  debtors.map((d) => (
                    <div
                      key={d.name}
                      className="px-5 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {d.name}
                          {d.suspended && (
                            <span className="ml-2 text-[9px] font-bold text-white bg-gray-900 rounded-full px-1.5 py-0.5">
                              SUSPEND
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {d.count} pesanan
                          {d.overdue > 0 ? ` · ${d.overdue} terlambat` : ""}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold font-tabular shrink-0 ${d.overdue > 0 ? "text-red-600" : "text-gray-900"}`}
                      >
                        {formatRupiah(d.total)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h3 className="text-base font-bold text-gray-900">
                  Alur Setoran COD
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

      {/* Modal konfirmasi aksi */}
      {pending && modalContent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-black/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{modalContent.title}</h3>
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
              <p className="text-sm text-gray-700 leading-relaxed">
                {modalContent.desc}
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
                onClick={runAction}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60 ${modalContent.cls}`}
              >
                {processing ? "Memproses..." : modalContent.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}