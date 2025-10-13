import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../App";
import { API_ORIGIN, resolveUrl } from '../utils/url';




const Label = ({ children, htmlFor, className = "" }) => (
    <label htmlFor={htmlFor} className={"block mb-1 text-white/90 font-medium text-2xl " + className}>
        {children}
    </label>
);

const FieldError = ({ children }) => (
    <p className="mt-1 text-2xl text-rose-300">{children}</p>
);

const Input = React.forwardRef(function Input({ className = "", ...props }, ref) {
    return (
        <input
            ref={ref}
            className={
                "w-full rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400 " +
                "placeholder:text-white/40 text-white px-4 py-2.5 outline-none transition h-16 text-2xl " +
                className
            }
            {...props}
        />
    );
});

const TextArea = React.forwardRef(function TextArea({ className = "", rows = 4, ...props }, ref) {
    return (
        <textarea
            ref={ref}
            rows={rows}
            className={
                "w-full rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400 " +
                "placeholder:text-white/40 text-white px-4 py-2.5 outline-none transition resize-y text-2xl min-h-[5.5rem] " +
                className
            }
            {...props}
        />
    );
});

const Select = ({ value, onChange, children, className = "", ...props }) => (
    <select
        value={value}
        onChange={onChange}
        className={
            "w-full rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400 " +
            "text-white px-4 py-2.5 outline-none transition h-16 text-2xl " +
            className
        }
        {...props}
    >
        {children}
    </select>
);

const Toggle = ({ checked, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
            "relative inline-flex h-9 w-16 items-center rounded-full transition " +
            (checked ? "bg-emerald-500/90" : "bg-white/15") +
            " ring-1 ring-white/10 hover:ring-indigo-400/40"
        }
    >
        <span
            className={
                "inline-block h-7 w-7 transform rounded-full bg-white shadow transition " +
                (checked ? "translate-x-8" : "translate-x-1")
            }
        />
        {label ? <span className="ml-3 select-none text-2xl text-white/80">{label}</span> : null}
    </button>
);




