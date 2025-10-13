import { useEffect, useState } from "react";
import { api } from '../App'             // đổi path cho đúng dự án của bạn
import { toast } from "react-toastify";

export default function AddVariant() {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [productId, setProductId] = useState("");
    const [sku, setSku] = useState("");
    const [price, setPrice] = useState("");
    const [capacityMl, setCapacityMl] = useState("");
    const [stock, setStock] = useState("");

    const [submitting, setSubmitting] = useState(false);

    // --- Fetch products for dropdown ---
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingProducts(true);
                // ⭐ đổi endpoint này theo backend của bạn
                const res = await api.get("/api/product/getAllProduct");
                const raw = res?.data?.data ?? res?.data ?? [];

                const list = Array.isArray(raw) ? raw : raw.items ?? [];
                console.log("the raw:", JSON.stringify(raw, null, 2));
                console.log("the list:", JSON.stringify(list, null, 2));


     
                const normalized = list
                    .map((p) => {
                        const pid = p?.product_id ?? p?.productId ?? p?._id ?? null;
                        if (!pid) return null; 
                        return {
                            product_id: String(pid),
                            name: p?.name ?? p?.title ?? "Unnamed",
                        };
                    })
                    .filter(Boolean);
                if (!mounted) return;
                setProducts(normalized);
                if (normalized[0]) setProductId(normalized[0].id);
            } catch (e) {
                if (!mounted) return;
                toast.error(
                    e?.response?.data?.message || e?.message || "Failed to load products"
                );
            } finally {
                if (mounted) setLoadingProducts(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);


    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // validate
        if (!productId) return toast.error("Please select a product");
        if (!sku.trim()) return toast.error("SKU is required");
        if (capacityMl === "" || Number(capacityMl) < 0) return toast.error("Capacity must be provided");
        if (price === "" || Number(price) < 0) return toast.error("Price must be ≥ 0");
        if (stock === "" || Number(stock) < 0) return toast.error("Stock must be ≥ 0");

        setSubmitting(true);
        try {
            const payload = {
                productId: Number(productId),  
                sku: sku.trim(),
                price: Number(price),
                capacityMl: Number(capacityMl),
                stock: Number(stock),
            };

            console.log("Submitting payload:", payload);


            // ⭐ đổi endpoint theo backend của bạn
            const res = await api.post("/api/productVariant/addVariantProduct", payload);
            const created = res?.data?.data ?? payload;

            toast.success("Variant created successfully 🎉");

            // reset nhẹ
            setSku("");
            setPrice("");
            setCapacityMl("");
            setStock("");
            // giữ nguyên productId để tiện tạo tiếp
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to create variant";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen rounded-3xl border border-white/15 bg-white/5 backdrop-blur-lg p-10 text-white">
            <h1 className="text-4xl font-extrabold tracking-tight text-center mb-10">
                Add Variant
            </h1>

            <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6"
            >
                {/* Product */}
                <div className="space-y-2">
                    <label className="text-lg font-medium text-slate-200">Product</label>
                    <div className="relative">
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-violet-400"
                        >
                            {products.map((p) => (
                                <option
                                    key={`prod-${p.product_id}`}      // 👈 luôn unique & không undefined
                                    value={p.product_id}              // 👈 đúng id DB
                                    className="bg-slate-900"
                                >
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        {/* caret */}
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                            ▾
                        </div>
                    </div>
                </div>

                {/* SKU */}
                <div className="space-y-2">
                    <label className="text-lg font-medium text-slate-200">SKU</label>
                    <input
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="SKU code"
                        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                    />
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <label className="text-lg font-medium text-slate-200">Price</label>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-300"></span>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>
                </div>

                {/* Capacity & Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-lg font-medium text-slate-200">Capacity</label>
                        <input
                            value={capacityMl}
                            onChange={(e) => setCapacityMl(e.target.value)}
                            placeholder="e.g. 128GB"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-lg font-medium text-slate-200">Stock</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={submitting || !productId || !sku.trim()}
                        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition font-semibold disabled:opacity-50"
                    >
                        {submitting ? "Adding..." : "Add"}
                    </button>
                </div>
            </form>
        </div>
    );
}
