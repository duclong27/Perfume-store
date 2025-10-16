
import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useSearchParams } from "react-router-dom";

// ===== helpers =====
const normalize = (s = "") =>
  s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function normalizeOrder(o) {
  return {
    orderId: o.orderId,
    orderNumber: o.orderNumber || `ORD-${String(o.orderId).padStart(6, "0")}`,
    orderStatus: o.orderStatus ?? o.status ?? "",
    paymentStatus: o.paymentStatus ?? "",
    paymentMethodCode: o.paymentMethodCode ?? "",
    totalVnd: Number.isFinite(+o.totalVnd) ? +o.totalVnd : 0,
    createdAt: o.createdAt ?? null,
    paidAt: o.paidAt ?? null,
    shippingName: o.shippingName ?? "",
    shippingPhone: o.shippingPhone ?? "",
    shippingAddress: o.shippingAddress ?? "",
    note: o.note ?? null,
  };
}

const canCancel = (o) =>
  ["pending", "confirmed"].includes(o.orderStatus) &&
  ["unpaid", "pending"].includes(o.paymentStatus);

const statusTone = (s) => {
  switch (s) {
    case "pending": return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "confirmed": return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    case "shipped": return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "completed": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "cancelled": return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default: return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  }
};

const payTone = (s) => {
  switch (s) {
    case "paid": return "bg-emerald-100 text-emerald-700";
    case "failed": return "bg-rose-100 text-rose-700";
    case "pending": return "bg-amber-100 text-amber-700";
    case "unpaid": return "bg-slate-100 text-slate-700";
    case "cancelled": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const methodTone = (m) => {
  switch (m) {
    case "COD": return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
    case "BANK_TRANSFER": return "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200";
    case "VNPAY": return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
    default: return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  }
};

// ===== tiny toast component =====
function Toast({ show, title = "Thành công", message = "", tone = "success", onClose }) {
  if (!show) return null;
  const toneClass =
    tone === "error"
      ? "bg-rose-600 ring-rose-700"
      : tone === "warn"
        ? "bg-amber-600 ring-amber-700"
        : "bg-emerald-600 ring-emerald-700";

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      <div className={`min-w-[260px] max-w-[90vw] text-white rounded-2xl shadow-xl ring-1 ${toneClass}`}>
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="text-xl">✅</div>
            <div className="flex-1">
              <div className="font-semibold">{title}</div>
              {message ? <div className="text-white/90 text-sm mt-0.5">{message}</div> : null}
            </div>
            <button
              onClick={onClose}
              className="ml-2 text-white/90 hover:text-white focus:outline-none"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== page =====
export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cancelingId, setCancelingId] = useState(null);

  // toast state
  const [toast, setToast] = useState({ show: false, title: "", message: "", tone: "success" });
  const openToast = (opts = {}) => {
    setToast({ show: true, title: "Thành công", message: "", tone: "success", ...opts });
    // auto-hide after 3s
    window.clearTimeout(openToast._t);
    openToast._t = window.setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };
  const closeToast = () => setToast((t) => ({ ...t, show: false }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const PAGE_SIZE = 200;
        let page = 1;
        let all = [];
        let total = Infinity;

        while (!cancelled && all.length < total) {
          const { data } = await api.get("/internal/v1/getMyOrders", {
            params: { page, limit: PAGE_SIZE },
          });
          const payload = data?.data ?? data ?? {};
          const rowsRaw = Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload)
              ? payload
              : [];
          const mapped = rowsRaw.map(normalizeOrder);

          all = all.concat(mapped);
          total = Number.isFinite(+payload?.total) ? +payload.total : all.length;

          if (!payload?.rows || mapped.length < PAGE_SIZE) break;
          page += 1;
        }

        if (!cancelled) setOrders(all);
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Không tải được danh sách đơn.";
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [searchParams] = useSearchParams();
  const q = searchParams.get("orders_q") || searchParams.get("q") || "";
  const nq = normalize(q);

  const filteredOrders = useMemo(() => {
    if (!nq) return orders;
    return orders.filter((o) => {
      const orderNum = normalize(o.orderNumber);
      const orderIdStr = String(o.orderId ?? "").toLowerCase();
      const shipName = normalize(o.shippingName);
      return orderNum.includes(nq) || orderIdStr.includes(nq) || shipName.includes(nq);
    });
  }, [orders, nq]);

  const onCancel = async (order) => {
    if (!canCancel(order) || cancelingId) return;
    const ok = window.confirm(`Huỷ đơn #${order.orderNumber}?`);
    if (!ok) return;

    setCancelingId(order.orderId);
    const prev = [...orders];

    // optimistic update
    setOrders((list) =>
      list.map((o) =>
        o.orderId === order.orderId ? { ...o, orderStatus: "cancelled", paymentStatus: "cancelled" } : o
      )
    );

    try {
      const { data } = await api.post(`/internal/v1/cancelMyOrder/${order.orderId}`, {
        reason: "Customer cancel from My Orders",
      });
      const resp = data?.data ?? data ?? {};

      // sync with server response
      setOrders((list) =>
        list.map((o) =>
          o.orderId === order.orderId
            ? {
              ...o,
              orderStatus: resp.orderStatus ?? "cancelled",
              paymentStatus: resp.paymentStatus ?? "cancelled",
            }
            : o
        )
      );

      // ✅ show toast success
      openToast({
        title: "Huỷ đơn thành công",
        message: `Đơn #${order.orderNumber} đã được huỷ.`,
        tone: "success",
      });
    } catch (e) {
      // rollback
      setOrders(prev);
      const msg = e?.response?.data?.message || e.message || "Huỷ đơn thất bại.";
      // show error toast thay vì alert, nếu bạn thích có thể giữ alert
      openToast({ title: "Huỷ đơn thất bại", message: msg, tone: "error" });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-600 text-white shadow-lg mb-6">
          <svg className="absolute -top-10 -right-10 h-64 w-64 opacity-25" viewBox="0 0 200 200" aria-hidden>
            <defs>
              <pattern id="orders-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#orders-dots)" />
          </svg>
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-6 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                  <span>🧾</span><span>Đơn hàng của tôi</span>
                </div>
                <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">My Orders</h1>
                <p className="mt-2 text-white/90 md:text-lg">
                  Hiển thị toàn bộ đơn hàng của bạn — theo dõi trạng thái và huỷ đơn khi cần.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white shadow-sm border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : err ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-rose-700">{err}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold">Không tìm thấy đơn phù hợp</div>
            <div className="text-slate-500 text-sm">Sửa từ khoá trên thanh tìm kiếm.</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((o) => (
              <div key={o.orderId} className="group rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500/70 via-fuchsia-500/70 to-cyan-500/70" />
                <div className="p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-3xl font-bold tracking-wide">#ORD-000{o.orderNumber}</div>
                      <span className={`px-3 py-1 rounded-full text-xl  ${methodTone(o.paymentMethodCode)}`}>{o.paymentMethodCode}</span>
                      <span className={`px-3 py-1 rounded-full text-xl  ${statusTone(o.orderStatus)}`}>{o.orderStatus}</span>
                      <span className={`px-3 py-1 rounded-full text-xl  ${payTone(o.paymentStatus)}`}>{o.paymentStatus}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold">{o.totalVnd.toLocaleString("vi-VN")} ₫</div>
                      <div className="text-sm  text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : ""}</div>
                    </div>
                  </div>

                  {(o.shippingName || o.shippingPhone || o.shippingAddress) && (
                    <div className="mt-3 grid md:grid-cols-2 gap-2 text-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">👤</span>
                        <span className="font-medium">{o.shippingName || "—"}</span>
                        {o.shippingPhone && <span className="text-slate-500">• {o.shippingPhone}</span>}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-400 mt-[2px]">📦</span>
                        <span className="text-slate-600 line-clamp-2">{o.shippingAddress || "—"}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xl font-semibold">
                      In hoá đơn
                    </button>
                    <button
                      disabled={!canCancel(o) || cancelingId === o.orderId}
                      onClick={() => onCancel(o)}
                      className={`px-4 py-2 rounded-xl text-xl font-semibold transition ${canCancel(o) && cancelingId !== o.orderId
                          ? "bg-rose-600 text-white hover:brightness-110"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                    >
                      {cancelingId === o.orderId ? "Đang huỷ..." : "Huỷ đơn"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast show={toast.show} title={toast.title} message={toast.message} tone={toast.tone} onClose={closeToast} />
    </div>
  );
}
