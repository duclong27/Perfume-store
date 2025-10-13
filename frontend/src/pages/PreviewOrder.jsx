import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../api.js";

const money = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

/* ===== Helpers ===== */
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

function adaptPreviewLines(lines = []) {
    return lines.map((l, i) => ({
        originalIndex: i,
        cartItemId: Number(l.variantId) || i,
        variantId: Number(l.variantId),
        qty: Number(l.qtyRequested ?? l.qtyPriced ?? 0),
        effectiveUnitPrice: Number(l.unitPrice ?? 0),
        lineSubtotal: Number(l.lineSubtotal ?? 0),
        displayName: l?.variant?.product?.name || l?.variant?.name || "Product",
        imageUrl: l?.imageUrl || l?.variant?.product?.imageUrl || null,
        sku: l?.variant?.sku || null,
        capacityMl: l?.variant?.capacityMl ?? null,
        warnings: Array.isArray(l.warnings) ? l.warnings : [],
    }));
}

export default function PreviewOrder() {
    const navigate = useNavigate();
    const { user, isLoading: authBooting } = useAuth();
    const { updateQty, removeItem, isWorking } = useCart();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [preview, setPreview] = useState(null);

    // ====== Địa chỉ (saved) ======
    const [addresses, setAddresses] = useState([]);
    const [addrLoading, setAddrLoading] = useState(true);
    const [addrErr, setAddrErr] = useState("");

    // UI chọn nguồn: saved vs nhập tay
    const [useSavedAddress, setUseSavedAddress] = useState(false);
    const [addressId, setAddressId] = useState(null);

    const [refetchTick, setRefetchTick] = useState(0);

    const [snap, setSnap] = useState({
        shippingName: "",
        shippingPhone: "",
        shippingAddress: "",
        shippingCity: "",
        shippingState: "",
        shippingPostal: "",
        shippingCountry: "Việt Nam",
    });

    const [buyNowItems, setBuyNowItems] = useState([]);
    const [source] = useState("cart");

    const [state, setState] = useState({ loading: true, data: null, error: null });
    const debounceRef = useRef(null);
    const busyRef = useRef(false);

    // ====== NEW: Payment method state ======
    const fallbackPaymentOptions = [
        { code: "COD", label: "Thanh toán khi nhận hàng" },
        { code: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
        { code: "VNPAY", label: "VNPay (chuyển hướng sau khi đặt hàng)" },
    ];
    const [paymentMethod, setPaymentMethod] = useState("COD");

    // ====== FETCH ADDRESSES (đúng form trước) ======
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setAddrLoading(true);
                setAddrErr("");
                const { data } = await api.get("/internal/v1/getAddresses");
                const raw = data?.items ?? data?.data ?? data ?? [];
                const list = Array.isArray(raw) ? raw.map(normalizeAddress) : [];
                if (!cancelled) {
                    setAddresses(list);
                    // Luôn có default theo thiết kế của bạn → chọn default làm addressId
                    const def = list.find((a) => a.isDefault) ?? list[0] ?? null;
                    if (def) {
                        setUseSavedAddress(true);
                        setAddressId(def.addressId);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    const msg = e?.response?.data?.message || e.message || "Fetch addresses failed";
                    setAddrErr(msg);
                }
            } finally {
                if (!cancelled) setAddrLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ====== Payload preview (ĐÃ THÊM paymentMethodCode) ======
    const payload = useMemo(() => ({
        source, // "cart" | "buy_now"
        addressId: useSavedAddress ? (Number(addressId) || null) : null,
        shippingSnapshot: useSavedAddress
            ? null
            : {
                shippingName: snap.shippingName?.trim(),
                shippingPhone: snap.shippingPhone?.trim(),
                shippingAddress: snap.shippingAddress?.trim(),
                shippingCity: snap.shippingCity?.trim(),
                shippingState: snap.shippingState?.trim() || null,
                shippingPostal: snap.shippingPostal?.trim() || null,
                shippingCountry: (snap.shippingCountry || "Việt Nam").trim(),
            },
        items: source === "buy_now" ? buyNowItems : undefined,
        paymentMethodCode: paymentMethod, // <<< NEW
    }), [source, useSavedAddress, addressId, snap, buyNowItems, paymentMethod]);

    // ====== Fetch Preview ======
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const { data: res } = await api.post("/internal/v1/preview", payload);

                const data = res?.data ?? res;

                // NEW: sync lại paymentMethod nếu server có hiệu lực khác
                const requested = data?.payment?.requested;
                const effective = data?.payment?.effective;
                if (effective && effective !== paymentMethod) {
                    setPaymentMethod(effective);
                } else if (requested && requested !== paymentMethod) {
                    setPaymentMethod(requested);
                }

                if (!cancelled) setPreview(data);
            } catch (e) {
                if (!cancelled) setErr(e?.response?.data?.message || e.message || "Fetch preview failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [payload, refetchTick]);

    /* ====== Derive từ preview ====== */
    const lines = preview?.lines || [];
    const items = adaptPreviewLines(lines);
    const itemsSorted = items.slice();
    const totals = preview?.totals || { subtotal: 0, shippingFee: 0, discountTotal: 0, grandTotal: 0 };

    // NEW: payment options + bank transfer instructions
    const paymentOptions = preview?.payment?.options ?? fallbackPaymentOptions;
    const bankTransferOpt = (paymentOptions || []).find(o => o.code === "BANK_TRANSFER");
    const bankTransferInstructions = bankTransferOpt && bankTransferOpt.previewInstructions
        ? bankTransferOpt.previewInstructions
        : null;

    const cartCount = useMemo(() => items.reduce((s, it) => s + Number(it.qty || 0), 0), [items]);
    const placeOrderDisabled = useMemo(() => {
        return items.some((l) => (l.warnings || []).some((w) => w === "inactive" || w === "price_missing"));
    }, [items]);




    /* ====== Display address for summary UI ====== */


    const compactAddr = (o = {}) => {
        const parts = [
            o.shippingAddress,
            [o.shippingCity, o.shippingState].filter(Boolean).join(", "),
            o.shippingPostal,
        ].filter(Boolean);
        return parts.join(" • ");
    };

    // Chuẩn hoá country hiển thị
    const displayCountry = (v) => {
        if (!v) return "Vietnam";
        const s = String(v).toLowerCase();
        if (s === "vn" || s.includes("việt")) return "Vietnam";
        return v;
    };

    // Lấy snapshot địa chỉ để hiển thị ưu tiên theo thứ tự:
    // 1) `preview.addressSnapshot` từ Core
    // 2) Nếu dùng saved address: lấy từ danh sách `addresses` đang chọn
    // 3) Nếu nhập tay: lấy từ state `snap`
    const addressDisplay = useMemo(() => {
        // 1) Server trả về
        if (preview?.addressSnapshot) {
            const a = preview.addressSnapshot;
            return {
                name: a.shippingName,
                phone: a.shippingPhone,
                line: compactAddr(a),
                country: displayCountry(a.shippingCountry),
            };
        }

        // 2) Saved address
        if (useSavedAddress) {
            const a = addresses.find((x) => Number(x.addressId) === Number(addressId));
            if (a) {
                return {
                    name: a.recipientName,
                    phone: a.phoneNumber,
                    line: compactAddr({
                        shippingAddress: a.addressLine,
                        shippingCity: a.city,
                        shippingState: a.state,
                        shippingPostal: a.postalCode,
                    }),
                    country: displayCountry(a.country || "VN"),
                };
            }
        }

        // 3) Nhập tay (snap)
        if (snap?.shippingName || snap?.shippingAddress) {
            return {
                name: snap.shippingName || "",
                phone: snap.shippingPhone || "",
                line: compactAddr({
                    shippingAddress: snap.shippingAddress,
                    shippingCity: snap.shippingCity,
                    shippingState: snap.shippingState,
                    shippingPostal: snap.shippingPostal,
                }),
                country: displayCountry(snap.shippingCountry || "VN"),
            };
        }


        return null;
    }, [preview, useSavedAddress, addresses, addressId, snap]);
    console.log("snap bff :", snap)

    /* ====== fetch api place order ====== */

    const [placing, setPlacing] = useState(false);

    // async function onPlaceOrder() {
    //     if (preview?.hasAnyWarning) return; // chặn nếu có cảnh báo
    //     setPlacing(true);
    //     try {
    //         const placePayload = {
    //             ...payload, // dùng lại payload preview bạn đang có
    //             paymentMethodCode: preview?.payment?.effective || paymentMethod,
    //         };

    //         const res = await api.post("/internal/v1/place", placePayload, {

    //             headers: {
    //                 "Idempotency-Key": crypto.randomUUID?.() || String(Date.now()),
    //             },
    //         });
    //         console.log("res :", res)
    //         const data = res?.data?.data || {};

    //         switch (data.paymentMethodCode) {
    //             case "COD":
    //                 navigate(`/order/success/${data.orderId}`, {
    //                     state: {
    //                         orderId: data.orderId,
    //                         paymentStatus: data.paymentStatus,
    //                         message: data.message,
    //                     },
    //                 });
    //                 break;

    //             case "BANK_TRANSFER":
    //                 navigate(`/order/success/${data.orderId}`, {
    //                     state: {
    //                         orderId: data.orderId,
    //                         paymentStatus: data.paymentStatus,
    //                         paymentInstructions: data.paymentInstructionsSnapshot,
    //                     },
    //                 });
    //                 break;

    //             case "VNPAY":
    //                 window.location.href = data.paymentUrl;
    //                 break;

    //             default:
    //                 alert("Phương thức thanh toán không hỗ trợ");
    //         }
    //     } catch (e) {
    //         alert(e?.response?.data?.message || "Đặt hàng thất bại");
    //     } finally {
    //         setPlacing(false);
    //     }
    // }


    async function onPlaceOrder() {
        if (preview?.hasAnyWarning) return; // chặn nếu có cảnh báo
        setPlacing(true);
        try {
            const placePayload = {
                ...payload,
                paymentMethodCode: preview?.payment?.effective || paymentMethod,
            };

            const res = await api.post("/internal/v1/place", placePayload, {
                headers: { "Idempotency-Key": crypto.randomUUID?.() || String(Date.now()) },
            });

            const data = res?.data?.data || {};
            const { orderId, paymentMethodCode, paymentStatus } = data;

            switch (paymentMethodCode) {
                case "COD":
                    // unpaid là chuẩn
                    navigate(`/order/success/${orderId}?pm=COD&status=${encodeURIComponent(paymentStatus || "unpaid")}`);
                    break;

                case "BANK_TRANSFER":
                    // pending là chuẩn (snapshot sẽ xem trong My orders, trang success không gọi API)
                    navigate(`/order/success/${orderId}?pm=BANK_TRANSFER&status=${encodeURIComponent(paymentStatus || "pending")}`);
                    break;

                case "VNPAY":
                    // chuyển sang VNPay; sau khi thanh toán xong Return Page sẽ chốt và quay về success
                    window.location.href = data.paymentUrl;
                    break;

                default:
                    alert("Phương thức thanh toán không hỗ trợ");
            }
        } catch (e) {
            alert(e?.response?.data?.message || "Đặt hàng thất bại");
        } finally {
            setPlacing(false);
        }
    }


    /* ====== End fetch api place order ====== */



    /* ====== UI ====== */
    return (
        <div className="max-w-9xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* LEFT */}
                <aside className="md:col-span-8 space-y-6">
                    <h1 className="text-3xl lora-regular font-bold tracking-tight">Checkout</h1>

                    {/* Shipping Information card */}
                    <div className="relative rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
                        <div
                            className="pointer-events-none absolute -inset-px rounded-2xl opacity-15"
                            style={{ background: "conic-gradient(from 140deg at 20% 10%, #6366f1 0deg, #22d3ee 120deg, #22c55e 240deg, #6366f1 360deg)" }}
                        />
                        <div className="relative z-10 px-6 py-4 border-b bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-800">Shipping Information</h2>

                                {/* Switch saved address */}
                                <label className="flex items-center gap-3 text-xl select-none">
                                    <span className="text-slate-600">Use saved address</span>
                                    <button
                                        type="button"
                                        onClick={() => setUseSavedAddress(!useSavedAddress)}
                                        className={[
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition",
                                            useSavedAddress ? "bg-indigo-500/90" : "bg-slate-300",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                                                useSavedAddress ? "translate-x-5" : "translate-x-1",
                                            ].join(" ")}
                                        />
                                    </button>
                                </label>
                            </div>
                        </div>

                        {/* Body */}
                        {useSavedAddress ? (
                            <div className="relative z-10 px-6 py-5 grid grid-cols-1 gap-4">
                                {addrLoading ? (
                                    <div className="text-slate-500">Loading addresses…</div>
                                ) : addrErr ? (
                                    <div className="text-rose-600">{addrErr}</div>
                                ) : addresses.length === 0 ? (
                                    <div className="text-slate-600">Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ trước khi thanh toán.</div>
                                ) : (
                                    <div>
                                        <label className="block text-xl text-slate-700 mb-1">Saved address</label>
                                        <select
                                            className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300"
                                            value={addressId ?? ""}
                                            onChange={(e) => setAddressId(e.target.value ? Number(e.target.value) : null)}
                                        >
                                            {addresses.map((a) => (
                                                <option key={a.addressId} value={a.addressId}>
                                                    {a.isDefault ? "⭐ " : ""}
                                                    {a.recipientName} — {a.addressLine}, {[a.city, a.state].filter(Boolean).join(", ")}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">Đang chọn địa chỉ đã lưu. Hệ thống của bạn luôn có 1 địa chỉ mặc định.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative z-10 px-6 py-5 grid grid-cols-1 gap-4">
                                {/* form nhập tay giữ nguyên của bạn */}
                                <div>
                                    <label className="block text-xl text-slate-700 mb-1">Full name <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                        value={snap.shippingName}
                                        onChange={(e) => setSnap({ ...snap, shippingName: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xl text-slate-700 mb-1">Phone <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                        value={snap.shippingPhone}
                                        onChange={(e) => setSnap({ ...snap, shippingPhone: e.target.value })}
                                        placeholder="0901234567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xl text-slate-700 mb-1">Address <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                        value={snap.shippingAddress}
                                        onChange={(e) => setSnap({ ...snap, shippingAddress: e.target.value })}
                                        placeholder="Street, house number…"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xl text-slate-700 mb-1">City <span className="text-rose-500">*</span></label>
                                        <input
                                            className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                            value={snap.shippingCity}
                                            onChange={(e) => setSnap({ ...snap, shippingCity: e.target.value })}
                                            placeholder="Viet Tri"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-slate-700 mb-1">Province</label>
                                        <input
                                            className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                            value={snap.shippingState}
                                            onChange={(e) => setSnap({ ...snap, shippingState: e.target.value })}
                                            placeholder="Phu Tho"
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xl text-slate-700 mb-1">Postal code</label>
                                        <input
                                            className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                            value={snap.shippingPostal}
                                            onChange={(e) => setSnap({ ...snap, shippingPostal: e.target.value })}
                                            placeholder="100000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-slate-700 mb-1">Country</label>
                                        <input
                                            className="w-full rounded-xl border px-3 py-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-300 placeholder:text-slate-400"
                                            value={snap.shippingCountry}
                                            onChange={(e) => setSnap({ ...snap, shippingCountry: e.target.value })}
                                            placeholder="Vietnam"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NEW: Payment Method Selector */}
                    <div className="relative rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">Payment Method</h2>

                        <div className="grid gap-3">
                            {paymentOptions.map((opt) => (
                                <label
                                    key={opt.code}
                                    className={[
                                        "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer",
                                        paymentMethod === opt.code ? "border-slate-900 shadow-sm" : "border-slate-200 hover:border-slate-300",
                                    ].join(" ")}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethodCode"
                                        value={opt.code}
                                        checked={paymentMethod === opt.code}
                                        onChange={() => setPaymentMethod(opt.code)}
                                        className="mt-1 h-5 w-5"
                                    />
                                    <div className="text-xl leading-relaxed">
                                        <div className="font-semibold">{opt.label || opt.code}</div>

                                        {/* Only for BANK_TRANSFER, show extra panel if instructions exist */}
                                        {paymentMethod === "BANK_TRANSFER" &&
                                            opt.code === "BANK_TRANSFER" &&
                                            bankTransferInstructions && (
                                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                    {bankTransferInstructions.noteSample && (
                                                        <div className="mb-2">
                                                            <div className="text-base text-slate-600">Ghi nội dung khi chuyển khoản</div>
                                                            <div className="text-xl font-medium select-all">
                                                                {bankTransferInstructions.noteSample}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {bankTransferInstructions.imageUrl && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={bankTransferInstructions.imageUrl}
                                                                alt="QR chuyển khoản"
                                                                className="max-h-56 rounded-lg border border-slate-200"
                                                            />
                                                        </div>
                                                    )}
                                                    {bankTransferInstructions.hint && (
                                                        <div className="mt-3 text-base text-slate-600">{bankTransferInstructions.hint}</div>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </label>
                            ))}
                        </div>

                        {loading && <div className="mt-3 text-sm text-cyan-700">Calculating…</div>}
                        {err && <div className="mt-3 text-sm text-rose-600">Failed to load preview: {err}</div>}
                    </div>
                </aside>

                {/* RIGHT (items + summary) — giữ nguyên phần còn lại của bạn */}
                <section className="md:col-span-4 space-y-6">
                    {/* Header row (sticky on desktop) */}
                    <div className="hidden md:sticky md:top-16 md:z-20 md:block">
                        <div className="relative rounded-2xl border border-slate-300 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
                            <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[conic-gradient(at_20%_20%,#6366f1_0deg,#06b6d4_120deg,#22c55e_240deg,#6366f1_360deg)] opacity-20" />
                            <div className="relative grid grid-cols-[1.2fr_.5fr_.5fr_.7fr] px-4 py-3 text-xl font-semibold tracking-wide text-slate-700 uppercase">
                                <div className="flex items-center gap-2">Items</div>
                                <div className="whitespace-nowrap">Size</div>
                                <div className="text-center whitespace-nowrap">Quans</div>
                                <div className="text-right whitespace-nowrap">Sub</div>
                            </div>
                        </div>
                    </div>

                    {/* Items list / empty state */}
                    {cartCount === 0 ? (
                        <div className="text-center text-gray-600 py-16 rounded-2xl border border-slate-200 bg-white/70">
                            <p className="text-lg">Your cart is empty.</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate("/")}
                                    className="px-5 py-3 rounded-full bg-black text-white text-sm font-medium hover:opacity-90 active:scale-95 transition"
                                >
                                    Continue shopping
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {itemsSorted.map((item) => {
                                const name = item.displayName;
                                const img = item.imageUrl;
                                const sku = item.sku;
                                const sizeMl = item.capacityMl;
                                const unit = Number(item.effectiveUnitPrice || 0);
                                const line = Number(item.lineSubtotal ?? unit * (Number(item.qty) || 0));

                                return (
                                    <div
                                        key={item.cartItemId}
                                        className="
                      group relative grid grid-cols-1 md:grid-cols-[1.2fr_.5fr_.5fr_.7fr] items-center gap-3
                      p-3 px-4 rounded-2xl border border-slate-300 bg-white/95 backdrop-blur-xl shadow-lg
                      ring-1 ring-black/5 overflow-hidden
                      transition-all duration-300 ease-out
                      hover:-translate-y-[2px] hover:scale-[1.005] hover:shadow-2xl hover:ring-black/10
                      active:scale-[0.998]
                    "
                                    >
                                        <div
                                            className="
                        pointer-events-none absolute -inset-px rounded-2xl
                        bg-[conic-gradient(at_20%_20%,#6366f1_0deg,#06b6d4_120deg,#22c55e_240deg,#6366f1_360deg)]
                        opacity-[0.14] group-hover:opacity-[0.22]
                        transition-opacity duration-300
                      "
                                        />
                                        <div className="relative contents">
                                            {/* Col 1: item info */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={img}
                                                    alt={name}
                                                    className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover bg-gray-200 shrink-0 transition-transform duration-300 group-hover:scale-[1.01]"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold lora-regular text-2xl truncate">{name}</h3>
                                                    {!!sku && <div className="text-xl text-gray-600 mt-0.5 truncate">SKU: {sku}</div>}
                                                    {Array.isArray(item.warnings) && item.warnings.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {item.warnings.includes("low_stock") && (
                                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                                                                    Low stock
                                                                </span>
                                                            )}
                                                            {(item.warnings.includes("inactive") || item.warnings.includes("price_missing")) && (
                                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-red-700 border-red-300 bg-red-50">
                                                                    Not orderable
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Col 2: size */}
                                            <div className="text-xl text-gray-700 whitespace-nowrap">
                                                {sizeMl ? `${sizeMl}ml` : "-"}
                                            </div>

                                            {/* Col 3: qty */}
                                            <div className="text-center text-xl font-semibold tabular-nums whitespace-nowrap">
                                                {item.qty ?? 0}
                                            </div>

                                            {/* Col 4: line subtotal */}
                                            <div className="text-right font-semibold text-xl whitespace-nowrap">
                                                {money(line)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ORDER SUMMARY — colorful variant */}
                    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 shadow-xl">
                        <div className="rounded-2xl bg-white/85 backdrop-blur-xl p-6">
                            {/* header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                                    Order Summary
                                </h2>
                                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium
                       bg-rose-50 text-rose-700 border-rose-200">
                                    Secure checkout
                                </span>
                            </div>

                            {/* rows */}
                            <div className="space-y-2 text-lg">


                                {/* Display address for summary UI */}


                                {/* SHIP TO */}
                                {addressDisplay && (
                                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-xl font-semibold  mb-1">Ship to</div>
                                        <div className="text-xl font-semibold ">
                                            {addressDisplay.name || "—"}
                                        </div>
                                        <div className="text-xl">
                                            {addressDisplay.phone || "—"}
                                        </div>
                                        <div className="text-xl">
                                            {addressDisplay.line || "—"}
                                        </div>
                                        <div className="text-xl">
                                            {addressDisplay.country || "—"}
                                        </div>
                                    </div>
                                )}

                                {/* End Display address for summary UI */}




                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-slate-700">Subtotal</span>
                                    <span className="font-semibold">{money(totals.subtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-slate-700">Shipping fee</span>
                                    <span className="font-semibold flex items-center gap-2">
                                        {money(totals.shippingFee)}
                                        {Number(totals.shippingFee) === 0 && (
                                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]
                             bg-emerald-50 text-emerald-700 border-emerald-200">
                                                FREE
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-slate-700">Discount</span>
                                    <span className="font-semibold text-rose-600">
                                        -{money(totals.discountTotal)}
                                    </span>
                                </div>

                                <div className="h-px my-2 bg-gradient-to-r from-rose-200 via-fuchsia-200 to-indigo-200" />

                                <div className="flex justify-between items-center font-bold text-xl
                      bg-gradient-to-r from-fuchsia-50 to-indigo-50 rounded-xl px-4 py-3">
                                    <span className="text-slate-800">Total</span>
                                    <span className="text-slate-900">{money(totals.grandTotal)}</span>
                                </div>
                            </div>



                            {/* button after fetched */}


                            <button
                                disabled={placeOrderDisabled || cartCount === 0 || placing}
                                onClick={onPlaceOrder}
                                className="mt-6 w-full px-5 py-3 rounded-full text-white text-base font-medium
             bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600
             shadow-md hover:brightness-110 active:scale-95 transition
             disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {placing ? "Processing..." : "Place order"}
                            </button>

                            {/* end button after fetched */}




                            {/* statuses */}
                            {loading && (
                                <div className="mt-3 text-sm text-cyan-700">
                                    Calculating…
                                </div>
                            )}
                            {err && (
                                <div className="mt-3 text-sm text-rose-600">
                                    Failed to load preview: {err}
                                </div>
                            )}
                        </div>
                    </div>


                </section>
            </div>
        </div>
    );
}
