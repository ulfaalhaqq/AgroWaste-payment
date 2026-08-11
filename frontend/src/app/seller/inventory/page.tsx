"use client";

import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import { apiFetch, getProductImageUrl } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductMedia {
  id: string;
  original_url?: string;
  url?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  stock_kg: string;
  min_order_kg: string;
  jenis_ternak: string;
  kondisi: string | null;
  status: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  image_url?: string | null;
  image_urls?: string[];
  media?: ProductMedia[];
  category?: { id: string; name: string };
  nutrisi?: [string, string][] | null;
  peternak_profile?: { user_id: string; nama_peternakan: string };
}

type FormMode = "add" | "edit";

interface ProductForm {
  name: string;
  category_id: string;
  jenis_ternak: string;
  kondisi: string;
  price: string;
  stock_kg: string;
  min_order_kg: string;
  description: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  nutrisi_n: string;
  nutrisi_p: string;
  nutrisi_k: string;
  nutrisi_c: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  category_id: "",
  jenis_ternak: "sapi",
  kondisi: "",
  price: "",
  stock_kg: "",
  min_order_kg: "1",
  description: "",
  provinsi: "",
  kabupaten: "",
  kecamatan: "",
  nutrisi_n: "",
  nutrisi_p: "",
  nutrisi_k: "",
  nutrisi_c: "",
};

const JENIS_OPTIONS = ["sapi", "kambing", "ayam"];

