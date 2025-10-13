import React, { useState, useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import { api } from "../App.jsx"; // axios instance trong app.jsx

/* ---------- helpers chung ---------- */
const ensureNum = (val, fallback = null) => {
    if (val === "" || val === null || val === undefined) return fallback;
    const n = Number(val);
    return Number.isNaN(n) ? fallback : n;
};

const toBool = (v, fallback = true) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (["true", "1", "yes"].includes(s)) return true;
        if (["false", "0", "no"].includes(s)) return false;
    }
    return fallback;
};

const formatCurrency = (n) => {
    if (n === null || n === undefined) return "—";
    try {
        return n.toLocaleString("vi-VN");
    } catch {
        return String(n);
    }
};

const formatPriceRange = (min, max) => {
    if (min == null && max == null) return "—";
    if (min == null) return formatCurrency(max);
    if (max == null) return formatCurrency(min);
    return min === max
        ? formatCurrency(min)
        : `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

/* ---------- normalize ---------- */
const normalizeVariant = (v = {}) => {
    const capacityMl =
        ensureNum(v.capacityMl, undefined) ??
        ensureNum(v.capacity_ml, undefined) ??
        ensureNum(v.capacity, undefined) ??
        null;

    return {
        variantId: v.variantId ?? v.variant_id ?? v.id ?? v._id ?? null,
        sku: v.sku ?? null,
        capacityMl,
        price: ensureNum(v.price, null),
        stock: ensureNum(v.stock, 0),
        imageUrl: v.imageUrl ?? v.image_url ?? v.image ?? null,
    };
};

const normalizeProduct = (p = {}) => {
    const id = p.id ?? p.productId ?? p.product_id ?? p._id;
    const name = p.name ?? p.productName ?? p.product_title ?? "Unnamed";
    const gender = p.gender ?? null;

    // ⚠️ lấy isEnable từ API (mặc định true nếu không có)
    const isEnable = toBool(p.isEnable ?? p.enabled ?? p.active, true);

    const rawVariants = Array.isArray(p.variants) ? p.variants : [];
    const variants = rawVariants.map(normalizeVariant);

    // Tính giá min/max từ tất cả variants
    const priceList = variants
        .map((v) => ensureNum(v.price, null))
        .filter((n) => n != null);

    // fallback nếu không có variants: dùng p.price nếu có
    if (!priceList.length && p.price != null) {
        priceList.push(ensureNum(p.price, null));
    }

    let priceMin = priceList.length ? Math.min(...priceList) : null;
    let priceMax = priceList.length ? Math.max(...priceList) : null;

    // Label mặc định theo min/max
    let priceLabel = formatPriceRange(priceMin, priceMax);

    // ⛳️ Nếu product bị disable → luôn hiển thị "Contact"
    if (isEnable === false) {
        priceMin = null;
        priceMax = null;
        priceLabel = "Contact";
    }

    // Stock tổng
    const stock =
        variants.length > 0
            ? variants.reduce((s, v) => s + (ensureNum(v.stock, 0) || 0), 0)
            : ensureNum(p.stock, 0);
    const inStock = stock > 0;

    // Ảnh: ưu tiên product.imageUrl, fallback variant.imageUrl
    const image =
        p.image ?? p.imageUrl ?? p.image_url ?? variants.find((v) => v.imageUrl)?.imageUrl ?? null;

    return {
        id,
        name,
        gender,
        description: p.description ?? null,
        image,
        isEnable,         // 👈 quan trọng: truyền xuống FE
        priceMin,
        priceMax,
        priceLabel,       // đã ép "Contact" nếu disable
        stock,
        inStock,
        variants,
    };
};

const normalizeProducts = (arr = []) => arr.map(normalizeProduct);

/* ---------- filter/sort ---------- */
const filterBySearch = (items, q) => {
    if (!q) return items;
    const s = String(q).toLowerCase();
    return items.filter((p) => (p.name || "").toLowerCase().includes(s));
};

const filterByGender = (items, genders) => {
    if (!genders?.length) return items;
    return items.filter((p) => p.gender && genders.includes(p.gender));
};

const filterByCapacity = (items, caps) => {
    if (!caps?.length) return items;
    return items.filter(
        (p) =>
            Array.isArray(p.variants) &&
            p.variants.some((v) => caps.includes(ensureNum(v.capacityMl)))
    );
};

const sortProducts = (items, sortType) => {
    const copy = items.slice();
    switch (sortType) {
        case "low-high":
            // sản phẩm Contact (priceMin=null) sẽ rơi về cuối
            return copy.sort(
                (a, b) => (a.priceMin ?? Infinity) - (b.priceMin ?? Infinity)
            );
        case "high-low":
            // sản phẩm Contact (priceMax=null) sẽ rơi về cuối
            return copy.sort(
                (a, b) => (b.priceMax ?? -Infinity) - (a.priceMax ?? -Infinity)
            );
        default:
            return copy; // "relevant"
    }
};


const Collection = () => {
    const { search, showSearch } = useContext(ShopContext);

    const [showFilter, setShowFilter] = useState(false);
    const [sortType, setSortType] = useState("relevant");
    const [gender, setGender] = useState([]);
    const [capacity, setCapacity] = useState([]);

    const [products, setProducts] = useState([]); // từ DB (đã normalize)
    const [filterProducts, setFilterProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const toggleGender = (e) => {
        const val = e.target.value;
        setGender((prev) =>
            prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
        );
    };

    const toggleCapacity = (e) => {
        const val = Number(e.target.value);
        setCapacity((prev) =>
            prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
        );
    };

    // Fetch DB
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/api/v1/getAllProducts");
                const raw = data?.items ?? data?.data ?? [];
                const normalized = normalizeProducts(raw);
                if (!cancelled) {
                    setProducts(normalized);
                    const initial = sortProducts(
                        filterByCapacity(
                            filterByGender(filterBySearch(normalized, search), gender),
                            capacity
                        ),
                        sortType
                    );
                    setFilterProducts(initial);
                }
            } catch (e) {
                if (!cancelled)
                    setErr(e?.response?.data?.message || e.message || "Fetch failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-apply filters/sort
    useEffect(() => {
        const shaped = sortProducts(
            filterByCapacity(
                filterByGender(filterBySearch(products, search), gender),
                capacity
            ),
            sortType
        );
        setFilterProducts(shaped);
    }, [products, search, showSearch, gender, capacity, sortType]);

    if (loading) return <div className="py-16 text-center text-xl">Loading…</div>;
    if (err)
        return (
            <div className="py-16 text-center">
                <p className="text-red-500">Error: {err}</p>
            </div>
        );

    return (
        <div className="mb-10 flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
            {/* Filter options */}
            <div className="min-w-60">
                <p
                    onClick={() => setShowFilter(!showFilter)}
                    className="my-2 text-4xl flex items-center cursor-pointer gap-2"
                >
                    FILTERS
                    <img
                        className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
                        src={assets.dropdown_icon}
                        alt=""
                    />
                </p>

                {/* Gender Filter */}
                <div
                    className={`border bg-black border-gray-300 p1-5 px-4 py-3 mt-6 rounded-2xl ${showFilter ? "" : "hidden"
                        } sm:block`}
                >
                    <p className="mb-3 text-2xl lora-regular font-medium text-white">
                        CATEGORIES
                    </p>
                    <div className="flex flex-col gap-3 text-2xl font-light text-white">
                        {["Man", "Woman", "Unisex"].map((g) => (
                            <p className="flex" key={g}>
                                <input
                                    id={`cat-${g.toLowerCase()}`}
                                    className="peer sr-only"
                                    type="checkbox"
                                    onChange={toggleGender}
                                    value={g}
                                />
                                <label
                                    htmlFor={`cat-${g.toLowerCase()}`}
                                    className="w-full cursor-pointer select-none rounded-full px-4 py-2
                    bg-neutral-900/80 border border-white/10 shadow-md
                    transition
                    peer-checked:bg-neutral-800 peer-checked:border-white/20
                    peer-checked:shadow-lg"
                                >
                                    {g === "Man" ? "Men" : g === "Woman" ? "Women" : "Unisex"}
                                </label>
                            </p>
                        ))}
                    </div>
                </div>

                {/* Capacity Filter */}
                <div
                    className={`border bg-black border-gray-300 p1-5 px-4 py-3 mt-6 rounded-2xl ${showFilter ? "" : "hidden"
                        } sm:block`}
                >
                    <p className="mb-3 text-2xl text-white lora-regular font-medium">
                        Capacity
                    </p>
                    <div className="flex flex-col gap-3 text-2xl font-light text-white">
                        {[50, 100, 150].map((cap) => (
                            <p className="flex" key={cap}>
                                <input
                                    id={`cap-${cap}`}
                                    className="peer sr-only"
                                    type="checkbox"
                                    onChange={toggleCapacity}
                                    value={String(cap)}
                                />
                                <label
                                    htmlFor={`cap-${cap}`}
                                    className="w-full cursor-pointer select-none rounded-full px-4 py-2
                    bg-neutral-900/80 border border-white/10 shadow-md
                    transition
                    peer-checked:bg-neutral-800 peer-checked:border-white/20
                    peer-checked:shadow-lg"
                                >
                                    {cap} ml
                                </label>
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div className="flex-1">
                <div className="flex justify-between text-base sm:text-4xl mb-4">
                    <Title text1={"ALL"} text2={"COLLECTIONS"} />
                    <select
                        onChange={(e) => setSortType(e.target.value)}
                        className="border-2 border-gray-300 text-xl px-2"
                        value={sortType}
                    >
                        <option value="relevant">Sort by: Relevant</option>
                        <option value="low-high">Sort by: Low to High</option>
                        <option value="high-low">Sort by: High to Low</option>
                    </select>
                </div>

                {/* Map Products */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
                    {filterProducts.map((item, index) => (
                        <ProductItem
                            key={item.id ?? index}
                            id={item.id}
                            image={item.image}
                            name={item.name}
                            variants={item.variants}
                            priceMin={item.priceMin}
                            priceMax={item.priceMax}
                            priceLabel={item.priceLabel}
                            isEnable={item.isEnable} // 👈 hiển thị đúng “min - max” hoặc 1 giá
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Collection;
