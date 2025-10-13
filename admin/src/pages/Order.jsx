
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../App";
import { toast } from "react-toastify";

/* --------------------------------------------------------------------------
   Helpers (Atoms) — responsive / fluid
-------------------------------------------------------------------------- */
const Label = ({ htmlFor, children, className = "" }) => (
    <label
        htmlFor={htmlFor}
        className={
            "mb-2 block font-medium text-white " +
            "text-[clamp(14px,1.6vw,18px)] " +
            className
        }
    >
        {children}
    </label>
);

const Input = ({ className = "", ...props }) => (
    <input
        className={
            "w-full rounded-2xl border border-white/20 bg-white/10 text-white outline-none focus:border-indigo-300 " +
            "h-[clamp(40px,6.2vw,56px)] px-[clamp(12px,2vw,20px)] " +
            "text-[clamp(14px,1.8vw,20px)] placeholder-white/50 " +
            className
        }
        {...props}
    />
);

const Select = ({ className = "", children, ...props }) => (
    <select
        className={
            "w-full rounded-2xl border border-white/20 bg-indigo-900/60 text-white outline-none focus:border-indigo-300 " +
            "h-[clamp(40px,6.2vw,56px)] px-[clamp(12px,2vw,20px)] " +
            "text-[clamp(14px,1.8vw,20px)] " +
            className
        }
        {...props}
    >
        {children}
    </select>
);

const Button = ({ children, className = "", ...props }) => (
    <button
        className={
            "inline-flex items-center justify-center rounded-2xl text-white transition focus:outline-none focus:ring-2 " +
            "px-[clamp(14px,2.2vw,24px)] py-[clamp(8px,1.8vw,14px)] " +
            "text-[clamp(14px,1.8vw,20px)] " +
            className
        }
        {...props}
    >
        {children}
    </button>
);

/* --------------------------------------------------------------------------
   Tone helpers
-------------------------------------------------------------------------- */
const methodTone = (m) => {
    switch (m) {
        case "COD": return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
        case "BANK_TRANSFER": return "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200";
        case "VNPAY": return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
        default: return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
    }
};
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

/* --------------------------------------------------------------------------
   Rule helpers (FE phải bám sát BE)
-------------------------------------------------------------------------- */
const FULFILL_FLOW = ["pending", "confirmed", "shipped", "completed"];

const normalize = (s = "") =>
    s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const normalizeOrder = (o) => ({
    orderId: o.orderId,
    orderNumber: o.orderNumber || `ORD-${String(o.orderId).padStart(6, "0")}`,
    userId: o.userId,
    addressId: o.addressId,
    orderStatus: o.orderStatus ?? o.status ?? "",
    paymentStatus: o.paymentStatus ?? "",
    paymentMethodCode: o.paymentMethodCode ?? "",
    totalVnd: Number.isFinite(+o.totalVnd) ? +o.totalVnd : Number(o.totalAmount || 0),
    createdAt: o.createdAt ?? null,
    paidAt: o.paidAt ?? null,
    shippingName: o.shippingName ?? "",
    shippingPhone: o.shippingPhone ?? "",
    shippingAddress: o.shippingAddress ?? "",
    shippingCity: o.shippingCity ?? "",
    shippingState: o.shippingState ?? "",
    shippingPostal: o.shippingPostal ?? "",
    shippingCountry: o.shippingCountry ?? "",
});

function canNext(cur, nxt) {
    return FULFILL_FLOW.indexOf(nxt) === FULFILL_FLOW.indexOf(cur) + 1;
}
function canCancel(cur) {
    return cur === "pending" || cur === "confirmed";
}
function canComplete(cur, pay) {
    return cur === "shipped" && pay === "paid";
}
function allowedFulfillmentTargets(cur, pay) {
    const targets = [];
    if (canNext(cur, "confirmed")) targets.push("confirmed");
    if (canNext(cur, "shipped")) targets.push("shipped");
    if (canComplete(cur, pay)) targets.push("completed");
    if (canCancel(cur)) targets.push("cancelled");
    return targets;
}
function allowedPaymentTargets(cur, method) {
    const res = new Set();
    if (cur === "unpaid") { res.add("pending"); res.add("failed"); }
    if (cur === "pending") { res.add("paid"); res.add("failed"); }
    if (cur !== "paid") { res.add("failed"); }
    if (method === "VNPAY") { res.delete("paid"); } // VNPAY cấm paid tay
    return Array.from(res);
}
function isLegacyPaidStatus(s) {
    return String(s || "").toLowerCase() === "paid"; // fulfillment legacy—không render trong dropdown
}

