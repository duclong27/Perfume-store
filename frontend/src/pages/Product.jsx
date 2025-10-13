import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProduct from "../components/RelatedProduct";
import ProductDescriptionReviewsLite from "@/components/productDescription";

import { api } from "../App.jsx";
import { useCart } from "../context/CartContext";   // ✅ thay thế /// fix


/* ----------------- helpers (rút gọn) ----------------- */
const ensureNum = (v, def = null) => {
    if (v === undefined || v === null || v === "") return def;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};
const toBool = (v, def = true) => {
    if (v === undefined || v === null) return def;
    if (typeof v === "boolean") return v;
    return ["true", "1", "yes", "y", "enabled", "on"].includes(String(v).toLowerCase()) ? true
        : ["false", "0", "no", "n", "disabled", "off"].includes(String(v).toLowerCase()) ? false
            : def;
};
const formatPrice = (n) => (n == null ? "" : new Intl.NumberFormat("vi-VN").format(n));

/* --------------- normalize (đưa về capacityMl) --------------- */
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
    const variants = Array.isArray(p.variants) ? p.variants.map(normalizeVariant) : [];
    const image =
        p.image ?? p.imageUrl ?? p.image_url ?? variants.find(v => v.imageUrl)?.imageUrl ?? null;

    return {
        id: p.id ?? p.productId ?? p.product_id ?? p._id,
        name: p.name ?? p.productName ?? p.product_title ?? "Unnamed",
        description: p.description ?? null,
        gender: p.gender ?? null,
        image,
        isEnable: toBool(p.isEnable ?? p.enabled ?? p.active, true),
        variants,
        raw: p,
    };
};