function formatRupiah(n: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

function statusInfo(s: string) {
  switch (s) {
    case "aktif":
      return {
        label: "AKTIF",
        color: "text-seller-semgreen",
        dot: "bg-seller-semgreen",
      };
    case "pending":
    case "menunggu_review":
      return {
        label: "MENUNGGU",
        color: "text-amber-600",
        dot: "bg-amber-500",
      };
    case "ditolak":
      return {
        label: "DITOLAK",
        color: "text-seller-semred",
        dot: "bg-seller-semred",
      };
    default:
      return {
        label: s.toUpperCase(),
        color: "text-seller-textsecondary",
        dot: "bg-seller-textsecondary",
      };
  }
}

interface SellerOrder {
  id: string;
  status: string;
  product_id?: string;
  product?: { id: string; name: string };
  quantity_kg?: string | number;
  berat_kg?: string | number;
  items?: Array<{
    product_id?: string;
    quantity_kg?: string | number;
    product?: { id: string; name: string };
  }>;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("Menyimpan...");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [editProductMedia, setEditProductMedia] = useState<ProductMedia[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState<string>("50");
  const [restocking, setRestocking] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  const myId = getUser()?.id;

  const handleOpenRestock = (product: Product) => {
    setRestockProduct(product);
    setAddQty("50");
    setRestockError(null);
  };

  const handleSaveRestock = async () => {
    if (!restockProduct) return;
    const added = Number(addQty);
    if (isNaN(added) || added <= 0) {
      setRestockError("Masukkan jumlah stok yang valid (lebih dari 0).");
      return;
    }

    setRestocking(true);
    setRestockError(null);

    try {
      const currentStock = Number(restockProduct.stock_kg || 0);
      const newStock = currentStock + added;

      const res = await apiFetch(`/products/${restockProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({ stock_kg: String(newStock) }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === restockProduct.id
              ? { ...p, stock_kg: String(newStock) }
              : p,
          ),
        );
        setRestockProduct(null);
      } else {
        setRestockError(json.message ?? "Gagal menambah stok.");
      }
    } catch {
      setRestockError("Terjadi kesalahan jaringan.");
    } finally {
      setRestocking(false);
    }
  };

  const fetchProducts = () => {
    apiFetch("/seller/products")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const all: Product[] = json.data ?? [];
        setProducts(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // fetch categories, products, and orders in parallel
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      apiFetch("/seller/products")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] })),
      apiFetch("/orders")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] })),
    ]).then(([catRes, prodRes, ordRes]) => {
      setCategories(catRes.data ?? []);
      setProducts(prodRes.data ?? []);
      setOrders(ordRes.data ?? []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEffectiveStock = (p: Product) => {
    const baseStock = Number(p.stock_kg || 0);
    // Deduct quantity of confirmed, shipped, or completed orders
    const confirmedOrders = orders.filter((o) =>
      ["dikonfirmasi", "dikirim", "selesai"].includes(o.status),
    );
    let orderedQty = 0;

    confirmedOrders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (item.product?.id === p.id || item.product_id === p.id) {
            orderedQty += Number(item.quantity_kg || 0);
          }
        });
      } else if (o.product?.id === p.id || o.product_id === p.id) {
        orderedQty += Number(o.quantity_kg || o.berat_kg || 0);
      }
    });

    return Math.max(0, baseStock - orderedQty);
  };

  const visible = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const totalStock = useMemo(
    () => products.reduce((a, p) => a + getEffectiveStock(p), 0),
    [products, orders],
  );

  const totalValue = useMemo(
    () =>
      products.reduce((a, p) => a + Number(p.price) * getEffectiveStock(p), 0),
    [products, orders],
  );

  const clearImages = () => {
    setImagePreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return [];
    });
    setImages([]);
    setFileError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files ?? []);
    const combined = [...images, ...files];
    const existingCount = formMode === "edit" ? editProductMedia.length : 0;

    if (existingCount + combined.length > 3) {
      setFileError("Maksimal 3 gambar per produk.");
      e.target.value = "";
      return;
    }
    for (const f of files) {
      if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
        setFileError("Hanya format JPG/JPEG/PNG yang diizinkan.");
        e.target.value = "";
        return;
      }
      if (f.size > 2 * 1024 * 1024) {
        setFileError(`File "${f.name}" melebihi batas 2MB.`);
        e.target.value = "";
        return;
      }
    }
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImages(combined);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const openAdd = () => {
    setFormMode("add");
    setForm(EMPTY_FORM);
    setEditId(null);
    setEditProductMedia([]);
    setFormError(null);
    setFormSuccess(null);
    clearImages();
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setFormMode("edit");
    const nutrisiMap: Record<string, string> = {};
    if (p.nutrisi && Array.isArray(p.nutrisi)) {
      p.nutrisi.forEach(([val, label]) => {
        if (label.includes("Nitrogen")) nutrisiMap.n = val;
        if (label.includes("Fosfor")) nutrisiMap.p = val;
        if (label.includes("Kalium")) nutrisiMap.k = val;
        if (label.includes("C-Organik")) nutrisiMap.c = val;
      });
    }
    setForm({
      name: p.name,
      category_id: p.category?.id ?? "",
      jenis_ternak: p.jenis_ternak,
      kondisi: p.kondisi ?? "",
      price: p.price,
      stock_kg: p.stock_kg,
      min_order_kg: p.min_order_kg,
      description: p.description ?? "",
      provinsi: p.provinsi,
      kabupaten: p.kabupaten,
      kecamatan: p.kecamatan,
      nutrisi_n: nutrisiMap.n ?? "",
      nutrisi_p: nutrisiMap.p ?? "",
      nutrisi_k: nutrisiMap.k ?? "",
      nutrisi_c: nutrisiMap.c ?? "",
    });
    setEditId(p.id);
    setEditProductMedia(p.media ?? []);
    setFormError(null);
    setFormSuccess(null);
    clearImages();
    setModalOpen(true);
  };

  const handleDeleteImage = async (mediaId: string) => {
    if (!editId) return;
    if (!confirm("Hapus gambar ini? Tindakan ini tidak bisa dibatalkan."))
      return;
    setDeletingImageId(mediaId);
    setFormError(null);
    try {
      const res = await apiFetch(`/products/${editId}/images/${mediaId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const updatedMedia = editProductMedia.filter((m) => m.id !== mediaId);
        setEditProductMedia(updatedMedia);
        setProducts((prev) =>
          prev.map((p) =>
            p.id !== editId
              ? p
              : {
                  ...p,
                  media: updatedMedia,
                  image_url:
                    updatedMedia.length > 0
                      ? updatedMedia[0].original_url ||
                        updatedMedia[0].url ||
                        null
                      : null,
                  image_urls: updatedMedia
                    .map((m) => m.original_url || m.url || "")
                    .filter(Boolean),
                },
          ),
        );
      } else {
        setFormError(json.message ?? "Gagal menghapus gambar.");
      }
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.name || !form.category_id || !form.price || !form.stock_kg) {
      setFormError("Nama, kategori, harga, dan stok wajib diisi.");
      return;
    }
    setSubmitting(true);
    setSubmitLabel(formMode === "add" ? "Membuat produk..." : "Menyimpan...");
    try {
      const nutrisiArr: [string, string][] = [];
      if (form.nutrisi_n) nutrisiArr.push([form.nutrisi_n, "Nitrogen (N)"]);
      if (form.nutrisi_p) nutrisiArr.push([form.nutrisi_p, "Fosfor (P)"]);
      if (form.nutrisi_k) nutrisiArr.push([form.nutrisi_k, "Kalium (K)"]);
      if (form.nutrisi_c) nutrisiArr.push([form.nutrisi_c, "C-Organik"]);

      const body: Record<string, unknown> = {
        name: form.name,
        category_id: form.category_id,
        jenis_ternak: form.jenis_ternak,
        kondisi: form.kondisi || null,
        price: Number(form.price),
        stock_kg: Number(form.stock_kg),
        min_order_kg: Number(form.min_order_kg) || 1,
        description: form.description || null,
        provinsi: form.provinsi || null,
        kabupaten: form.kabupaten || null,
        kecamatan: form.kecamatan || null,
      };

      if (nutrisiArr.length > 0) {
        body.nutrisi = nutrisiArr;
      }
      const res =
        formMode === "add"
          ? await apiFetch("/products", {
              method: "POST",
              body: JSON.stringify(body),
            })
          : await apiFetch(`/products/${editId}`, {
              method: "PUT",
              body: JSON.stringify(body),
            });
      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg =
          json.message ??
          (json.errors
            ? Object.values(json.errors).flat().join(" ")
            : "Gagal menyimpan produk.");
        setFormError(String(msg));
        return;
      }

      // upload any newly selected images
      if (images.length > 0) {
        setSubmitLabel("Mengunggah gambar...");
        const productId = formMode === "add" ? json.data.id : editId;
        try {
          const fd = new FormData();
          images.forEach((f) => fd.append("images[]", f));
          const imgRes = await apiFetch(`/products/${productId}/images`, {
            method: "POST",
            body: fd,
          });
          const imgJson = await imgRes.json();
          if (!imgRes.ok || !imgJson.success) {
            setFormSuccess(
              formMode === "add"
                ? "Produk berhasil dibuat, tapi gambar gagal diunggah."
                : "Produk berhasil diperbarui, tapi gambar gagal diunggah.",
            );
          } else {
            const updatedProduct = imgJson.data;
            setProducts((prev) =>
              prev.map((p) =>
                p.id === productId ? { ...p, ...updatedProduct } : p,
              ),
            );
            setFormSuccess(
              formMode === "add"
                ? "Produk dan gambar berhasil disimpan! Menunggu persetujuan admin."
                : "Produk dan gambar berhasil diperbarui.",
            );
          }
        } catch {
          setFormSuccess("Gagal mengunggah gambar produk.");
        }
      } else {
        setFormSuccess(
          formMode === "add"
            ? "Produk berhasil ditambahkan! Menunggu persetujuan admin."
            : "Produk berhasil diperbarui.",
        );
      }

      if (formMode === "add") {
        const cat = categories.find((c) => c.id === form.category_id);
        const newProduct: Product = {
          ...json.data,
          category: cat ? { id: cat.id, name: cat.name } : undefined,
          peternak_profile: { user_id: myId ?? "", nama_peternakan: "" },
        };
        if (images.length === 0) {
          setProducts((prev) => [newProduct, ...prev]);
        }
      } else {
        const cat = categories.find((c) => c.id === form.category_id);
        if (images.length === 0) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id !== editId
                ? p
                : {
                    ...p,
                    name: form.name,
                    category_id: form.category_id,
                    category: cat ? { id: cat.id, name: cat.name } : p.category,
                    jenis_ternak: form.jenis_ternak,
                    kondisi: form.kondisi || null,
                    price: form.price,
                    stock_kg: form.stock_kg,
                    min_order_kg: form.min_order_kg,
                    description: form.description || null,
                  },
            ),
          );
        }
      }
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess(null);
        clearImages();
      }, 2500);
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini? Tindakan ini tidak bisa dibatalkan."))
      return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  };

  const field = (
    key: keyof ProductForm,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <div>
      <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
      />
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-seller-textprimary mb-1">
            Manajemen Inventaris
          </h2>
          <p className="text-sm text-seller-textsecondary">
            Kelola ketersediaan limbah organik peternakan Anda.
          </p>
        </div>

        {/* Stats KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-seller-surfacewhite border border-seller-hairline p-5 rounded-2xl">
            <div className="text-seller-primary mb-4">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-seller-textsecondary block mb-1">
              Total Produk
            </span>
            <h3 className="text-xl font-bold text-seller-textprimary font-tabular">
              {loading ? "..." : `${products.length} Produk`}
            </h3>
          </div>

          <div className="bg-seller-surfacewhite border border-seller-hairline p-5 rounded-2xl">
            <div className="text-amber-600 mb-4">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-seller-textsecondary block mb-1">
              Stok Tersedia
            </span>
            <h3 className="text-xl font-bold text-seller-textprimary font-tabular">
              {loading ? "..." : `${totalStock.toLocaleString("id-ID")} kg`}
            </h3>
          </div>

          <div className="bg-seller-surfacewhite border border-seller-hairline p-5 rounded-2xl">
            <div className="text-blue-600 mb-4">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-seller-textsecondary block mb-1">
              Nilai Inventaris
            </span>
            <h3 className="text-xl font-bold text-seller-textprimary font-tabular">
              {loading ? "..." : formatRupiah(totalValue)}
            </h3>
          </div>

          <div className="bg-seller-primary p-5 rounded-2xl text-white shadow-lg shadow-seller-primary/20">
            <div className="text-white mb-4">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-white/90 block mb-1">
              Produk Aktif
            </span>
            <h3 className="text-xl font-bold text-white font-tabular">
              {loading
                ? "..."
                : `${products.filter((p) => p.status === "aktif").length} Aktif`}
            </h3>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-seller-surfacewhite border border-seller-hairline rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-seller-hairline flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-seller-textsecondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk..."
                className="w-full pl-9 pr-4 py-2 border border-seller-hairline rounded-xl bg-[#F9F8F6] text-xs focus:outline-none focus:ring-1 focus:ring-seller-primary"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-seller-primary hover:bg-seller-primary-hover text-white rounded-xl text-xs font-bold transition-colors w-full md:w-auto justify-center"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah Produk
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F9F8F6] text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider border-b border-seller-hairline">
                <tr>
                  <th className="px-6 py-4">Detail Produk</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Stok</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-seller-hairline bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-seller-textsecondary text-xs animate-pulse"
                    >
                      Memuat produk...
                    </td>
                  </tr>
                )}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-seller-textsecondary text-xs"
                    >
                      {search
                        ? "Tidak ada produk yang cocok."
                        : 'Belum ada produk. Klik "Tambah Produk" untuk mulai.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  visible.map((p) => {
                    const { label, color, dot } = statusInfo(p.status);
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-seller-warmbg/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded overflow-hidden bg-[#EAE6E1] flex items-center justify-center shrink-0 relative">
                              {p.image_url && (
                                <img
                                  src={getProductImageUrl(p.image_url)}
                                  alt={p.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              )}
                              <span className="text-[10px] font-bold text-seller-textsecondary">
                                IMG
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-seller-textprimary text-sm">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-seller-textsecondary mt-0.5 uppercase tracking-wider">
                                {p.jenis_ternak}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-[#EAE6E1] text-seller-textsecondary text-[10px] font-bold tracking-wider">
                            {(p.category?.name ?? "—")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider ${color}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${dot}`}
                            />
                            {label}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-seller-textprimary">
                          {getEffectiveStock(p).toLocaleString("id-ID")}{" "}
                          <span className="text-[10px] text-seller-textsecondary font-normal">
                            kg
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-seller-semgreen">
                            {formatRupiah(p.price)}
                          </div>
                          <div className="text-[10px] text-seller-textsecondary">
                            / {p.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenRestock(p)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-seller-semgreen border border-emerald-200/80 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                              title="Tambah Stok Produk Ini"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              <span>Stok</span>
                            </button>
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 text-seller-textsecondary hover:text-seller-primary hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Produk"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting === p.id}
                              className="p-1.5 text-seller-textsecondary hover:text-seller-semred hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Hapus Produk"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-seller-hairline flex items-center justify-between text-xs text-seller-textsecondary">
            <span>
              Menampilkan {visible.length} dari {products.length} produk
            </span>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Produk */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-seller-surfacewhite w-full max-w-lg rounded-2xl border border-seller-hairline overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-seller-hairline flex justify-between items-center shrink-0">
              <h3 className="font-bold text-seller-textprimary">
                {formMode === "add" ? "Tambah Produk Baru" : "Edit Produk"}
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  clearImages();
                }}
                className="text-seller-textsecondary hover:text-seller-textprimary"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="px-4 py-3 bg-seller-primary-light border border-seller-primary/20 rounded-lg text-xs text-seller-primary font-semibold">
                  {formSuccess}
                </div>
              )}

              {field(
                "name",
                "Nama Produk *",
                "text",
                "Mis: Pupuk Kandang Sapi (Kering)",
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                    Kategori *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category_id: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Ternak */}
                <div>
                  <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                    Jenis Ternak *
                  </label>
                  <select
                    value={form.jenis_ternak}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, jenis_ternak: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary"
                  >
                    {JENIS_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j.charAt(0).toUpperCase() + j.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {field("price", "Harga (Rp/kg) *", "number", "2000")}
                {field("stock_kg", "Stok Awal (kg) *", "number", "100")}
                {field("min_order_kg", "Min. Order (kg) *", "number", "1")}
              </div>

              {field(
                "kondisi",
                "Kondisi (opsional)",
                "text",
                "Mis: Kering, Fermentasi 30 hari",
              )}

              {/* Kandungan Nutrisi (Opsional Uji Lab) */}
              <div className="pt-2 border-t border-seller-hairline">
                <p className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider mb-2">
                  Kandungan Nutrisi / Uji Lab{" "}
                  <span className="font-normal normal-case text-seller-textsecondary/80">
                    (opsional)
                  </span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-seller-textsecondary mb-1">
                      Nitrogen (N)
                    </label>
                    <input
                      type="text"
                      placeholder="Mis: 1.5%"
                      value={form.nutrisi_n}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nutrisi_n: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-seller-warmbg border border-seller-hairline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-seller-textsecondary mb-1">
                      Fosfor (P)
                    </label>
                    <input
                      type="text"
                      placeholder="Mis: 0.8%"
                      value={form.nutrisi_p}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nutrisi_p: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-seller-warmbg border border-seller-hairline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-seller-textsecondary mb-1">
                      Kalium (K)
                    </label>
                    <input
                      type="text"
                      placeholder="Mis: 1.2%"
                      value={form.nutrisi_k}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nutrisi_k: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-seller-warmbg border border-seller-hairline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-seller-textsecondary mb-1">
                      C-Organik
                    </label>
                    <input
                      type="text"
                      placeholder="Mis: 25%"
                      value={form.nutrisi_c}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nutrisi_c: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-seller-warmbg border border-seller-hairline rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-seller-textsecondary mb-1">
                  Deskripsi (opsional)
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Jelaskan produk Anda..."
                  className="w-full px-3 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-seller-primary resize-none"
                />
              </div>

              <div className="pt-2 border-t border-seller-hairline">
                <p className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider mb-3">
                  Lokasi Produk
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {field("provinsi", "Provinsi", "text", "Jawa Timur")}
                  {field("kabupaten", "Kabupaten", "text", "Malang")}
                  {field("kecamatan", "Kecamatan", "text", "Lowokwaru")}
                </div>
              </div>

              {/* Gambar Produk */}
              <div className="pt-2 border-t border-seller-hairline">
                <p className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider mb-3">
                  Gambar Produk{" "}
                  <span className="font-normal normal-case">
                    (maks. 3 foto · 2MB/file · JPG/PNG)
                  </span>
                </p>

                {/* Gambar Saat Ini (Mode Edit) */}
                {formMode === "edit" && editProductMedia.length > 0 && (
                  <div className="mb-4">
                    <span className="block text-xs font-semibold text-seller-textsecondary mb-2">
                      Gambar Saat Ini ({editProductMedia.length}):
                    </span>
                    <div className="flex gap-3 flex-wrap">
                      {editProductMedia.map((m) => (
                        <div key={m.id} className="relative w-20 h-20 shrink-0">
                          <img
                            src={getProductImageUrl(m.original_url || m.url)}
                            alt="Media produk"
                            className="w-full h-full object-cover rounded-lg border border-seller-hairline"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(m.id)}
                            disabled={deletingImageId === m.id}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold leading-none transition-colors disabled:opacity-50"
                          >
                            {deletingImageId === m.id ? "..." : "×"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Gambar Baru */}
                {(formMode === "add" ||
                  editProductMedia.length + images.length < 3) && (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    <div className="border-2 border-dashed border-seller-hairline rounded-xl px-4 py-5 flex flex-col items-center gap-2 hover:border-seller-primary transition-colors">
                      <svg
                        className="w-6 h-6 text-seller-textsecondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs text-seller-textsecondary text-center leading-relaxed">
                        Klik untuk pilih gambar baru
                        <span className="block text-[10px] text-seller-textsecondary/70">
                          {3 -
                            (formMode === "edit"
                              ? editProductMedia.length
                              : 0) -
                            images.length}{" "}
                          slot tersisa
                        </span>
                      </span>
                    </div>
                  </label>
                )}

                {/* Previews Gambar Baru */}
                {imagePreviews.length > 0 && (
                  <div className="mt-3">
                    {formMode === "edit" && (
                      <span className="block text-xs font-semibold text-seller-textsecondary mb-2">
                        Gambar Baru yang Dipilih:
                      </span>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      {imagePreviews.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 shrink-0">
                          <img
                            src={url}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-seller-hairline"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            disabled={submitting}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold leading-none transition-colors disabled:opacity-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fileError && (
                  <p className="text-xs text-red-600 font-semibold mt-2">
                    {fileError}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-seller-hairline flex justify-end gap-3 bg-[#F9F8F6] shrink-0">
              <button
                onClick={() => {
                  setModalOpen(false);
                  clearImages();
                }}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-seller-textsecondary hover:text-seller-textprimary transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-seller-primary hover:bg-seller-primary-hover text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {submitting
                  ? submitLabel
                  : formMode === "add"
                    ? "Simpan Produk"
                    : "Perbarui Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Restock (Tambah Stok) */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-seller-surfacewhite w-full max-w-md rounded-2xl border border-seller-hairline overflow-hidden animate-fade-in shadow-2xl">
            <div className="p-5 border-b border-seller-hairline flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-seller-semgreen flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-seller-textprimary text-base">
                    Tambah Stok Produk
                  </h3>
                  <p className="text-xs text-seller-textsecondary">
                    {restockProduct.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-seller-textsecondary hover:text-seller-textprimary p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {restockError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {restockError}
                </div>
              )}

              <div className="bg-seller-warmbg p-4 rounded-xl border border-seller-hairline flex justify-between items-center">
                <span className="text-xs font-bold text-seller-textsecondary">
                  Stok Tersedia Saat Ini
                </span>
                <span className="text-base font-extrabold text-seller-textprimary font-tabular">
                  {getEffectiveStock(restockProduct).toLocaleString("id-ID")} kg
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-seller-textprimary mb-2">
                  Jumlah Tambahan Stok (kg)
                </label>
                <input
                  type="number"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  placeholder="Misal: 50"
                  className="w-full px-4 py-2.5 bg-white border border-seller-hairline rounded-xl text-sm font-bold text-seller-textprimary focus:outline-none focus:ring-2 focus:ring-seller-primary"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider mb-2">
                  Pilihan Cepat
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddQty(String(preset))}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        addQty === String(preset)
                          ? "bg-seller-primary text-white border-seller-primary shadow-sm"
                          : "bg-white text-seller-textsecondary border-seller-hairline hover:bg-gray-50"
                      }`}
                    >
                      +{preset} kg
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center justify-between text-xs font-bold text-seller-semgreen">
                <span>Stok Baru Setelah Ditambah:</span>
                <span className="text-sm font-extrabold">
                  {(
                    getEffectiveStock(restockProduct) + (Number(addQty) || 0)
                  ).toLocaleString("id-ID")}{" "}
                  kg
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-seller-hairline bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => setRestockProduct(null)}
                disabled={restocking}
                className="px-4 py-2 text-xs font-bold text-seller-textsecondary hover:text-seller-textprimary"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRestock}
                disabled={restocking}
                className="px-5 py-2.5 bg-seller-primary hover:bg-seller-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-seller-primary/20 transition-all flex items-center gap-2"
              >
                {restocking ? "Menyimpan..." : "Tambah Stok Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
