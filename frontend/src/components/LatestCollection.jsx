import React, { useEffect, useState } from "react";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { api } from "../App.jsx"; // axios instance từ app.jsx

/* ============== Helpers: number & normalize ============== */
const toNumber = (val, fb = null) => {
  if (val === "" || val == null) return fb;
  const n = Number(val);
  return Number.isFinite(n) ? n : fb;
};

const toBool = (v, fb = true) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return fb;
};

const normalizeVariant = (v = {}) => ({
  price: toNumber(v.price, null),
  capacityMl:
    toNumber(v.capacityMl, null) ??
    toNumber(v.capacity_ml, null) ??
    toNumber(v.capacity, null) ??
    null,
  imageUrl: v.imageUrl ?? v.image_url ?? v.image ?? null,
});

const normalizeProduct = (p = {}) => {
  const id = p.id ?? p.productId ?? p.product_id ?? p._id;
  const name = p.name ?? p.productName ?? p.product_title ?? "Unnamed";

  const variants = (Array.isArray(p.variants) ? p.variants : []).map(normalizeVariant);


  const image =
    p.image ?? p.imageUrl ?? p.image_url ?? variants.find((v) => v.imageUrl)?.imageUrl ?? null;

  // mốc thời gian để sort “mới nhất”
  const createdAt = p.createdAt ?? p.created_at ?? null;
  const createdTs = createdAt ? Date.parse(createdAt) || 0 : 0;


  const isEnable = toBool(p.isEnable ?? p.enabled ?? p.active, true);

  return { id, name, image, variants, createdTs, isEnable };
};

const normalizeProducts = (arr = []) => arr.map(normalizeProduct);

/* ============== Component ============== */
const LatestCollection = () => {
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Fetch tất cả, chuẩn hoá, sort mới nhất, cắt 10
        const { data } = await api.get("/api/v1/getAllProducts");
        const raw = data?.items ?? data?.data ?? [];
        const normalized = normalizeProducts(raw);

        // Sort: createdAt desc → fallback id desc (nếu id là số)
        const sorted = normalized.sort((a, b) => {
          if (b.createdTs !== a.createdTs) return b.createdTs - a.createdTs;
          const aId = toNumber(a.id, null);
          const bId = toNumber(b.id, null);
          return bId != null && aId != null ? bId - aId : 0;
        });

        const limited = sorted.slice(0, 10);
        if (!cancelled) setLatestProducts(limited);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message || "Fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="py-16 text-center text-xl">Loading…</div>;
  if (err)
    return (
      <div className="py-16 text-center">
        <p className="text-red-500">Error: {err}</p>
      </div>
    );

  return (
    <div className="my-10" id="latestCollection">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTIONS"} />
        <p className="lora-regular w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover the refinement in every note, gentle yet profound.
        </p>
      </div>

      {/* Rendering products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {latestProducts.map((item) => (
          <ProductItem
            key={item.id}
            id={item.id}
            image={item.image}
            name={item.name}
            variants={item.variants} // ProductItem tự hiển thị min–max
            isEnable={item.isEnable} // 👈 ép “Contact” nếu admin disable
             
          />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;
