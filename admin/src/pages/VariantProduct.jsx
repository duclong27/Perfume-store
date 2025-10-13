import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Pencil, Loader2 } from "lucide-react";
import { api } from "../App";
import { toast } from "react-toastify";

export default function VariantProduct({
    onEdit
}) {


    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [query, setQuery] = useState("");



    const [selectedId, setSelectedId] = useState(null)



    const normalizeVariant = (v, idx) => {
        const variant_id =
            v?.variant_id ?? v?.variantId ?? v?._id ?? v?.id ?? String(idx + 1);

        const product_id =
            v?.product_id ??
            v?.productId ??
            v?.product?._id ??
            v?.product?.id ??
            v?.product?.product_id ??
            null;

        const product_name =
            v?.product?.name ??
            v?.productName ??
            v?.product_title ??
            null;

        return {
            id: String(variant_id),
            variant_id: String(variant_id),


            productId: product_id ? String(product_id) : "",
            productName: product_name ?? "",

            sku: v?.sku ?? "",
            price: typeof v?.price === "number" ? v.price : Number(v?.price ?? 0),
            capacityMl: typeof v?.capacityMl === "number" ? v.capacityMl : Number(v?.capacityMl ?? 0),
            // capacityMl: v?.capacityMl ?? v?.capacity ?? "",
            stock: typeof v?.stock === "number" ? v.stock : Number(v?.stock ?? 0),
            img: v?.img ?? v?.image ?? v?.thumbnail ?? null,
            name: v?.name ?? null,
        };
    };

    // ----- fetch all variants -----
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setErr("");
            try {
                const res = await api.get("/api/productVariant/getAllVariantProduct");
                const raw = res?.data?.data ?? res?.data ?? [];
                const list = Array.isArray(raw) ? raw : raw.items ?? [];

                const normalized = list.map(normalizeVariant);
                console.log("productVariants :" + normalized.length)
                if (!mounted) return;
                setVariants(normalized);

            } catch (e) {
                if (!mounted) return;
                setErr(e?.response?.data?.message || e?.message || "Failed to load variants");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // ----- filter (optional, giống category) -----
    const filtered = useMemo(() => {
        if (!query.trim()) return variants;
        const q = query.toLowerCase();
        return variants.filter(v =>
            (v.sku || "").toLowerCase().includes(q) ||
            String(v.capacityMl || "").toLowerCase().includes(q)
        );
    }, [variants, query]);


    const fmtPrice = (p) =>
        Number.isFinite(p) ? p.toFixed(2) : (p || "0.00");


    return (
        <div className="rounded-3xl w-full min-h-screen border border-white/15 bg-white/5 backdrop-blur-lg p-8 text-white">
            {/* Header row + Add */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold tracking-tight mb-6">Variant Details</h2>

                <div className=" flex items-center gap-3">
                    {/* (tuỳ chọn) ô search nhẹ */}
                    <div className="text-2xl hidden md:flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                        <Search className="w-5 h-5 text-white/70" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search SKU or Capacity..."
                            className="bg-transparent outline-none text-white placeholder-slate-400 flex-1"
                        />
                    </div>

                    <Link
                        to="/admin/AddVariant"
                        className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        Add Variant
                    </Link>
                </div>
            </div>

            {/* Table-like container */}
            <div className="w-full overflow-hidden rounded-2xl border border-white/10">
                {/* header */}
                <div className="grid grid-cols-5 gap-0 bg-white/5 text-slate-300 text-3xl px-9 py-7">
                    <div>SKU</div>
                    <div>Price ($)</div>
                    <div>Capacity (ml) </div>
                    <div>Stock</div>
                    <div className=" text-center">Action</div>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 px-9 py-7 text-slate-300">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading variants…
                    </div>
                ) : err ? (
                    <div className="px-9 py-7 text-red-400">{err}</div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {filtered.map((v, idx) => (
                            <div
                                key={v.id ?? idx}
                                className="grid grid-cols-5 gap-3 px-6 py-4 items-center text-3xl hover:bg-white/5"
                            >
                                {/* SKU (box hiển thị, giữ nguyên kích thước như input) */}
                                <div
                                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white truncate"
                                    title={v.sku || "-"}
                                >
                                    {v.sku || "-"}
                                </div>

                                {/* Price box (không căn phải container) */}
                                <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white flex items-center gap-1">
                                    <span className="text-slate-300">$</span>
                                    <span>{fmtPrice(v.price)}</span>
                                </div>

                                {/* Capacity */}
                                <div
                                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white truncate"
                                    title={v.capacityMl || "-"}
                                >
                                    {v.capacityMl || "-"}
                                </div>

                                {/* Stock */}
                                <div
                                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white"
                                    title={String(v.stock ?? 0)}
                                >
                                    {v.stock ?? 0}
                                </div>

                                {/* Edit */}
                                <Link
                                    to={`/admin/editVariant/${encodeURIComponent(v.id)}`}
                                    state={{ variantPrefill: v }}
                                    className="text-3xl py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition text-center"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit?.(v);
                                    }}
                                    title="Edit variant này"
                                >
                                    Edit
                                </Link>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="px-9 py-7 text-center text-slate-400">
                                No variants
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
