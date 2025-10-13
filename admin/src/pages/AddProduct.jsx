import React, { useEffect, useMemo, useRef, useState } from "react";

import { api } from "../App";

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

// -----------------------------
// Page Component
// -----------------------------
export default function AddProductPage() {
    // form state
    const [form, setForm] = useState({
        categoryId: "",
        name: "",
        brand: "",
        gender: "Men", // display label; will be mapped to backend enum
        description: "",
        imageFile: null,
        isEnable: true,
    });

    //////

    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
    const [submitting, setSubmitting] = useState(false);

    // categories
    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [catsError, setCatsError] = useState(null);
    


    // refs & previews
    const fileRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);

    const genderOptions = useMemo(
        () => [
            { value: "Man", label: "Man" },
            { value: "Woman", label: "Woman" },
            { value: "Unisex", label: "Unisex" },
        ],
        []
    );

    // map display label -> backend enum value
    const mapGenderToEnum = (label) => {
        const found = genderOptions.find((g) => g.label === label || g.value === label);
        return found ? found.value : "Unisex";
    };

    const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));






    // helpers (đặt ngoài component, dùng chung)
    const normalizeCategory = (c) => ({
        categoryId: c.categoryId ?? c.id ?? String(c?.value ?? ""),
        name: c.name ?? c.title ?? "",
    });

    // fetch categories (axios version - KHÔNG dùng res.ok/res.json)
    useEffect(() => {
        let mounted = true;

        async function fetchAll() {
            setLoadingCats(true);
            setCatsError(null);
            try {
                const res = await api.get("/api/category/getAllCategories", {
                    headers: { Accept: "application/json" },
                });
                const raw = (res && res.data && res.data.data) || (res && res.data) || [];
                const list = Array.isArray(raw) ? raw : (raw.items || []);
                const normalized = list.map((c) => ({
                    categoryId: c.categoryId != null ? c.categoryId : (c.id != null ? c.id : String((c.value || ""))),
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

        fetchAll();
        return () => { mounted = false; };
    }, []);





    function normImagePath(s) {
        if (!s) return undefined;
        const t = String(s).trim();
        if (!t) return undefined;
        return t.startsWith("/images/") ? t : `/images/${t}`;
    }






    // image preview
    useEffect(() => {
        if (!form.imageFile) {
            setImagePreview(null);
            return;
        }
        const url = URL.createObjectURL(form.imageFile);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.imageFile]);




    // validation (very lightweight)
    function validate(form, setErrors) {
        const next = {};
        const cid = Number(form.categoryId);

        if (!Number.isInteger(cid) || cid <= 0) next.categoryId = "Danh mục không hợp lệ";
        const name = (form.name || "").trim();
        if (!name) next.name = "Vui lòng nhập tên sản phẩm";
        if (name.length > 200) next.name = "Tên quá dài (≤200)";

        const brand = (form.brand || "").trim();
        if (brand && brand.length > 100) next.brand = "Brand quá dài (≤100)";

        if (form.description && form.description.length > 3000) {
            next.description = "Mô tả quá dài";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    }


    // submit
    async function onSubmit(e) {
        e.preventDefault();
        if (!validate(form, setErrors)) return;

        setSubmitting(true);
        setToast(null);

        try {
            const cid = Number(form.categoryId);
            const name = (form.name || "").trim();
            const brand = (form.brand || "").trim();
            const description = (form.description || "").trim();
            const hasFile = !!form.imageFile;

            let payload;
            let headers = {};

            if (hasFile) {
                // ===== MULTIPART (có ảnh) =====
                const fd = new FormData();
                fd.append("categoryId", String(cid));
                fd.append("name", name);
                if (brand) fd.append("brand", brand);
                if (description) fd.append("description", description);

                // ✅ GIỮ NGUYÊN CÁCH BẠN LÀM GENDER
                fd.append("gender", mapGenderToEnum(form.gender));

                // ✅ SAU KHI BE FIX: luôn gửi isEnable (string)
                fd.append("isEnable", form.isEnable ? "true" : "false");

                // ✅ đúng tên field upload
                fd.append("file", form.imageFile);

                payload = fd;
                headers["Content-Type"] = "multipart/form-data";
            } else {
                // ===== JSON (không ảnh) =====
                payload = {
                    categoryId: cid,
                    name,
                    gender: mapGenderToEnum(form.gender),     // giữ logic hiện tại
                    isEnable: !!form.isEnable,                 // boolean thật
                };
                if (brand) payload.brand = brand;
                if (description) payload.description = description;

                // (tuỳ chọn) nếu có chọn ảnh sẵn /images
                const url = normImagePath(form.imageUrl);
                if (url) {
                    payload.imageUrl = url;
                } else if (Array.isArray(form.image) && form.image[0]) {
                    const first = normImagePath(form.image[0]);
                    if (first) payload.image = [first];
                }
            }

            const res = await api.post("/api/product/addProduct", payload, { headers });
            setToast({ type: "success", message: "Tạo sản phẩm thành công" });
            onReset();
            console.log("Created product:", res && res.data);
        } catch (err) {
            console.error(err);
            setToast({
                type: "error",
                message:
                    (err && err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    "Có lỗi xảy ra khi tạo sản phẩm",
            });
        } finally {
            setSubmitting(false);
        }
    }


    /////


    const onReset = () => {
        setForm({
            categoryId: "",
            name: "",
            brand: "",
            gender: "Men",
            description: "",
            imageFile: null,
            isEnable: true,
        });
        setErrors({});
        if (fileRef.current) fileRef.current.value = "";
    };

    async function safeError(res) {
        try {
            const data = await res.json();
            return data?.message || data?.error || res.statusText;
        } catch (_) {
            return res.statusText;
        }
    }

    const canSubmit =
        !submitting &&
        !loadingCats &&
        Number.isInteger(Number(form.categoryId)) &&
        Number(form.categoryId) > 0 &&
        (form.name || '').trim().length > 0;


    return (
        <div className="rounded-3xl min-h-screen w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6">
            <div className="mx-auto w-full h-full">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    <h1 className="text-2xl font-semibold text-white">Add Product</h1>

                    <form onSubmit={onSubmit} onReset={onReset} className="mt-6 grid gap-6 md:grid-cols-2 text-2xl">
                        {/* LEFT */}
                        <div className="space-y-14">
                            <div>
                                <Label htmlFor="categoryId">Category</Label>
                                <Select
                                    id="categoryId"
                                    value={form.categoryId}
                                    onChange={(e) => updateField("categoryId", e.target.value)}
                                >
                                    <option value="" disabled>
                                        {loadingCats ? "Đang tải danh mục..." : "— Chọn danh mục —"}
                                    </option>
                                    {catsError ? (
                                        <option value="" disabled>
                                            {"Lỗi tải danh mục"}
                                        </option>
                                    ) : null}
                                    {categories.map((c) => (
                                        <option key={c.categoryId || c.id} value={c.categoryId || c.id} className="bg-indigo-900">
                                            {c.name}
                                        </option>
                                    ))}
                                </Select>
                                {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
                            </div>

                            <div>
                                <Label htmlFor="name">Product name</Label>
                                <Input
                                    id="name"
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
                                    value={form.gender}
                                    onChange={(e) => updateField("gender", e.target.value)}
                                >
                                    {genderOptions.map((g) => (
                                        <option key={g.value} value={g.label} className="bg-indigo-900">
                                            {g.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    id="description"
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
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => updateField("imageFile", e.target.files?.[0] || null)}
                                        className="block w-full h-16 text-2xl text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-6 file:py-3 file:text-2xl file:text-white hover:file:bg-white/20"
                                    />
                                    {form.imageFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                updateField("imageFile", null);
                                                if (fileRef.current) fileRef.current.value = "";
                                            }}
                                            className="rounded-lg bg-white/10 px-5 py-3 text-2xl text-white hover:bg-white/20"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                {imagePreview && (
                                    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2">
                                        <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                                <div>
                                    <p className="text-2xl font-medium text-white">Enable product</p>
                                    <p className="text-xl text-white/60">Hiển thị/ẩn sản phẩm</p>
                                </div>
                                <Toggle checked={form.isEnable} onChange={(v) => updateField("isEnable", v)} />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    aria-busy={submitting}
                                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-indigo-500/90 px-6 py-4 text-2xl font-medium text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Creating..." : "Create"}
                                </button>

                                <button
                                    type="reset"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-6 py-4 text-2xl font-medium text-white hover:bg-white/20"
                                >
                                    Reset
                                </button>
                            </div>

                            {toast && (
                                <div
                                    className={
                                        "rounded-2xl px-6 py-4 text-2xl font-medium " +
                                        (toast.type === "success"
                                            ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
                                            : "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30")
                                    }
                                >
                                    {toast.message}
                                </div>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 text-xl text-white/50">

                        <p>Nếu API upload trả về đường dẫn ảnh khác, hãy xử lý ở server và cập nhật cột <code>image_url</code>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}