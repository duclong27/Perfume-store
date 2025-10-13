import React, { useEffect, useState } from "react";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { api } from "../App.jsx"; // axios instance trong app.jsx

/* ===================== Helpers ===================== */
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

  // Ảnh: ưu tiên product, fallback ảnh variant đầu tiên
  const image =
    p.image ?? p.imageUrl ?? p.image_url ?? variants.find((v) => v.imageUrl)?.imageUrl ?? null;

  // sort helper
  const createdAt = p.createdAt ?? p.created_at ?? null;
  const createdTs = createdAt ? Date.parse(createdAt) || 0 : 0;

  // lấy isEnable để FE ép "Contact"
  const isEnable = toBool(p.isEnable ?? p.enabled ?? p.active, true);

  return { id, name, image, variants, createdTs, isEnable };
};

/* ===================== Component ===================== */
const BestSeller = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/v1/getAllProducts");
        const raw = data?.items ?? data?.data ?? [];
        console.log("[BestSeller] fetched:", Array.isArray(raw) ? raw.length : 0);

        const normalized = (Array.isArray(raw) ? raw : []).map(normalizeProduct);
        console.log("[BestSeller] normalized:", normalized.length);

        // ⛳️ THỨ TỰ NGƯỢC LATEST: createdTs ASC (cũ → mới), tie-breaker id ASC
        const sorted = normalized.sort((a, b) => {
          if (a.createdTs !== b.createdTs) return a.createdTs - b.createdTs; // asc
          const aId = toNumber(a.id, null);
          const bId = toNumber(b.id, null);
          return aId != null && bId != null ? aId - bId : 0; // asc
        });

        const limited = sorted.slice(0, 10);
        console.log("[BestSeller] final:", limited.length);

        if (!cancel) setItems(limited);
      } catch (e) {
        console.error("[BestSeller] error:", e);
        if (!cancel) setErr(e?.response?.data?.message || e.message || "Fetch failed");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
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
    <div className="my-10" id="bestSellers">
      <div className="text-center text-3xl py-8">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Top picks — curated from our collection.
        </p>
      </div>

      {/* Rendering products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {items.map((p) => (
          <ProductItem
            key={p.id}
            id={p.id}
            image={p.image}
            name={p.name}
            variants={p.variants}   // ProductItem tự hiển thị min–max
            isEnable={p.isEnable}    // 👈 ép “Contact” nếu admin disable
          />
        ))}
      </div>
    </div>
  );
};

export default BestSeller;
