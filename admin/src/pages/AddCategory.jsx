import { useState } from "react";
import { api } from '../App'
import { toast } from 'react-toastify';


export default function AddCategory({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate trước khi submit
    if (!name.trim() && !description.trim()) {
      toast.error("Please enter category name and description ❌");
      return { ok: false };
    }
    if (!name.trim()) {
      toast.error("Category name is required ❌");
      return { ok: false };
    }
    if (!description.trim()) {
      toast.error("Category description is required ❌");
      return { ok: false };
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      const res = await api.post("/api/category/addCategory", payload);
      const created = res?.data?.data ?? res?.data;

      // Reset form sau khi thành công
      setName("");
      setDescription("");

      // ✅ báo thành công
      toast.success("Category created successfully 🎉");

      onCreate?.(created);
      return { ok: true, data: created, status: res.status };
    } catch (err) {
      // ❌ báo lỗi API
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create category";
      toast.error(`Failed to create category: ${msg}`);
      return { ok: false, error: msg, status: err?.response?.status };
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="w-full h-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-10 text-white shadow-2xl">
      <h2 className="text-4xl font-extrabold tracking-tight mb-8">Add Category</h2>

      <form className="space-y-10" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="space-y-3">
          <label className="text-2xl font-semibold text-slate-100">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-lg outline-none placeholder-slate-400 focus:border-violet-400"
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-2xl font-semibold text-slate-100">Description</label>
          <textarea
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description..."
            className="w-full rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-lg outline-none placeholder-slate-400 focus:border-violet-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-7 py-4 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 text-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="ml-auto px-8 py-4 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 transition"
          >
            {submitting ? "Creating..." : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
