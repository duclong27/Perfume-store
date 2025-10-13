
// features/address/containers/AddressPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AddressCard from "../../components/AddressCard";
import { api } from "../../api.js";
import { toast } from "react-toastify";

// Chuẩn hoá address
const normalizeAddress = (a) => {
  const addressId = a?.addressId ?? a?.id ?? a?._id;
  return {
    addressId,
    recipientName: a?.recipientName ?? a?.name ?? "",
    phoneNumber: a?.phoneNumber ?? a?.phone ?? "",
    addressLine: a?.addressLine ?? a?.line ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    postalCode: a?.postalCode ?? a?.zip ?? "",
    country: a?.country ?? "VN",
    isDefault: !!a?.isDefault,
  };
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null); // id đang gọi setDefault
  const [deletingId, setDeletingId] = useState(null); // delete busy




  // ===== Fetch DB =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await api.get("/internal/v1/getAddresses"); // ⬅️ đổi đúng endpoint BE của bạn
        const raw = data?.items ?? data?.data ?? data ?? [];
        const normalized = Array.isArray(raw) ? raw.map(normalizeAddress) : [];
        if (!cancelled) setAddresses(normalized);
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Fetch failed";
          setErr(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== Set default =====
  async function handleSetDefault(addressId) {
    if (!addressId) return;
    setBusyId(addressId);

    try {

      await toast.promise(
        api.patch(`/internal/v1/setDefault/${addressId}`),
        {
          pending: "Đang đặt địa chỉ mặc định…",
          success: "Đã đặt địa chỉ mặc định ✅",
          error: {
            render({ data: err }) {
              return err?.response?.data?.message || err?.message || "Không thể đặt mặc định";
            },
          },
        },
        { position: "top-right", theme: "colored" }
      );



     


      // Cập nhật local state: chỉ 1 địa chỉ mặc định
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.addressId === addressId }))
      );
    } finally {
      setBusyId(null);
    }
  }


   // ✅ Xoá địa chỉ
      async function handleDelete(addressId) {
        if (!addressId) return;
        setDeletingId(addressId);
        try {
          await toast.promise(
            api.delete(`/internal/v1/deleteAddress/${addressId}`),
            {
              pending: "Đang xoá địa chỉ…",
              success: "Xoá địa chỉ thành công ✅",
              error: { render: ({ data: err }) => err?.response?.data?.message || err?.message || "Xoá địa chỉ thất bại" },
            },
            { position: "top-right", theme: "colored" }
          );
          // ⬇️ Quan trọng: BE tự chọn default mới → FE refetch để đồng bộ isDefault
          await fetchAll();
        } finally {
          setDeletingId(null);
        }
      }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Hero tiêu đề minh hoạ */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-600 text-white shadow-lg">
        <svg className="absolute -top-10 -right-10 h-64 w-64 opacity-25" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#dots)" />
        </svg>
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative p-6 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                <span>📦</span><span>Sổ địa chỉ</span>
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">
                Quản lý địa chỉ nhận hàng
              </h1>
              <p className="mt-2 text-white/90 md:text-lg">
                Lưu, chỉnh sửa và đặt địa chỉ mặc định để thanh toán nhanh hơn.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <div className="text-3xl font-bold">{addresses.length}</div>
                <div className="text-white/80 text-sm">Tổng địa chỉ</div>
              </div>
              <div className="h-10 w-px bg-white/25" />
              <Link
                to="/addAddressPage" // ⬅️ đồng bộ 1 route add duy nhất
                className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 font-semibold text-indigo-700 hover:bg-white transition"
                title="Thêm địa chỉ mới"
              >
                ➕ Thêm địa chỉ
              </Link>
            </div>
          </div>

          {/* CTA mobile */}
          <div className="mt-6 md:hidden">
            <Link
              to="/addAddressPage"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/90 px-5 py-3 font-semibold text-indigo-700 hover:bg-white transition"
              title="Thêm địa chỉ mới"
            >
              ➕ Thêm địa chỉ
            </Link>
          </div>
        </div>
      </section>

      {/* Error/Loading/List */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Đang tải địa chỉ…
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {err}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Chưa có địa chỉ nào.
        </div>
      ) : (
        <div className="grid gap-5">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.addressId}
              addr={addr}
              onSetDefault={handleSetDefault}   // ✅ chỉ làm set default
              busyId={busyId}
            onDelete={handleDelete}    
            deletingId={deletingId}          
            />
          ))}
        </div>
      )}
    </div>
  );
}