/* --------------------------------------------------------------------------
   AdminOrdersAll — One-page list (no pagination)
-------------------------------------------------------------------------- */
export default function AdminOrdersAll() {
    const [searchParams, setSearchParams] = useSearchParams();

    // state
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [orders, setOrders] = useState([]);

    // per-row draft edits { [orderId]: { orderStatus?, paymentStatus? } }
    const [edits, setEdits] = useState({});
    // per-row pending API
    const [pending, setPending] = useState({}); // { [orderId]: true/false }
    const isRowPending = (id) => !!pending[id];

    // filters (URL-sync q, sortBy, sortDir)
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [orderStatus, setOrderStatus] = useState(searchParams.get("status") || "");
    const [paymentStatus, setPaymentStatus] = useState(searchParams.get("pstatus") || "");
    const [paymentMethod, setPaymentMethod] = useState(searchParams.get("pm") || "");
    const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
    const [sortDir, setSortDir] = useState(searchParams.get("sortDir") || "desc");

    // sync URL
    useEffect(() => {
        const sp = new URLSearchParams();
        if (q) sp.set("q", q);
        if (orderStatus) sp.set("status", orderStatus);
        if (paymentStatus) sp.set("pstatus", paymentStatus);
        if (paymentMethod) sp.set("pm", paymentMethod);
        if (sortBy && sortBy !== "createdAt") sp.set("sortBy", sortBy);
        if (sortDir && sortDir !== "desc") sp.set("sortDir", sortDir);
        setSearchParams(sp, { replace: true });
    }, [q, orderStatus, paymentStatus, paymentMethod, sortBy, sortDir, setSearchParams]);

    // fetch all
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr("");

                const PAGE_SIZE = 1000;
                let page = 1;
                let all = [];
                let total = Infinity;

                while (!cancelled && all.length < total) {
                    const { data } = await api.get("/api/order/getAllOrders", {
                        params: { page, limit: PAGE_SIZE, sortBy: "createdAt", sortDir: "desc" },
                    });

                    const payload = data?.data ?? data ?? {};
                    const rowsRaw = Array.isArray(payload?.rows)
                        ? payload.rows
                        : Array.isArray(payload)
                            ? payload
                            : [];
                    const mapped = rowsRaw.map(normalizeOrder);

                    all = all.concat(mapped);

                    if (Number.isFinite(+payload?.total)) {
                        total = +payload.total;
                    } else {
                        if (mapped.length === 0) break;
                        if (page > 500) break;
                    }

                    page += 1;
                    if (all.length >= total) break;
                }

                if (!cancelled) setOrders(all);
            } catch (e) {
                if (!cancelled) setErr(e?.response?.data?.message || e.message || "Không tải được danh sách đơn.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // local search/filter/sort
    const filtered = useMemo(() => {
        let arr = orders;
        const nq = normalize(q);
        if (nq) {
            arr = arr.filter((o) => {
                const ordNo = normalize(o.orderNumber);
                const ordId = String(o.orderId ?? "").toLowerCase();
                const name = normalize(o.shippingName);
                const phone = normalize(o.shippingPhone);
                return ordNo.includes(nq) || ordId.includes(nq) || name.includes(nq) || phone.includes(nq);
            });
        }
        if (orderStatus) arr = arr.filter((o) => (o.orderStatus || "").toLowerCase() === orderStatus.toLowerCase());
        if (paymentStatus) arr = arr.filter((o) => (o.paymentStatus || "").toLowerCase() === paymentStatus.toLowerCase());
        if (paymentMethod) arr = arr.filter((o) => (o.paymentMethodCode || "").toUpperCase() === paymentMethod.toUpperCase());
        return arr;
    }, [orders, q, orderStatus, paymentStatus, paymentMethod]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            let va = a[sortBy];
            let vb = b[sortBy];
            if (sortBy === "createdAt" || sortBy === "paidAt") {
                va = va ? new Date(va).getTime() : 0;
                vb = vb ? new Date(vb).getTime() : 0;
            }
            if (sortBy === "orderStatus" || sortBy === "paymentStatus" || sortBy === "paymentMethodCode") {
                va = (va || "").toString();
                vb = (vb || "").toString();
            }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortBy, sortDir]);

    const rows = sorted;

    /* ------------------------------------------------------------------------
       Edit & Save logic (optimistic update)
    ------------------------------------------------------------------------ */
    const getDraft = (o) => edits[o.orderId] ?? { orderStatus: o.orderStatus, paymentStatus: o.paymentStatus };

    const setDraftField = (orderId, field, value) => {
        setEdits((prev) => {
            const cur = prev[orderId] ?? {};
            return { ...prev, [orderId]: { ...cur, [field]: value } };
        });
    };

    const buildPatch = (o, draft) => {
        const patch = {};
        if (draft.orderStatus && draft.orderStatus !== o.orderStatus) patch.orderStatus = draft.orderStatus;
        if (draft.paymentStatus && draft.paymentStatus !== o.paymentStatus) patch.paymentStatus = draft.paymentStatus;
        return patch;
    };

    const validateDraft = (o, draft) => {
        // Rule-based FE validation (khớp BE)
        const method = o.paymentMethodCode;
        const curFul = o.orderStatus;
        const curPay = o.paymentStatus;
        const nextFul = draft.orderStatus ?? curFul;
        const nextPay = draft.paymentStatus ?? curPay;

        // Fulfillment
        const allowFul = allowedFulfillmentTargets(curFul, nextPay);
        const fulOk = nextFul === curFul || allowFul.includes(nextFul);

        // Payment
        const allowPay = allowedPaymentTargets(curPay, method);
        const payOk = nextPay === curPay || allowPay.includes(nextPay);

        // completed requires paid (redundant but explicit)
        const extraOk = !(nextFul === "completed" && nextPay !== "paid");

        return fulOk && payOk && extraOk;
    };

    async function handleSaveRow(o) {
        const draft = getDraft(o);
        const patch = buildPatch(o, draft);

        const describeChanges = (before, p) => {
            const parts = [];
            if (p.orderStatus) parts.push(`Order: ${before.orderStatus} → ${p.orderStatus}`);
            if (p.paymentStatus) parts.push(`Payment: ${before.paymentStatus} → ${p.paymentStatus}`);
            return parts.join(", ");
        };
        const msgFromError = (e) =>
            e?.response?.data?.message || e?.message || "Update failed";

        if (!patch.orderStatus && !patch.paymentStatus) {
            toast.error("Không có thay đổi để lưu.");
            return; // no-op
        }

        // FE validation
        if (!validateDraft(o, draft)) {
            toast.error("Thay đổi không hợp lệ theo rule. Vui lòng kiểm tra lựa chọn.");
            return;
        }

        // Optimistic
        const oldRow = { ...o };
        setPending((p) => ({ ...p, [o.orderId]: true }));
        setOrders((prev) =>
            prev.map((x) =>
                x.orderId === o.orderId ? { ...x, ...patch, __pending: true } : x
            )
        );

        try {
            // Sửa path cho khớp BE của bạn
            const { data } = await api.patch(`/api/order/updateOrder/${o.orderId}`, patch);
            const updated = (data && data.data) ? normalizeOrder(data.data) : { ...o, ...patch };

            setOrders((prev) =>
                prev.map((x) => (x.orderId === o.orderId ? { ...x, ...updated, __pending: false } : x))
            );
            // sync draft với dữ liệu mới → tránh “dirty” ảo
            setEdits((prev) => ({
                ...prev,
                [o.orderId]: { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus }
            }));

            toast.success(`Đã cập nhật đơn #${o.orderNumber}: ${describeChanges(oldRow, patch)}`);
        } catch (e) {
            // Rollback
            setOrders((prev) =>
                prev.map((x) => (x.orderId === o.orderId ? { ...oldRow, __pending: false } : x))
            );
            toast.error(msgFromError(e));
        } finally {
            setPending((p) => ({ ...p, [o.orderId]: false }));
        }
    }

    // ======= UI =======
    if (loading) {
        return (
            <div className="rounded-3xl min-h-screen w-[min(90vw,1280px)] mx-auto bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-[clamp(16px,3vw,28px)]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur text-white">
                    <div className="text-[clamp(20px,2.4vw,28px)] font-semibold">Admin · Orders</div>
                    <div className="mt-6 grid gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl min-h-screen w-[min(90vw,1280px)] mx-auto bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-[clamp(16px,3vw,28px)]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-[clamp(22px,2.6vw,32px)] font-semibold text-white">Admin · Orders</h1>
                        <p className="text-white/70 text-[clamp(14px,1.8vw,20px)]">
                            {orders.length.toLocaleString("vi-VN")} orders loaded
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-white/10 hover:bg-white/20"
                        >
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Error banner */}
                {err && (
                    <div className="mt-4 rounded-2xl bg-rose-500/15 p-4 text-[clamp(14px,1.8vw,20px)] text-rose-200 ring-1 ring-rose-400/20">
                        {err}
                    </div>
                )}

                {/* Filters */}
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="q">Search</Label>
                        <Input
                            id="q"
                            placeholder="Order # / ID / name / phone"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="status">Order Status</Label>
                        <Select id="status" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                            <option value="" className="bg-indigo-900">— All —</option>
                            {["pending", "confirmed", "shipped", "completed", "cancelled"].map((s) => (
                                <option key={s} value={s} className="bg-indigo-900">
                                    {s}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="pstatus">Payment Status</Label>
                        <Select id="pstatus" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                            <option value="" className="bg-indigo-900">— All —</option>
                            {["unpaid", "pending", "paid", "failed", "cancelled"].map((s) => (
                                <option key={s} value={s} className="bg-indigo-900">
                                    {s}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="pm">Method</Label>
                        <Select id="pm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="" className="bg-indigo-900">— All —</option>
                            {["COD", "BANK_TRANSFER", "VNPAY"].map((m) => (
                                <option key={m} value={m} className="bg-indigo-900">
                                    {m}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Sort */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Label className="!mb-0">Sort by</Label>
                    <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-[min(60vw,240px)]">
                        <option value="createdAt" className="bg-indigo-900">Created At</option>
                        <option value="totalVnd" className="bg-indigo-900">Total</option>
                        <option value="orderStatus" className="bg-indigo-900">Order Status</option>
                        <option value="paymentStatus" className="bg-indigo-900">Payment Status</option>
                        <option value="paymentMethodCode" className="bg-indigo-900">Method</option>
                    </Select>
                    <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="w-[min(40vw,160px)]">
                        <option value="asc" className="bg-indigo-900">Asc</option>
                        <option value="desc" className="bg-indigo-900">Desc</option>
                    </Select>
                </div>

                {/* Table */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                    <div className="bg-white/10 px-5 py-4 text-[clamp(16px,2vw,24px)] font-semibold text-white flex items-center justify-between">
                        <span>Orders</span>
                        <span className="text-white/70 text-[clamp(13px,1.8vw,20px)]">
                            Showing {rows.length.toLocaleString("vi-VN")} items
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-white/90">
                            <thead className="bg-white/5 text-[clamp(13px,1.8vw,20px)]">
                                <tr>
                                    <th className="px-5 py-3">#</th>
                                    <th className="px-5 py-3">Order</th>
                                    <th className="px-5 py-3 hidden md:table-cell">Customer</th>
                                    <th className="px-5 py-3">Total</th>
                                    <th className="px-5 py-3 hidden sm:table-cell">Method</th>
                                    <th className="px-5 py-3">Order Status</th>
                                    <th className="px-5 py-3">Payment Status</th>
                                    <th className="px-5 py-3 hidden lg:table-cell">Created At</th>
                                    <th className="px-5 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {rows.length ? (
                                    rows.map((o, idx) => {
                                        const draft = getDraft(o);
                                        const allowFul = allowedFulfillmentTargets(o.orderStatus, draft.paymentStatus ?? o.paymentStatus);
                                        const allowPay = allowedPaymentTargets(o.paymentStatus, o.paymentMethodCode);

                                        // dropdown options
                                        const orderOptions = ["pending", "confirmed", "shipped", "completed", "cancelled"]
                                            .filter((opt) => opt !== "paid") // legacy block
                                            .map((opt) => {
                                                const same = (draft.orderStatus ?? o.orderStatus) === opt;
                                                const enable =
                                                    same ||
                                                    allowFul.includes(opt) ||
                                                    opt === o.orderStatus; // giữ nguyên
                                                return { value: opt, label: opt, disabled: !enable };
                                            });

                                        const payOptions = ["unpaid", "pending", "paid", "failed", "cancelled"].map((opt) => {
                                            const same = (draft.paymentStatus ?? o.paymentStatus) === opt;
                                            const enable = same || allowPay.includes(opt) || opt === o.paymentStatus;
                                            return { value: opt, label: opt, disabled: !enable };
                                        });

                                        const disableCompleteGuard =
                                            (draft.orderStatus ?? o.orderStatus) === "completed" &&
                                            (draft.paymentStatus ?? o.paymentStatus) !== "paid";

                                        return (
                                            <tr
                                                key={o.orderId}
                                                className={
                                                    "hover:bg-white/5 " +
                                                    (isRowPending(o.orderId) ? "opacity-60 pointer-events-none" : "")
                                                }
                                            >
                                                <td className="px-5 py-4 text-[clamp(12px,1.8vw,18px)]">{idx + 1}</td>
                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-white text-[clamp(13px,2vw,20px)]">#{o.orderNumber}</div>
                                                    <div className="text-white/60 text-[clamp(11px,1.6vw,16px)]">ID: {o.orderId}</div>
                                                </td>
                                                <td className="px-5 py-4 hidden md:table-cell">
                                                    <div className="text-white text-[clamp(12px,1.8vw,18px)]">{o.shippingName || "—"}</div>
                                                    <div className="text-white/60 text-[clamp(11px,1.6vw,16px)]">{o.shippingPhone || ""}</div>
                                                </td>
                                                <td className="px-5 py-4 text-[clamp(12px,1.8vw,18px)]">
                                                    {o.totalVnd.toLocaleString("vi-VN")} ₫
                                                </td>
                                                <td className="px-5 py-4 hidden sm:table-cell text-[clamp(12px,1.8vw,18px)]">
                                                    <span
                                                        className={`px-[clamp(8px,1.4vw,12px)] py-[clamp(4px,1vw,6px)] rounded-full ${methodTone(
                                                            o.paymentMethodCode
                                                        )} text-[clamp(11px,1.6vw,14px)]`}
                                                    >
                                                        {o.paymentMethodCode || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`px-[clamp(8px,1.4vw,12px)] py-[clamp(4px,1vw,6px)] rounded-full ${statusTone(
                                                                o.orderStatus
                                                            )} text-[clamp(11px,1.6vw,14px)]`}
                                                        >
                                                            {o.orderStatus || "—"}
                                                        </span>
                                                        <select
                                                            value={draft.orderStatus ?? o.orderStatus ?? ""}
                                                            onChange={(e) => setDraftField(o.orderId, "orderStatus", e.target.value)}
                                                            className="h-[clamp(34px,5vw,44px)] rounded-xl border border-white/20 bg-indigo-900/60 px-[clamp(10px,1.6vw,14px)] text-[clamp(12px,1.8vw,16px)] text-white outline-none focus:border-indigo-300"
                                                        >
                                                            {orderOptions.map((opt) => (
                                                                <option
                                                                    key={opt.value}
                                                                    value={opt.value}
                                                                    disabled={opt.disabled}
                                                                    className="bg-indigo-900"
                                                                >
                                                                    {opt.label}
                                                                    {opt.disabled && opt.value !== (o.orderStatus ?? "") ? " (locked)" : ""}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {disableCompleteGuard && (
                                                        <div className="mt-2 text-[clamp(11px,1.6vw,14px)] text-rose-300">
                                                            Không thể <b>completed</b> khi thanh toán chưa <b>paid</b>.
                                                        </div>
                                                    )}
                                                    {isLegacyPaidStatus(o.orderStatus) && (
                                                        <div className="mt-1 text-[clamp(11px,1.6vw,14px)] text-amber-300">
                                                            Trạng thái legacy <b>paid</b> (fulfillment). Không dùng để cập nhật.
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`px-[clamp(8px,1.4vw,12px)] py-[clamp(4px,1vw,6px)] rounded-full ${payTone(
                                                                o.paymentStatus
                                                            )} text-[clamp(11px,1.6vw,14px)]`}
                                                        >
                                                            {o.paymentStatus || "—"}
                                                        </span>
                                                        <select
                                                            value={draft.paymentStatus ?? o.paymentStatus ?? ""}
                                                            onChange={(e) => setDraftField(o.orderId, "paymentStatus", e.target.value)}
                                                            className="h-[clamp(34px,5vw,44px)] rounded-xl border border-white/20 bg-indigo-900/60 px-[clamp(10px,1.6vw,14px)] text-[clamp(12px,1.8vw,16px)] text-white outline-none focus:border-indigo-300"
                                                        >
                                                            {payOptions.map((opt) => (
                                                                <option
                                                                    key={opt.value}
                                                                    value={opt.value}
                                                                    disabled={opt.disabled}
                                                                    className="bg-indigo-900"
                                                                >
                                                                    {opt.label}
                                                                    {opt.disabled && opt.value !== (o.paymentStatus ?? "") ? " (locked)" : ""}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {o.paymentMethodCode === "VNPAY" &&
                                                        (draft.paymentStatus ?? o.paymentStatus) === "paid" &&
                                                        (o.paymentStatus !== "paid") && (
                                                            <div className="mt-1 text-[clamp(11px,1.6vw,14px)] text-rose-300">
                                                                VNPAY cấm set <b>paid</b> thủ công. Chỉ xác thực qua callback.
                                                            </div>
                                                        )}
                                                    {o.paymentStatus === "paid" && (draft.paymentStatus ?? "paid") !== "paid" && (
                                                        <div className="mt-1 text-[clamp(11px,1.6vw,14px)] text-rose-300">
                                                            Đã <b>paid</b> thì không được đổi trạng thái thanh toán.
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 hidden lg:table-cell text-[clamp(12px,1.8vw,18px)]">
                                                    {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : ""}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Button
                                                        onClick={() => handleSaveRow(o)}
                                                        disabled={
                                                            !(
                                                                ((edits[o.orderId]?.orderStatus ?? o.orderStatus) !== o.orderStatus) ||
                                                                ((edits[o.orderId]?.paymentStatus ?? o.paymentStatus) !== o.paymentStatus)
                                                            ) ||
                                                            isRowPending(o.orderId) ||
                                                            (
                                                                ((edits[o.orderId]?.orderStatus ?? o.orderStatus) === "completed") &&
                                                                ((edits[o.orderId]?.paymentStatus ?? o.paymentStatus) !== "paid")
                                                            )
                                                        }
                                                        className={
                                                            "bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed " +
                                                            (isRowPending(o.orderId) ? "relative " : "")
                                                        }
                                                        title="Lưu thay đổi trạng thái"
                                                    >
                                                        {isRowPending(o.orderId) ? (
                                                            <span className="inline-flex items-center gap-2">
                                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                                Saving…
                                                            </span>
                                                        ) : (
                                                            "Save"
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-8 text-center text-[clamp(12px,1.8vw,18px)] text-white/70">
                                            Không có đơn phù hợp
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 text-[clamp(12px,1.8vw,18px)] text-white/60">
                    <p>Hiển thị tất cả đơn trên một trang. Dùng bộ lọc/tìm kiếm/sắp xếp ở phía client để thao tác nhanh.</p>
                </div>
            </div>
        </div>
    );
}
