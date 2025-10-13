








import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

/**
 * Cart page — render từ CartContext
 * - Hợp đồng API:
 *    + PATCH /cartItem  { variantId, qty }  → update tuyệt đối, qty=0 coi như xoá
 *    + DELETE /cartItem/:cartItemId        → xoá theo id (remove)
 */

// ----- Helpers -----
const PLACEHOLDER_IMG = "https://via.placeholder.com/120x120.png?text=No+Image";

const getDisplayName = (item = {}) => {
    if (item?.name && String(item.name).trim()) return String(item.name).trim();
    const v = item.variant || {};
    const p = v.product || {};
    const vName = v.name && String(v.name).trim();
    const pName = p.name && String(p.name).trim();
    return vName || pName || "Product";
};

const getDisplayImage = (item = {}) => {
    if (item?.imageUrl) return item.imageUrl;
    const v = item.variant || {};
    const p = v.product || {};
    return v.imageUrl || v.image_url || p.imageUrl || p.image_url || PLACEHOLDER_IMG;
};

const getSku = (item = {}) => item.sku || item.variant?.sku || "";
const getCapacityMl = (item = {}) => item.capacityMl ?? item.variant?.capacityMl ?? null;

export default function Cart() {
    const navigate = useNavigate();
    const { cart, cartCount, subtotal, isWorking, updateQty, removeItem, fmtVND } = useCart();

    const items = cart?.items ?? [];
    const money = (n) =>
        typeof fmtVND === "function"
            ? fmtVND(n)
            : Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // Sort ổn định để tránh “loạn vị trí” sau khi PATCH
    const itemsSorted = useMemo(() => {
        return [...items].sort((a, b) => {
            const ax = Number(a?.cartItemId) || 0;
            const bx = Number(b?.cartItemId) || 0;
            return ax - bx;
        });
    }, [items]);

    // Handlers
    const onDec = async (it) => {
        if (isWorking) return;
        const current = Number(it?.qty || 0);
        const next = current - 1;
        await updateQty({ variantId: it?.variantId, qty: Math.max(next, 0) }); // qty=0 → xoá
    };

    const onInc = async (it) => {
        if (isWorking) return;
        const next = Number(it?.qty || 0) + 1;
        await updateQty({ variantId: it?.variantId, qty: next });
    };

    const onRemove = async (it) => {
        if (isWorking) return;
        await removeItem(it.cartItemId);
    };

    return (
        <div className="max-w-10xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-10">
            {/* Left: items */}
            <section className="space-y-6">
                <h1 className="text-3xl lora-regular font-bold tracking-tight">Shopping cart</h1>

                {/* Header (desktop) */}
                <div className="hidden md:sticky md:top-16 md:z-20 md:block">
                    <div className="relative rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-md overflow-hidden">
                        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[conic-gradient(at_20%_20%,#6366f1_0deg,#06b6d4_120deg,#22c55e_240deg,#6366f1_360deg)] opacity-10" />
                        <div className="relative grid grid-cols-[1.4fr_.8fr_.8fr_.9fr_.9fr_.8fr] px-6 py-4 text-base md:text-lg font-semibold tracking-wide text-slate-700 uppercase">
                            <div className="flex items-center gap-2">Items</div>
                            <div>Size</div>
                            <div>Unit Price</div>
                            <div className="text-center">Quantities</div>
                            <div className="text-right">Subtotal</div>
                            <div className="text-right">Action</div>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    </div>
                </div>

                {/* Empty state */}
                {cartCount === 0 ? (
                    <div className="text-center text-gray-600 py-16 rounded-2xl border border-slate-200 bg-white/70">
                        <p className="text-lg">Giỏ hàng trống.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate("/")}
                                className="px-5 py-3 rounded-full bg-black text-white text-sm font-medium hover:opacity-90 active:scale-95 transition"
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {itemsSorted.map((item) => {
                            const name = getDisplayName(item);
                            const img = getDisplayImage(item);
                            const sku = getSku(item);
                            const capacityMl = getCapacityMl(item);

                            const unit = Number(item?.effectiveUnitPrice ?? 0);
                            const line = Number(item?.lineSubtotal ?? unit * (Number(item?.qty) || 0));

                            return (
                                <div
                                    key={item.cartItemId}
                                    className="group relative grid grid-cols-1 md:grid-cols-[1.4fr_.8fr_.8fr_.9fr_.9fr_.8fr] items-center gap-4 p-4 px-6 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-[2px] before:absolute before:inset-0 before:-z-10 before:rounded-[1.2rem] before:bg-[linear-gradient(120deg,rgba(99,102,241,0.08),rgba(6,182,212,0.08),rgba(34,197,94,0.08))] after:pointer-events-none after:absolute after:inset-0 after:rounded-[1.2rem] after:ring-1 after:ring-inset after:ring-black/5"
                                >
                                    {/* Image + Name */}
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={img}
                                            alt={name}
                                            className="w-20 h-20 rounded-lg object-cover bg-gray-200"
                                        />
                                        <div className="min-w-0">
                                            <h3 className="font-semibold lora-regular text-lg md:text-xl truncate">
                                                {name}
                                            </h3>
                                            <div className="text-xl text-gray-600 space-x-2">
                                                {!!sku && <span>SKU: {sku}</span>}

                                            </div>
                                        </div>
                                    </div>

                                    {/* Size */}
                                    <div className="text-lg text-gray-700">
                                        {capacityMl ? `${capacityMl}ml` : "-"}
                                    </div>

                                    {/* Unit Price */}
                                    <div className="text-lg">{money(unit)}</div>

                                    {/* Quantities (+ / –) */}
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onDec(item)}
                                            disabled={isWorking || (item?.qty ?? 0) <= 0}
                                            className="w-9 h-9 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50"
                                            aria-label="Giảm số lượng"
                                            title="Giảm"
                                        >
                                            –
                                        </button>

                                        <span className="min-w-[2ch] text-center text-lg font-semibold select-none">
                                            {item?.qty}
                                        </span>

                                        <button
                                            onClick={() => onInc(item)}
                                            disabled={isWorking}
                                            className="w-9 h-9 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50"
                                            aria-label="Tăng số lượng"
                                            title="Tăng"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Line Subtotal */}
                                    <div className="text-right text-lg font-semibold">{money(line)}</div>

                                    {/* Actions */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => onRemove(item)}
                                            disabled={isWorking}
                                            className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                            title="Xoá khỏi giỏ"
                                        >
                                            Xoá
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Right: summary */}
            <aside className="space-y-4">
                <div className="sticky top-16 relative rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 shadow-md overflow-hidden">
                    {/* decorative gradient halo */}
                    <div
                        className="pointer-events-none absolute -inset-px rounded-2xl opacity-15"
                        style={{
                            background:
                                "conic-gradient(from 140deg at 20% 10%, #6366f1 0deg, #22d3ee 120deg, #22c55e 240deg, #6366f1 360deg)"
                        }}
                    />
                    {/* subtle inner glow */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />

                    <div className="relative z-10">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                        <div className="flex items-center justify-between py-3 text-xl">
                            <span>Total items</span>
                            <span className="font-medium">{cartCount}</span>
                        </div>

                        <div className="h-px bg-slate-200 my-2" />

                        <div className="flex items-center justify-between py-3 text-xl">
                            <span className="font-semibold">Subtotal</span>
                            <span className="font-bold">{money(subtotal)}</span>
                        </div>

                        <button
                            onClick={() => navigate("/previewOrderPage")}
                            disabled={cartCount === 0 || isWorking}
                            className="
          mt-4 w-full px-5 py-3 rounded-full
          bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500
          text-xl font-medium text-white
          hover:brightness-110 active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed
          shadow-md transition
        "
                        >
                            Proceed to checkout
                        </button>

                        <p className="mt-3 text-xs text-gray-500">
                            * Subtotal is returned by server. Frontend does not re-calculate.
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <Link
                        to="/"
                        className="text-xl font-medium underline underline-offset-4 hover:opacity-80"
                    >
                        ← Continue shopping
                    </Link>
                </div>
            </aside>
        </div>
    );
}