const Product = () => {
    const { currency } = useContext(ShopContext);
    const { productId } = useParams();
    const { addToCart, isWorking: isCartWorking } = useCart();   //// fix

    const [productData, setProductData] = useState(null);
    const [capacity, setCapacity] = useState("");
    // const [activeTab, setActiveTab] = useState("desc");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
   


    const selectedVariant = useMemo(() => {
        if (!productData?.variants?.length) return null;
        return (
            productData.variants.find(v => String(v.capacityMl) === String(capacity)) ??
            productData.variants[0]
        );
    }, [productData, capacity]);

    const displayPrice = useMemo(() => {
        if (productData?.isEnable === false) return "Contact";
        const p = selectedVariant?.price;
        return p != null ? new Intl.NumberFormat("vi-VN").format(p) : "";
    }, [selectedVariant, productData]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr("");
                const { data } = await api.get(`/api/v1/getProductById/${productId}`);
                const raw = data?.item ?? data?.data ?? data;
                const normalized = normalizeProduct(raw || {});
                if (cancelled) return;

                const validVariants = (normalized.variants || []).filter(v => v.capacityMl != null);
                const nextProduct = { ...normalized, variants: validVariants };
                setProductData(nextProduct);
                setCapacity(validVariants[0]?.capacityMl ?? "");
            } catch (e) {
                if (!cancelled) setErr(e?.response?.data?.message || e.message || "Fetch failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [productId]);



    /* ------------------------------- UI gốc giữ nguyên ------------------------------- */
    return (
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
            {loading && <div className="mb-4 text-2xl text-neutral-500">Loading product…</div>}
            {!!err && <div className="mb-4 text-2xl text-red-600">{err}</div>}

            {/* Product Section */}
            <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
                {/* Left Section: Images */}
                <div className="  rounded-3xl bg-black backdrop-blur-md border border-white/10 p-8 sm:p-4 max-w-fit mx-auto items-center justify-center">
                    <img
                        src={productData?.image}
                        className=" w-full h-full max-w-[520px] aspect-[6/8] object-cover rounded-2xl shadow-2xl"
                        alt="Main Product"
                    />
                </div>

                {/* Right Section: Product Details */}
                <div className=" p-5 sm:p-7 lg:p-8">
                    <h1 className=" font-medium text-7xl mt-2">{productData?.name}</h1>

                    <div className=" mt-8 flex items-center gap-1 mt-2">
                        <img src={assets.star_icon} className="w-5.5" alt="Star" />
                        <img src={assets.star_icon} className="w-5.5" alt="Star" />
                        <img src={assets.star_icon} className="w-5.5" alt="Star" />
                        <img src={assets.star_icon} className="w-5.5" alt="Star" />
                        <img src={assets.star_icon} className="w-5.5" alt="Star" />
                    </div>

                    <p className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100 
                    px-6 py-3 text-5xl font-semibold text-neutral-900 shadow-md ring-1 ring-inset ring-orange-200">
                        <span>
                            {productData?.isEnable === false ? "Contact" : displayPrice}
                        </span>
                        <span className="text-3xl font-medium text-neutral-700">
                            {productData?.isEnable === false ? "" : currency}
                        </span>
                    </p>

                    <p className="mt-5 lora-regular text-2xl text-gray-500">{productData?.description}</p>

                    {/* Capacity selector: dùng capacityMl từ variants */}
                    <div className="flex lora-regular text-3xl flex-col gap-4 my-8">
                        <p className="lora-regular text-2xl md:text-3xl font-semibold text-black tracking-wide">
                            ✨ Select Capacity
                        </p>
                        <div className="flex  flex-wrap gap-8">
                            {productData?.variants?.map((variant, index) => {
                                const selected = String(variant.capacityMl) === String(capacity);
                                return (
                                    <button
                                        key={variant.variant_id ?? index}
                                        onClick={() => {
                                            setCapacity(variant.capacityMl); // ✅ chọn capacityMl sẽ đổi selectedVariant → đổi giá
                                            // Nếu muốn giữ state `price` cũ:
                                            // setPrice(variant.price);
                                        }}
                                        className={`relative  rounded-full w-16 h-16 border flex items-center justify-center select-none
                                text-base font-medium
                                transition-all duration-300 ease-out
                                focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300
                                ${selected
                                                ? 'bg-orange-50 border-orange-500 ring-4 ring-orange-200 shadow-[0_8px_24px_rgba(249,115,22,0.35)] scale-105'
                                                : 'bg-white border-gray-200 hover:shadow-md hover:scale-105 active:scale-95'
                                            }`}
                                        aria-pressed={selected}
                                    >
                                        <span className={`transition-colors lora-regular text-xl ${selected ? 'text-orange-600' : 'text-gray-700'}`}>
                                            {variant.capacityMl} ml
                                        </span>

                                        {selected && (
                                            <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse ring-2 ring-orange-200"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                  

                    <button
                        onClick={async () => {
                            if (!selectedVariant) return;
                            try {
                                await addToCart({ variantId: selectedVariant.variant_id, qty: 1 }); // ✅
                                // toast.success("Đã thêm vào giỏ");
                                console.log("Added to cart");
                            } catch (e) {
                                // toast.error(e?.response?.data?.message || "Thêm vào giỏ thất bại");
                                console.error(e);
                            }
                        }}
                        disabled={productData?.isEnable === false || !selectedVariant || isCartWorking}
                        className="w-full px-8 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-lg md:text-xl tracking-wide shadow-md hover:from-yellow-500 hover:to-yellow-600 hover:scale-105 hover:shadow-xl transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isCartWorking ? "Đang thêm…" : "ADD TO CART"}
                    </button>
                    {/* …các phần còn lại giữ nguyên, chỉ đổi chỗ hiển thị giá dùng `currency` local */}


                    <hr className="mt-10 sm:w-5/5" />

                    <div className=" text-2xl  text-gray-500 mt-6 flex flex-col gap-1">
                        <p>✅ 100% Original product.</p>
                        <p>💵 Cash on delivery available.</p>
                        <p>🔄 Easy return & exchange within 7 days.</p>
                    </div>
                </div>
            </div>

            {/* Review + Desc & Related giữ nguyên */}
            <ProductDescriptionReviewsLite
                productId={productId}
                api={api}
                assets={assets}
            />

            {/* ...phần tabs và nội dung của bạn như cũ... */}

            <RelatedProduct gender={productData?.gender} />
        </div>
    );
};

export default Product;