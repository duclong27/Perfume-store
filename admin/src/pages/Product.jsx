import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { api } from '../App'
import { Link } from "react-router-dom"

import { API_ORIGIN, resolveUrl } from '../utils/url';


export default function Products({ }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const matchByIdOrKey = (p, idOrKey) => (p.id ?? p.productId ?? p.__key) === idOrKey;
  const [inflight, setInflight] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const setQuerySafe = (v) => setQuery(v == null ? "" : String(v));




  // helpers
  const toNum = (x, def = 0) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : def;
  };
  const toBool = (x) => x === true || x === 1 || x === "1";


  const makeKey = (raw, idx) =>
    String(
      raw.id ??
      raw.productId ??
      raw.variantId ??
      raw.variant_id ??
      raw.sku ??
      `temp-${idx}`
    );





  function normalizeImagePath(raw) {
    if (!raw) return null;
    const val = Array.isArray(raw) ? raw[0] : raw;
    if (typeof val !== "string") return null;
    let url = val.trim();
    if (!url) return null;

    // Absolute (http/https/data:) → giữ nguyên
    if (/^(https?:\/\/|data:)/i.test(url)) return url;

    // Chuẩn hoá dạng tương đối
    if (url.startsWith("./")) url = url.slice(2);   // "./foo.jpg" -> "foo.jpg"
    if (url.startsWith("images/")) url = "/" + url; // "images/foo.jpg" -> "/images/foo.jpg"

    // Nếu đã là "/images/..." → giữ nguyên
    if (url.startsWith("/images/")) return url;

    // Còn lại coi như filename hoặc path lạ → prefix "/images/", tránh "//"
    return `/images/${url.replace(/^\/+/, "")}`;
  }


  function toImageSrc(imageUrlLike) {
    if (!imageUrlLike) return null;
    // Ghép sang đúng origin backend (API_ORIGIN)
    return resolveUrl(imageUrlLike);
  }




  // --- chuẩn hoá 1 product ---
  const normalizeProduct = (raw, idx) => {
    let skus = [];
    if (Array.isArray(raw?.variants)) {
      if (typeof raw.variants[0] === 'string') {
        skus = raw.variants.filter(Boolean);
      } else {
        skus = raw.variants.map(v => v?.sku).filter(Boolean);
      }
    }
    skus = Array.from(new Set(skus)).sort();


    const imageUrlLike =
      raw.imageUrl ??
      raw.image_url ??
      raw.img ??
      raw.image ??
      (Array.isArray(raw.images) && raw.images[0]) ??
      null;


    const imagePath = normalizeImagePath(imageUrlLike);
    const imageSrc = toImageSrc(imagePath || imageUrlLike);


    return {
      __key: makeKey(raw, idx),
      id: raw.id ?? raw.productId ?? raw._id ?? null,
      name: raw.name ?? '',

      imageUrl: imagePath,
      imageSrc,
      category: raw.category ?? null,
      price: toNum(raw.price, 0),
      isEnable: toBool(raw.isEnable),
      brand: raw.brand ?? raw.brandName ?? null,

      description: raw.description ?? '',
      categoryId: raw.categoryId ?? raw.category ?? null,



      skus,
    };
  };




  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("api/product/getAllProduct");

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data?.data?.items)
                ? data.data.items
                : Array.isArray(data)
                  ? data
                  : [];

        const normalized = list.map(normalizeProduct);
        if (!mounted) return;
        setProducts(normalized);
        setSelected(normalized[0] ?? null);


      } catch (e) {
        console.error("getAllProduct failed", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);





  const toggleIsEnable = async (idOrKey) => {

    const findTarget = (arr) => arr.find((p) => matchByIdOrKey(p, idOrKey));

    const currentList = products;
    const target = findTarget(currentList);

    if (!target) {
      console.warn("toggleIsEnable: target not found for:", idOrKey);
      return;
    }

    const targetKey = target.__key ?? target.id ?? idOrKey;
    if (inflight.has(targetKey)) {

      return;
    }


    const productId = Number(target.id ?? target.productId);
    if (!Number.isFinite(productId) || productId <= 0) {
      console.error("toggleIsEnable: missing/invalid numeric productId for API", target);

      return;
    }

    const nextVal = !target.isEnable;

    setProducts((prev) =>
      prev.map((p) => (matchByIdOrKey(p, idOrKey) ? { ...p, isEnable: nextVal } : p))
    );
    setSelected((prev) =>
      prev && matchByIdOrKey(prev, idOrKey) ? { ...prev, isEnable: nextVal } : prev
    );


    setInflight((s) => new Set(s).add(targetKey));

    try {

      await api.patch(`/api/product/updateIsEnableProduct/${productId}/is-enable`, { isEnable: nextVal });



    } catch (e) {
      console.error("toggleIsEnable failed:", e);


      setProducts((prev) =>
        prev.map((p) => (matchByIdOrKey(p, idOrKey) ? { ...p, isEnable: !nextVal } : p))
      );
      setSelected((prev) =>
        prev && matchByIdOrKey(prev, idOrKey) ? { ...prev, isEnable: !nextVal } : prev
      );


    } finally {
      setInflight((s) => {
        const n = new Set(s);
        n.delete(targetKey);
        return n;
      });
    }
  };





  const deleteProduct = (idOrKey) => {
    setProducts((prev) =>
      prev.filter((p) => (p.id ?? p.__key) !== idOrKey)
    );
    setSelected((prev) => {
      if (!prev) return prev;
      return (prev.id ?? prev.__key) === idOrKey ? null : prev;
    });
  };





  const asText = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v.toLowerCase();
    if (typeof v === "number") return String(v).toLowerCase();
    if (typeof v === "object") {

      return (
        (v.name || v.title || v.label || v.slug || v.code || v.sku || "")
          .toString()
          .toLowerCase()
      );
    }
    return String(v).toLowerCase();
  };

  const idText = (p) =>
    String(p.id ?? p.productId ?? p.__key ?? "").toLowerCase();



  const filteredProducts = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const brand = (typeof p.brand === "string" ? p.brand : "").toLowerCase();
      return name.includes(q) || brand.includes(q);
    });
  }, [products, query]);


  return (
    <div className="flex gap-6 h-full min-h-screen mt-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 w-1/3">
            <Search className="h-5 w-5 text-slate-300" />
            <input
              type="text"
              placeholder="Search products by name or brand…"
              value={query ?? ""}                 // 3) fallback
              onChange={(e) => setQuerySafe(e.target.value)}
              className="bg-transparent outline-none flex-1 text-white placeholder-slate-400"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search products"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuerySafe("")}
                className="text-slate-300 hover:text-white transition"
                aria-label="Clear search"
                title="Clear"
              >
                ×
              </button>
            ) : null}
          </div>
          <Link
            to="/admin/AddProduct"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <table className="w-full text-3xl">
            <thead className="text-slate-300 text-left text-2xl">
              <tr>
                <th className="  pb-4">Name</th>
                <th className="  pr-20">Status</th>
                <th className="" >Category</th>
                <th>Brand</th>
                <th className="  pl-10" >Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(filteredProducts ?? products).map((p, idx) => {
                const rowKey = p.__key ?? String(p.id ?? p.productId ?? idx);
                const prodId = p.id ?? p.productId ?? p.__key;
                const busy = inflight.has(prodId);

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    {/* Tên + ảnh */}
                    <td className="flex items-center gap-3 py-3">
                      {(p.imageSrc || p.imageUrl) ? (
                        <img

                          src={p.imageSrc || resolveUrl(p.imageUrl)}
                          alt={p.name || "Product"}
                          className="h-20 w-20 rounded-md object-contain bg-white/10 p-1"
                          loading="lazy"
                          onError={(e) => {
                            const el = e.currentTarget;

                            const base = typeof p.imageUrl === "string" ? p.imageUrl : "";

                            if (/\.avif(\?.*)?$/i.test(base)) {
                              el.src = resolveUrl(base.replace(/\.avif(\?.*)?$/i, ".webp"));
                              return;
                            }
                            if (/\.webp(\?.*)?$/i.test(base)) {
                              el.src = resolveUrl(base.replace(/\.webp(\?.*)?$/i, ".jpg"));
                              return;
                            }


                            el.onerror = null;
                            el.src = resolveUrl("/images/placeholder.png");
                          }}
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-md bg-gray-700 flex items-center justify-center text-sm text-gray-300">
                          No Image
                        </div>
                      )}

                      <span className="text-white">{p.name || "-"}</span>
                    </td>

                    {/* Toggle isEnable */}
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!p.isEnable}
                        aria-disabled={busy}
                        disabled={busy}
                        title={p.isEnable ? "Đang bật" : "Đang tắt"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIsEnable(prodId);
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition
            ${busy ? "opacity-60 cursor-not-allowed" : ""}
            ${p.isEnable ? "bg-green-500" : "bg-gray-600"}`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform
              ${p.isEnable ? "translate-x-6" : "translate-x-0"}`}
                        />
                      </button>
                    </td>


                    <td className="   text-slate-300">
                      {typeof p.category === "object"
                        ? (p.category?.name ?? p.category?.title ?? p.category?.label ?? "-")
                        : (p.category ?? "-")}
                    </td>

                    {/* Brand */}
                    <td className="text-slate-200">
                      {typeof p.brand === "string" ? p.brand : (p.brandName ?? "-")}
                    </td>


                    {/*Button */}
                    <td className="text-right">

                      <Link
                        to={`/admin/editProduct/${p.id}`}
                        state={{ imageUrl: p.imageUrl, imageSrc: p.imageSrc }}  // 👈 chỉ đổi dòng này
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                        title="Edit product này"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(p.id);
                        }}
                      >
                        Edit
                      </Link>

                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>


      {selected && (
        <div className="w-80 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 space-y-4">
          <h2 className="text-3xl font-semibold">Product Details</h2>
          <div className="inline-block bg-white/10 rounded-xl p-2 mx-auto">
            <img
              src={selected.imageSrc}
              alt={selected.name}
              className="object-contain max-w-full max-h-[80vh] rounded-lg"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = resolveUrl("/images/placeholder.png");
              }}
            />
          </div>

          <p className="text-center text-2xl text-white font-semibold">{selected.name}</p>
          <div className="space-y-2 text-slate-300 text-2xl">

            <div className="flex justify-between items-center">

            </div>
          </div>

          {/* ---- SKUs block ---- */}
          <div className="space-y-3">
            <h3 className="text-slate-300 text-2xl font-semibold">SKUs</h3>
            {Array.isArray(selected.skus) && selected.skus.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.skus.map((sku) => (
                  <span
                    key={sku}
                    className="inline-flex items-center px-3 py-1 rounded-full 
                     bg-gradient-to-r from-indigo-500/40 to-purple-500/40
                     border border-white/10 text-white text-2xl font-mono
                     shadow-sm hover:shadow-md hover:scale-105 
                     transition transform duration-200 ease-out"
                    title={sku}
                  >
                    {sku}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400 italic">Không có SKU</span>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
