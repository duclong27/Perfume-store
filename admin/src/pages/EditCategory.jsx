import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../App";

export default function EditCategory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    // Prefill nếu chuyển từ trang list
    const prefill = state?.categoryPrefill ?? null;

    // ---- Form state ----
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // ---- UI state ----
    const [loading, setLoading] = useState(true);  // loading prefill/fetch
    const [saving, setSaving] = useState(false);   // submitting PUT
    const [err, setErr] = useState("");

    // Xác định có thay đổi dữ liệu hay chưa (để disable Save nếu chưa đổi gì)
    const dirty = useMemo(() => {
        if (!prefill) return true; // nếu fetch từ API, bỏ check này hoặc so sánh với snapshot fetch được
        return name !== (prefill.name ?? "") || description !== (prefill.description ?? "");
    }, [name, description, prefill]);





    // ---- Load dữ liệu ban đầu ----
    useEffect(() => {
        let ignore = false;

        async function run() {
            try {
                setErr("");
                // Nếu có prefill từ state thì dùng luôn, không cần gọi API
                if (prefill) {
                    if (ignore) return;
                    setName(prefill.name ?? "");
                    setDescription(prefill.description ?? "");
                    setLoading(false);
                    return;
                }

                // Không có prefill => fetch theo id
                if (!id) {
                    throw new Error("Thiếu tham số id trong URL.");
                }

                const res = await api.patch(`/api/category/updateCategory/${id}`); // <-- chỉnh endpoint cho đúng backend
                const data = res.data; // { id, name, description, ... }

                if (ignore) return;
                setName(data?.name ?? "");
                setDescription(data?.description ?? "");
                setLoading(false);
            } catch (e) {
                if (ignore) return;
                console.error(e);
                setErr(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Không thể tải dữ liệu category."
                );
                setLoading(false);
            }
        }

        run();
        return () => {
            ignore = true;
        };
    }, [id, prefill]);

    // ---- Submit ----
    async function onSubmit(e) {
        e.preventDefault();
        if (!id) {
            toast.error("Thiếu id category.");
            return;
        }
        if (!name.trim()) {
            toast.warn("Vui lòng nhập tên category.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: name.trim(),
                description: description.trim(),

            };

            await api.patch(`/api/category/updateCategory/${id}`, payload); // <-- chỉnh endpoint nếu khác
            toast.success("Đã lưu thay đổi.");
            navigate(-1); // quay về trang trước; hoặc navigate("/admin/categories")
        } catch (e) {
            console.error(e);
            toast.error(
                e?.response?.data?.message || e?.message || "Lưu thay đổi thất bại."
            );
        } finally {
            setSaving(false);
        }
    }


    function onCancel() {
        navigate(-1);
    }

    return (
        <div className="w-full h-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-10 text-white shadow-2xl">
            <h2 className="text-4xl font-extrabold tracking-tight mb-8">
                Edit Category
            </h2>

            {loading ? (
                <div className="py-10 text-center text-slate-300 text-xl">
                    Đang tải dữ liệu…
                </div>
            ) : err ? (
                <div className="py-10 text-center text-red-400">{err}</div>
            ) : (
                <form className="space-y-10" onSubmit={onSubmit}>
                    {/* Name */}
                    <div className="space-y-3">
                        <label className="text-2xl font-semibold text-slate-100">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Category name"
                            className="w-full rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-lg outline-none placeholder-slate-400 focus:border-violet-400"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-2xl font-semibold text-slate-100">
                            Description
                        </label>
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
                            disabled={saving}
                            className="px-7 py-4 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 text-lg transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving || !dirty}
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
