import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../App";

export default function EditVariant() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    // ----- Prefill nếu đi từ list -----
    const prefill = state?.variantPrefill ?? null;

    // ----- DS product cho dropdown -----
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // ----- Form state -----
    const [variantId, setVariantId] = useState("");
    const [productId, setProductId] = useState("");
    const [sku, setSku] = useState("");
    const [price, setPrice] = useState("");
    const [capacity, setCapacity] = useState("");
    const [stock, setStock] = useState("");
    const [name, setName] = useState("");
    const [img, setImg] = useState("");
    const [productNameFromVariant, setProductNameFromVariant] = useState("");

    // ----- UI state -----
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    // snapshot để so dirty
    const initialRef = useRef(null);

    // helper chuẩn hoá variant
    const normalizeVariant = (v) => {
        if (!v) return null;
        const vid = v?.variant_id ?? v?.variantId ?? v?._id ?? v?.id ?? "";
        const pid =
            v?.product_id ??
            v?.productId ??
            v?.product?.id ??
            v?.product?._id ??
            v?.product?.product_id ??
            "";
        const productName =
            v?.product?.name ?? v?.productName ?? v?.product_title ?? "";

        return {
            id: String(vid),
            productId: pid ? String(pid) : "",
            productName: productName || "",
            sku: v?.sku ?? "",
            price: typeof v?.price === "number" ? v.price : Number(v?.price ?? 0),
            capacity: v?.capacity ?? v?.capacityMl ?? "",
            stock: typeof v?.stock === "number" ? v.stock : Number(v?.stock ?? 0),
            name: v?.name ?? "",
            img: v?.img ?? v?.image ?? v?.thumbnail ?? "",
        };
    };

    // ----- load products cho dropdown -----
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingProducts(true);
                const res = await api.get("/api/product/getAllProduct"); // đổi nếu khác
                const raw = res?.data?.data ?? res?.data ?? [];
                const list = Array.isArray(raw) ? raw : raw.items ?? [];
                const normalized = list
                    .map((p) => {
                        const pid = p?.product_id ?? p?.productId ?? p?._id ?? p?.id;
                        if (!pid) return null;
                        return {
                            product_id: String(pid),
                            name: p?.name ?? p?.title ?? "Unnamed",
                        };
                    })
                    .filter(Boolean);
                if (!mounted) return;
                setProducts(normalized);
            } catch (e) {
                if (!mounted) return;
                toast.error(e?.response?.data?.message || e?.message || "Failed to load products");
            } finally {
                if (mounted) setLoadingProducts(false);
            }
        })();
        return () => { mounted = false; };
    }, []);


    // ----- load variant ban đầu (prefill hoặc API) -----
    useEffect(() => {
        let ignore = false;
        const abort = new AbortController();

        async function run() {
            try {
                setErr("");
                setLoading(true);

                if (prefill) {
                    const nv = normalizeVariant(prefill);
                    if (!nv) throw new Error("Prefill không hợp lệ.");
                    if (ignore) return;

                    setVariantId(nv.id);
                    setProductId(nv.productId || "");
                    setProductNameFromVariant(nv.productName || "");
                    setSku(nv.sku);
                    setPrice(nv.price ?? 0);
                    setCapacity(nv.capacity ?? "");
                    setStock(nv.stock ?? 0);
                    setName(nv.name ?? "");
                    setImg(nv.img ?? "");

                    initialRef.current = nv;
                    setLoading(false);
                    return;
                }

                if (!id) throw new Error("Thiếu tham số id trong URL.");


                const res = await api.get(`/api/productVariant/getVariantById/${encodeURIComponent(id)}`, {
                    signal: abort.signal,
                });
                const data = res?.data?.data ?? res?.data ?? null;
                const nv = normalizeVariant(data);
                if (!nv) throw new Error("Không tìm thấy dữ liệu variant.");
                if (ignore) return;

                setVariantId(nv.id);
                setProductId(nv.productId || "");
                setProductNameFromVariant(nv.productName || "");
                setSku(nv.sku);
                setPrice(nv.price ?? 0);
                setCapacity(nv.capacity ?? "");
                setStock(nv.stock ?? 0);
                setName(nv.name ?? "");
                setImg(nv.img ?? "");

                initialRef.current = nv;
                setLoading(false);
            } catch (e) {
                if (ignore) return;
                console.error(e);
                setErr(
                    e?.response?.data?.message || e?.message || "Không thể tải dữ liệu variant."
                );
                setLoading(false);
            }
        }

        run();
        return () => {
            ignore = true;
            abort.abort();
        };
    }, [id, prefill]);

    // ----- dirty check -----
    const dirty = useMemo(() => {
        const init = initialRef.current;
        if (!init) return false;
        return (
            String(productId) !== String(init.productId || "") ||
            sku !== (init.sku ?? "") ||
            Number(price) !== Number(init.price ?? 0) ||
            String(capacity) !== String(init.capacity ?? "") ||
            Number(stock) !== Number(init.stock ?? 0) ||
            name !== (init.name ?? "") ||
            img !== (init.img ?? "")
        );
    }, [productId, sku, price, capacity, stock, name, img]);

    // ----- submit update -----
    const onSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!variantId) return toast.error("Thiếu id variant.");
        if (!productId) return toast.warn("Vui lòng chọn product.");
        if (!sku.trim()) return toast.warn("Vui lòng nhập SKU.");
        if (price === "" || Number(price) < 0) return toast.warn("Price phải ≥ 0.");
        if (stock === "" || Number(stock) < 0) return toast.warn("Stock phải ≥ 0.");

        try {
            setSaving(true);
            const payload = {
                productId: Number(productId),
                sku: sku.trim(),
                price: Number(price),
                capacity: capacity,
                capacityMl: capacity,
                stock: Number(stock),
                name: name?.trim?.() ?? "",
                img: img ?? "",
            };

            await api.patch(
                `/api/productVariant/updateVariant/${encodeURIComponent(variantId)}`,
                payload
            );

            toast.success("Đã lưu thay đổi.");
            initialRef.current = {
                id: variantId,
                productId: String(productId),
                sku: payload.sku,
                price: payload.price,
                capacity: payload.capacity,
                stock: payload.stock,
                name: payload.name,
                img: payload.img,
            };
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || e?.message || "Lưu thay đổi thất bại.");
        } finally {
            setSaving(false);
        }
    }, [variantId, productId, sku, price, capacity, stock, name, img]);

    const onCancel = useCallback(() => navigate(-1), [navigate]);

    // ---- helper: kiểm tra product hiện tại có nằm trong list dropdown chưa
    const currentProductInList = useMemo(
        () => !!products.find((p) => String(p.product_id) === String(productId)),
        [products, productId]
    );

    return (
        <div className="w-full min-h-screen rounded-3xl border border-white/15 bg-white/5 backdrop-blur-lg p-10 text-white">
            <h1 className="text-4xl font-extrabold tracking-tight mb-8">Edit Variant</h1>

            {loading ? (
                <div className="py-10 text-center text-slate-300 text-xl">Đang tải dữ liệu…</div>
            ) : err ? (
                <div className="py-10 text-center text-red-400">{err}</div>
            ) : (
                <form onSubmit={onSubmit} className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 space-y-8">
                    {/* Product */}
                    <div className="space-y-3">
                        <label className="text-lg font-semibold text-slate-100">Product</label>
                        <div className="relative">
                            <select
                                value={productId || ""}
                                onChange={(e) => setProductId(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-violet-400"
                            >
                                {/* Nếu chưa có productId */}
                                {!productId && <option value="" className="bg-slate-900">-- Select product --</option>}

                                {/* Nếu product hiện tại chưa có trong list (VD: list bị phân trang/role hạn chế), render option tạm để vẫn chọn sẵn */}
                                {productId && !currentProductInList && (
                                    <option value={productId} className="bg-slate-900">
                                        {productNameFromVariant
                                            ? `${productNameFromVariant} (current)`
                                            : `Current product (${productId})`}
                                    </option>
                                )}

                                {/* Danh sách product chuẩn */}
                                {products.map((p) => (
                                    <option key={`prod-${p.product_id}`} value={p.product_id} className="bg-slate-900">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</div>
                        </div>
                        {loadingProducts && <div className="text-sm text-slate-400">Đang tải danh sách sản phẩm…</div>}
                    </div>

                    {/* SKU */}
                    <div className="space-y-3">
                        <label className="text-lg font-semibold text-slate-100">SKU</label>
                        <input
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="SKU code"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>

                    {/* Price */}
                    <div className="space-y-3">
                        <label className="text-lg font-semibold text-slate-100">Price</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>

                    {/* Capacity & Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-lg font-semibold text-slate-100">Capacity</label>
                            <input
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="e.g. 128GB or 500ml"
                                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-lg font-semibold text-slate-100">Stock</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
                                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                            />
                        </div>
                    </div>

                    {/* Optional: Name & Image */}
                    <div className="space-y-3">
                        <label className="text-lg font-semibold text-slate-100">Name (optional)</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Variant name"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-lg font-semibold text-slate-100">Image URL (optional)</label>
                        <input
                            value={img}
                            onChange={(e) => setImg(e.target.value)}
                            placeholder="https://…"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={saving}
                            className="px-7 py-4 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 text-lg transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !variantId ||
                                !productId ||
                                !sku.trim() ||
                                price === "" ||
                                Number(price) < 0 ||
                                stock === "" ||
                                Number(stock) < 0 ||
                                !dirty
                            }
                            className="ml-auto px-8 py-4 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 transition"
                        >
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
