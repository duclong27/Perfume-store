import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Trash2 } from "lucide-react";
import { api } from '../App'
import { toast } from 'react-toastify';

const placeholderColors = [
  "bg-violet-500/30",
  "bg-indigo-500/30",
  "bg-fuchsia-500/30",
  "bg-sky-500/30",
  "bg-emerald-500/30",
  "bg-amber-500/30",
];

export default function Categories() {

  const [categories, setCategories] = useState([]); // ✅ mảng rỗng
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  // util: lấy chữ cái đầu cho avatar fallback
  const initialOf = (name = "") =>
    (name.trim()[0] || "?").toUpperCase();

  // util: chuẩn hóa 1 item theo cấu trúc UI cần
  const normalizeCategory = (item) => {
    // Ưu tiên đúng khóa từ DB
    const category_id =
      item?.category_id ?? item?.categoryId ?? item?.CategoryId ?? item?._id ?? item?.id;

    if (!category_id) {
      console.warn("Missing category_id on item:", item);
    }

    return {
      id: category_id,                // UI dùng id này = category_id thật
      category_id,                    // giữ riêng để gọi API
      name: item?.name ?? "Unnamed",
      description: item?.description ?? "",
      products: Number(item?.products ?? item?.productCount ?? item?.count ?? 0),
      img: item?.img ?? item?.image ?? item?.thumbnail ?? null,
    };
  };


  // gọi API getAllCategory khi mount
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setErr("");
      try {
        // 👉 sửa path này cho khớp backend của bạn
        const res = await api.get("/api/category/getAllCategories");
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : raw.items ?? [];
        const normalized = list.map(normalizeCategory);

        if (!mounted) return;
        setCategories(normalized);
        setSelected(normalized[0] ?? null);
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setErr(
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load categories"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);




  const deleteCategory = async (id) => {
    if (!id) return;

    try {
      console.log("Deleting category_id:", id);
      await api.delete(`/api/category/deleteCategory/${id}`);

      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);

      toast.success("Category deleted successfully ✅");
    } catch (err) {
      console.error("Delete error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete category";
      toast.error(msg);
    }
  };

  // filter for sreach bar
  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
    );
  }, [categories, query]);


  // màu placeholder avatar ổn định theo id
  const colorOf = (id) => {
    if (id == null) return placeholderColors[0];
    const idx = Number.isFinite(+id) ? +id : [...String(id)].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return placeholderColors[idx % placeholderColors.length];
  };

  return (
    <div className="flex gap-6 h-full min-h-screen">
      {/* LEFT: main content */}
      <div className="flex-1 space-y-6">
        {/* Top bar (search + add) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 w-1/3">
            <Search className="h-5 w-5 text-slate-300" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-white placeholder-slate-400"
            />
          </div>
          <Link
            to="/admin/AddCategory"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </Link>
        </div>

        {/* Categories table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>

          {loading ? (
            <div className="py-10 text-center text-slate-400">
              Loading categories…
            </div>
          ) : err ? (
            <div className="py-10 text-center text-red-400">{err}</div>
          ) : (
            <table className="w-full text-left">
              <thead className="text-slate-300 text-3xl">
                <tr>
                  <th className="pb-2">Name</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredCategories.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    <td className="flex items-center text-2xl gap-3 py-3">
                      {c.img ? (
                        <img
                          src={c.img}
                          alt={c.name}
                          className="h-10 w-10 rounded-md object-contain bg-white/10 p-1"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md grid place-items-center bg-violet-500/30 text-white">
                          <span className="font-semibold">
                            {c.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-white text-2xl font-medium">
                        {c.name}
                      </span>
                    </td>
                    <td className="text-slate-300 text-2xl">
                      {c.description}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(c.id);
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-6 text-center text-slate-400"
                    >
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT: Category details */}
      {selected && (
        <div className="w-110 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 space-y-4">
          <h2 className=" text-3xl text-center font-semibold ">Category Details</h2>

          {selected.img ? (
            <img
              src={selected.img}
              alt={selected.name}
              className="w-full h-96 object-contain bg-white/10 rounded-xl p-4 mx-auto"
            />
          ) : (
            <div
              className={`w-full h-96 rounded-xl grid place-items-center mx-auto ${colorOf(
                selected.id
              )}`}
            >
              <span className="text-8xl font-bold text-white">
                {initialOf(selected.name)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className=" w-full h-full text-5xl text-center text-white font-semibold">
              {selected.name}
            </div>
            <p className="text-slate-300 text-4xl text-center">
              {selected.description}
            </p>
          </div>

          <div className="space-y-2 text-slate-300 text-sm">
            <div className="flex justify-between">
              <span>Products</span>
              <span className="text-white">{selected.products}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Link
              to={`/admin/editCategory/${selected.id}`}
              state={{ categoryPrefill: selected }} // tuỳ chọn: prefill cho nhanh
              className="flex-1 text-3xl px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition flex justify-center items-center"
            >
              Edit
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteCategory(selected.id);
              }}
              className="flex-1 flex text-3xl items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600/80 text-white hover:bg-red-600 transition"
            >
              <Trash2 className="h-5 w-5" />
              Delete
            </button>
          </div>


        </div>
      )}
    </div>
  );
}