export default function EditProduct({ prefill }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useLocation(); // <- nhận { imageUrl, imageSrc } từ trang trước

    // ===== helpers giữ giống Add =====
    const genderOptions = useMemo(
        () => [
            { value: "Man", label: "Man" },
            { value: "Woman", label: "Woman" },
            { value: "Unisex", label: "Unisex" },
        ],
        []
    );

    const mapGenderToEnum = (label) => {
        const found = genderOptions.find((g) => g.label === label || g.value === label);
        return found ? found.value : "Unisex";
    };

    const normImagePath = (s) => {
        if (!s) return undefined;
        const t = String(s).trim();
        if (!t) return undefined;
        if (/^(https?:\/\/|data:)/i.test(t)) return t; // absolute/data: -> giữ nguyên
        return t.startsWith("/images/") ? t : `/images/${t.replace(/^\/+/, "")}`;
    };

    function validate(_form, setErrors) {
        const next = {};
        const cid = Number(_form.categoryId);

        if (!Number.isInteger(cid) || cid <= 0) next.categoryId = "Danh mục không hợp lệ";

        const name = (_form.name || "").trim();
        if (!name) next.name = "Vui lòng nhập tên sản phẩm";
        if (name.length > 200) next.name = "Tên quá dài (≤200)";

        const brand = (_form.brand || "").trim();
        if (brand && brand.length > 100) next.brand = "Brand quá dài (≤100)";

        if (_form.description && _form.description.length > 3000) {
            next.description = "Mô tả quá dài";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    }

    // ===== categories (options) =====
    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [catsError, setCatsError] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function fetchCategories() {
            setLoadingCats(true);
            setCatsError(null);
            try {
                const res = await api.get("/api/category/getAllCategories", {
                    headers: { Accept: "application/json" },
                });
                const raw = (res && res.data && res.data.data) || (res && res.data) || [];
                const list = Array.isArray(raw) ? raw : raw.items || [];
                const normalized = list.map((c) => ({
                    categoryId:
                        c.categoryId != null
                            ? c.categoryId
                            : c.id != null
                                ? c.id
                                : String(c.value || ""),
                    name: c.name || c.title || "",
                }));
                if (!mounted) return;
                setCategories(normalized);
            } catch (e) {
                if (!mounted) return;
                console.error(e);
                setCatsError(
                    (e && e.response && e.response.data && e.response.data.message) ||
                    (e && e.message) ||
                    "Error loading categories"
                );
            } finally {
                if (mounted) setLoadingCats(false);
            }
        }

        fetchCategories();
        return () => {
            mounted = false;
        };
    }, []);

    // ===== form state =====
    const [form, setForm] = useState({
        categoryId: "",
        name: "",
        brand: "",
        gender: "Unisex",
        description: "",
        isEnable: true,
        imageFile: null, // File mới user chọn
        imageUrl: "", // path tương đối ảnh hiện tại (nếu có)
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const [imagePreview, setImagePreview] = useState(null); // absolute URL preview
    const initialRef = useRef(null);

    const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    // ===== bootstrap preview từ route state (nếu có) =====
    useEffect(() => {
        if (!state) return;
        const { imageUrl, imageSrc } = state;

        if (imageSrc) {
            setImagePreview(imageSrc);
        } else if (imageUrl) {
            const rel = normImagePath(imageUrl);
            setImagePreview(rel ? resolveUrl(rel) : null);
        }

        if (imageUrl) {
            setForm((f) => ({ ...f, imageUrl })); // để khi không đổi ảnh vẫn giữ được ảnh cũ
        }
    }, [state]);

    // ===== load product detail (hoặc dùng prefill prop) =====
    useEffect(() => {
        let ignore = false;

        async function run() {
            try {
                if (prefill) {
                    if (ignore) return;
                    const hydrated = {
                        categoryId: prefill.categoryId ?? "",
                        name: prefill.name ?? "",
                        brand: prefill.brand ?? "",
                        gender: prefill.gender ?? "Unisex",
                        description: prefill.description ?? "",
                        isEnable: !!prefill.isEnable,
                        imageUrl: prefill.imageUrl ?? "",
                    };
                    setForm((f) => ({ ...f, ...hydrated }));
                    initialRef.current = { ...hydrated };

                    if (prefill.imageSrc) {
                        setImagePreview(prefill.imageSrc);
                    } else if (hydrated.imageUrl) {
                        const rel = normImagePath(hydrated.imageUrl);
                        setImagePreview(rel ? resolveUrl(rel) : null);
                    }
                    return;
                }

                if (!id) throw new Error("Thiếu tham số id trong URL.");
                const res = await api.get(`/api/product/getProductById/${id}`);
                const data = (res && res.data && res.data.data) || (res && res.data) || {};

                const hydrated = {
                    categoryId: data.categoryId ?? data.category ?? "",
                    name: data.name ?? "",
                    brand: data.brand ?? data.brandName ?? "",
                    gender: data.gender ?? "Unisex",
                    description: data.description ?? "",
                    isEnable: !!data.isEnable,
                    imageUrl: data.imageUrl ?? data.image_url ?? "",
                };

                if (ignore) return;
                setForm((f) => ({ ...f, ...hydrated }));
                initialRef.current = { ...hydrated };

                if (data.imageSrc) {
                    setImagePreview(data.imageSrc);
                } else if (hydrated.imageUrl) {
                    const rel = normImagePath(hydrated.imageUrl);
                    setImagePreview(rel ? resolveUrl(rel) : null);
                }
            } catch (e) {
                console.error("Load product failed:", e);
                setToast({
                    type: "error",
                    message:
                        (e && e.response && e.response.data && e.response.data.message) ||
                        (e && e.message) ||
                        "Không thể tải sản phẩm.",
                });
            }
        }

        run();
        return () => {
            ignore = true;
        };
    }, [id, prefill]);

    // ===== preview ảnh khi chọn file mới =====
    useEffect(() => {
        if (!form.imageFile) return;
        const url = URL.createObjectURL(form.imageFile);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.imageFile]);

    // ===== dirty & canSubmit =====
    const dirty = useMemo(() => {
        const init = initialRef.current;
        if (!init) return true;
        const shallowChanged =
            String(form.categoryId ?? "") !== String(init.categoryId ?? "") ||
            (form.name ?? "") !== (init.name ?? "") ||
            (form.brand ?? "") !== (init.brand ?? "") ||
            (form.gender ?? "Unisex") !== (init.gender ?? "Unisex") ||
            (form.description ?? "") !== (init.description ?? "") ||
            Boolean(form.isEnable) !== Boolean(init.isEnable) ||
            (normImagePath(form.imageUrl) ?? null) !== (normImagePath(init.imageUrl) ?? null);

        const imageChanged = !!form.imageFile;
        return shallowChanged || imageChanged;
    }, [form]);

    const canSubmit =
        !submitting &&
        !loadingCats &&
        Number.isInteger(Number(form.categoryId)) &&
        Number(form.categoryId) > 0 &&
        (form.name || "").trim().length > 0 &&
        dirty;

    // ===== submit UPDATE =====
    async function onSubmit(e) {
        e.preventDefault();
        if (!validate(form, setErrors)) return;

        setSubmitting(true);
        setToast(null);

        try {
            if (!id) throw new Error("Thiếu id sản phẩm.");
            const cid = Number(form.categoryId);
            const name = (form.name || "").trim();
            const brand = (form.brand || "").trim();
            const description = (form.description || "").trim();
            const gender = mapGenderToEnum(form.gender);
            const isEnable = !!form.isEnable;
            const hasFile = !!form.imageFile;

            let payload;
            let headers = {};

            if (hasFile) {
                // ----- UPDATE MULTIPART -----
                const fd = new FormData();
                if (Number.isInteger(cid)) fd.append("categoryId", String(cid));
                fd.append("name", name);
                if (brand) fd.append("brand", brand);
                if (description) fd.append("description", description);
                fd.append("gender", gender);
                fd.append("isEnable", isEnable ? "true" : "false");
                fd.append("file", form.imageFile); // đúng tên field BE
                payload = fd;
                headers["Content-Type"] = "multipart/form-data";
            } else {
                // ----- UPDATE JSON (không đổi ảnh) -----
                payload = {
                    name,
                    gender,
                    isEnable,
                };
                if (Number.isInteger(cid)) payload.categoryId = cid;
                if (brand) payload.brand = brand;
                if (description) payload.description = description;

                const url = normImagePath(form.imageUrl);
                if (url) {
                    payload.imageUrl = url; // giữ ảnh cũ
                } else {
                    // nếu có nút xóa ảnh: payload.imageUrl = null;
                }
            }

            const res = await api.patch(`/api/product/updateProduct/${id}`, payload, { headers });

            // ✅ KHÔNG navigate; show toast
            setToast({ type: "success", message: "Update successfully" });

            // Đồng bộ mốc đã lưu
            const nextInit = {
                categoryId: form.categoryId,
                name: (form.name || "").trim(),
                brand: (form.brand || "").trim(),
                gender,
                description: (form.description || "").trim(),
                isEnable,
                imageUrl: form.imageUrl,
            };

            // Nếu BE trả imageUrl mới → cập nhật lại preview & form
            const returned = res?.data?.data || res?.data;
            const newImageUrl = returned?.imageUrl || returned?.image_url;
            if (newImageUrl) {
                nextInit.imageUrl = newImageUrl;
                setForm((f) => ({ ...f, imageUrl: newImageUrl, imageFile: null }));
                const rel = normImagePath(newImageUrl);
                setImagePreview(rel ? resolveUrl(rel) : null);
            } else {
                // không đổi ảnh -> clear file đã chọn
                setForm((f) => ({ ...f, imageFile: null }));
            }

            initialRef.current = nextInit;

            // (tuỳ chọn) auto-hide toast
            // setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error(err);
            setToast({
                type: "error",
                message:
                    (err && err.response && err.response.data && err.response.data.message) ||
                    err?.message ||
                    "Cập nhật sản phẩm thất bại.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    function onReset() {
        const init = initialRef.current;
        if (!init) return;
        setForm({
            ...init,
            imageFile: null,
        });
        setErrors({});
        if (init.imageUrl) {
            const rel = normImagePath(init.imageUrl);
            setImagePreview(rel ? resolveUrl(rel) : null);
        }
    }

    // ===== UI =====
    return (
        <div className="rounded-3xl min-h-screen w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6">
            <div className="mx-auto w-full h-full">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    <h1 className="text-2xl font-semibold text-white">Edit Product</h1>

                    {/* toast */}
                    {toast && (
                        <div
                            className={`mt-4 rounded-xl px-4 py-3 text-white ${toast.type === "success" ? "bg-emerald-600/80" : "bg-rose-600/80"
                                }`}
                        >
                            {toast.message}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="mt-6 grid gap-6 md:grid-cols-2 text-2xl">
                        {/* LEFT */}
                        <div className="space-y-14">
                            <div>
                                <Label htmlFor="categoryId">Category</Label>
                                <Select
                                    id="categoryId"
                                    name="categoryId"
                                    value={String(form.categoryId || "")}
                                    onChange={(e) => updateField("categoryId", e.target.value)}
                                    disabled={loadingCats}
                                >
                                    <option value="" disabled>
                                        — Select category —
                                    </option>

                                    {catsError && (
                                        <option value="__error" disabled className="bg-indigo-900">
                                            Không tải được danh mục
                                        </option>
                                    )}

                                    {categories.map((c) => (
                                        <option
                                            key={String(c.categoryId)}
                                            value={String(c.categoryId)}
                                            className="bg-indigo-900"
                                        >
                                            {c.name || `(ID ${c.categoryId})`}
                                        </option>
                                    ))}
                                </Select>
                                {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
                            </div>

                            <div>
                                <Label htmlFor="name">Product name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Ví dụ: Perfume Aurora"
                                    value={form.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                />
                                {errors.name && <FieldError>{errors.name}</FieldError>}
                            </div>

                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    name="brand"
                                    placeholder="(tùy chọn)"
                                    value={form.brand}
                                    onChange={(e) => updateField("brand", e.target.value)}
                                />
                                {errors.brand && <FieldError>{errors.brand}</FieldError>}
                            </div>

                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    id="gender"
                                    name="gender"
                                    value={form.gender}
                                    onChange={(e) => updateField("gender", e.target.value)}
                                >
                                    {genderOptions.map((g) => (
                                        <option key={g.value} value={g.value} className="bg-indigo-900">
                                            {g.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    id="description"
                                    name="description"
                                    placeholder="Mô tả ngắn về sản phẩm"
                                    value={form.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                />
                                {errors.description && <FieldError>{errors.description}</FieldError>}
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="space-y-7">
                            <div>
                                <Label>Image</Label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="block w-full h-16 text-2xl text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-6 file:py-3 file:text-2xl file:text-white hover:file:bg-white/20"
                                        onChange={(e) => {
                                            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                            updateField("imageFile", file);
                                        }}
                                    />
                                </div>

                                {imagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={imagePreview}
                                            alt="preview"
                                            className="max-h-64 w-auto rounded-2xl ring-1 ring-white/20"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = resolveUrl("/images/placeholder.png");
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                                <div>
                                    <p className="text-2xl font-medium text-white">Enable product</p>
                                    <p className="text-xl text-white/60">Hiển thị/ẩn sản phẩm</p>
                                </div>

                                <Toggle
                                    checked={!!form.isEnable}
                                    onChange={(v) => updateField("isEnable", v)}
                                    aria-label="Enable product"
                                />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className={`inline-flex flex-1 items-center justify-center rounded-2xl px-6 py-4 text-2xl font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-300 ${canSubmit ? "bg-indigo-500/90 hover:bg-indigo-500" : "bg-white/10 cursor-not-allowed"
                                        }`}
                                >
                                    {submitting ? "Saving..." : "Save"}
                                </button>

                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-6 py-4 text-2xl font-medium text-white hover:bg-white/20"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-6 text-xl text-white/50">
                        <p>
                            Nếu API upload trả về đường dẫn ảnh khác, hãy xử lý ở server và cập nhật cột{" "}
                            <code>image_url</code>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}