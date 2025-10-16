import React, { useEffect, useState, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from "../components/ProductItem";
import Title from './Title';
import { api } from "../App.jsx";



/* ---------------------- Helpers + Normalize (inline) ---------------------- */
const ensureNum = (v, def = null) => {
    if (v === undefined || v === null || v === "") return def;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};

const toBool = (v, def = true) => {
    if (v === undefined || v === null) return def;
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase();
    if (["true", "1", "yes", "y", "enabled", "on"].includes(s)) return true;
    if (["false", "0", "no", "n", "disabled", "off"].includes(s)) return false;
    return def;
};

const formatPrice = (n) => (n == null ? "" : new Intl.NumberFormat("vi-VN").format(n));

const normalizeVariant = (v = {}) => {
    return {
        variant_id: v.variant_id ?? v.variantId ?? v.id ?? v._id,
        capacityMl:
            ensureNum(v.capacityMl, null) ??
            ensureNum(v.capacity_ml, null) ??
            ensureNum(v.capacity, null) ??
            ensureNum(v.size_ml, null),
        price:
            ensureNum(v.price, null) ??
            ensureNum(v.sale_price, null) ??
            ensureNum(v.original_price, null),
        stock:
            ensureNum(v.stock, null) ??
            ensureNum(v.quantity, null) ??
            ensureNum(v.inventory, 0),
        imageUrl: v.imageUrl ?? v.image_url ?? v.image ?? v.thumbnail ?? null,
        enabled: toBool(v.isEnable ?? v.enabled ?? v.active, true),
        raw: v,
    };
};

const normalizeProduct = (p = {}) => {
    const variantsArr = Array.isArray(p.variants) ? p.variants.map(normalizeVariant) : [];
    const image =
        p.image ?? p.imageUrl ?? p.image_url ?? variantsArr.find((v) => v.imageUrl)?.imageUrl ?? null;

    return {
        id: p.id ?? p.productId ?? p.product_id ?? p._id,
        name: p.name ?? p.productName ?? p.product_title ?? "Unnamed",
        description: p.description ?? null,
        gender: p.gender ?? null,
        image,
        isEnable: toBool(p.isEnable ?? p.enabled ?? p.active, true),
        variants: variantsArr,
        raw: p,
    };
};
/* ------------------------------------------------------------------------ */

const LIMIT_INITIAL = 5;   // mặc định hiển thị
const LIMIT_EXPANDED = 10; // khi bấm "View all" sẽ max 10

const RelatedProduct = ({ gender, excludeId }) => {
    const [related, setRelated] = useState([]);
    const [visibleCount, setVisibleCount] = useState(LIMIT_INITIAL);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        let cancelled = false;

        if (!gender) {
            setRelated([]);
            setVisibleCount(LIMIT_INITIAL);
            return;
        }

        (async () => {
            try {
                setLoading(true);
                setErr("");

                // Fetch danh sách sản phẩm -> filter client theo gender
                const { data } = await api.get("/api/v1/getAllProducts");
                const rawList = data?.items ?? data?.data ?? data ?? [];
                const normalized = Array.isArray(rawList) ? rawList.map(normalizeProduct) : [];

                // Lọc theo gender, loại bỏ chính sản phẩm đang xem
                let filtered = normalized.filter(
                    (item) => item.gender === gender && item.id !== excludeId
                );

                // Chỉ giữ tối đa LIMIT_EXPANDED (10) để lần "View all" không cần refetch
                filtered = filtered.slice(0, LIMIT_EXPANDED);

                if (!cancelled) {
                    setRelated(filtered);
                    setVisibleCount(LIMIT_INITIAL); // reset về mặc định mỗi khi đổi gender/excludeId
                }
            } catch (e) {
                if (!cancelled) {
                    setErr(e?.response?.data?.message || e.message || "Fetch failed");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [gender, excludeId]);

    // Giá hiển thị theo rule:
    // - isEnable === false -> "Contact"
    // - isEnable === true  -> min-max từ variants enabled + có price
    const getDisplayPrice = (product) => {
        if (product?.isEnable === false) return "Contact";

        const validVariants = (product?.variants || []).filter(
            (v) => v?.enabled && v?.price != null
        );
        if (!validVariants.length) return "";

        const prices = validVariants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        return min === max ? `${formatPrice(min)}` : `${formatPrice(min)} - ${formatPrice(max)}`;
    };

    const canExpand = related.length > visibleCount; // còn nhiều hơn số đang hiển thị không?

    const handleViewAll = () => {
        setVisibleCount(LIMIT_EXPANDED);
    };

    return (
        <div className="my-24 relative">
            {/* background accent */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-0 h-56 w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-200 via-amber-200 to-rose-200 blur-3xl opacity-30" />
            </div>

            {/* Title */}
            <div className="text-center py-2">
                <div className="inline-flex items-baseline gap-3">
                    <h2 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent">
                        RELATED
                    </h2>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">PRODUCTS</h2>
                <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400" />
            </div>

            {/* Card container */}
            <div className="mt-8 rounded-3xl border border-neutral-200 bg-white/70 backdrop-blur-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {loading && <div className="py-12 text-center text-neutral-500">Loading...</div>}
                {err && <div className="py-12 text-center text-red-500">{err}</div>}

                {/* Grid desktop */}
                {!loading && !err && related.length > 0 && (
                    <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {related.slice(0, visibleCount).map((item) => (
                            <div
                                key={item.id}
                                className="group relative transition-transform duration-300 ease-out hover:-translate-y-1"
                            >
                                <div className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40 bg-gradient-to-r from-orange-300 via-amber-300 to-rose-300" />
                                <div className="relative">
                                    <ProductItem
                                        id={item.id}
                                        name={item.name}
                                        variants={item.variants}
                                        image={item.image}

                                        isEnable={item.isEnable} // 👈 ép “Contact” nếu admin disable

                                    />
                                    {/* Giá hiển thị */}
                                    {/* <div className="mt-2 text-center text-sm font-medium text-neutral-700">
                                        {getDisplayPrice(item) || "—"}
                                    </div> */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !err && related.length === 0 && (
                    <div className="py-12 text-center text-neutral-500">No related products found</div>
                )}
            </div>

            {/* CTA */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleViewAll}
                    disabled={!canExpand}
                    aria-disabled={!canExpand}
                    className={`
      relative inline-flex items-center justify-center px-8 py-3 rounded-full text-base font-semibold
      transition-all duration-300
      ${canExpand
                            ? "bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-white shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        }
    `}
                >
                    {canExpand ? (
                        <span className="flex items-center gap-2">
                            View all
                            <svg
                                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    ) : (
                        "No more"
                    )}
                </button>
            </div>
        </div>
    );
};

export default RelatedProduct;