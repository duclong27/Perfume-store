import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";         // ✅ cần có vì dùng <Link>
import { api } from "../../api.js";
import { toast } from "react-toastify";

const cx = (...xs) => xs.filter(Boolean).join(" ");
const trim = (s) => (typeof s === "string" ? s.trim() : s);

const INITIAL_VALUES = {
    recipientName: "",
    phoneNumber: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    country: "VN",
    setDefault: false,
};

export default function AddAddressPage() {
    const [values, setValues] = useState(INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const firstInputRef = useRef(null);

    const setField = (k, v) => setValues((s) => ({ ...s, [k]: v }));

    // ✅ Siết chặt: TẤT CẢ các field text đều bắt buộc
    const validate = () => {
        const e = {};
        const {
            recipientName,
            phoneNumber,
            addressLine,
            city,
            state,
            postalCode,
            country,
        } = values;

        // bắt buộc không rỗng (đã trim)
        if (!trim(recipientName)) e.recipientName = "Vui lòng nhập tên người nhận";
        const phone = trim(phoneNumber).replace(/\s|-/g, "");
        if (!phone) e.phoneNumber = "Vui lòng nhập số điện thoại";
        else if (!/^(0|\+84)\d{9,10}$/.test(phone)) e.phoneNumber = "Số điện thoại không hợp lệ";

        if (!trim(addressLine)) e.addressLine = "Vui lòng nhập địa chỉ";
        if (!trim(city)) e.city = "Vui lòng nhập Quận/Huyện/Thành phố trực thuộc";
        if (!trim(state)) e.state = "Vui lòng nhập Tỉnh/Thành phố";
        if (!trim(postalCode)) e.postalCode = "Vui lòng nhập mã bưu chính";
        if (!trim(country)) e.country = "Vui lòng nhập quốc gia";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        const payload = {
            recipientName: trim(values.recipientName),
            phoneNumber: trim(values.phoneNumber),
            addressLine: trim(values.addressLine),
            city: trim(values.city),
            state: trim(values.state),
            postalCode: trim(values.postalCode),
            country: trim(values.country || "VN"),
            setDefault: !!values.setDefault,
        };

        try {
            const req = api.post("/internal/v1/addAddress", payload);

            await toast.promise(
                req,
                {
                    pending: "Đang lưu địa chỉ…",
                    success: "Thêm địa chỉ thành công ✅",
                    error: {
                        render({ data: err }) {
                            return err?.response?.data?.message || err?.message || "Tạo địa chỉ thất bại";
                        },
                    },
                },
                { position: "top-right", theme: "colored" }
            );

            // ✅ Reset form + lỗi, ở lại trang
            setValues(INITIAL_VALUES);
            setErrors({});
            // Focus lại ô đầu tiên (tuỳ chọn)
            if (firstInputRef.current) firstInputRef.current.focus();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Thêm địa chỉ</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 text-[15px] md:text-base">
                <div>
                    <label className="block text-slate-600 mb-1.5">Tên người nhận *</label>
                    <input
                        ref={firstInputRef}
                        className={cx(
                            "w-full rounded-2xl border p-3 placeholder-slate-400",
                            errors.recipientName ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        )}
                        value={values.recipientName}
                        onChange={(e) => setField("recipientName", e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn An"
                    />
                    {errors.recipientName && <p className="mt-1 text-rose-600 text-sm">{errors.recipientName}</p>}
                </div>

                <div>
                    <label className="block text-slate-600 mb-1.5">Số điện thoại *</label>
                    <input
                        className={cx(
                            "w-full rounded-2xl border p-3 placeholder-slate-400",
                            errors.phoneNumber ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        )}
                        value={values.phoneNumber}
                        onChange={(e) => setField("phoneNumber", e.target.value)}
                        placeholder="0xxx xxx xxx"
                    />
                    {errors.phoneNumber && <p className="mt-1 text-rose-600 text-sm">{errors.phoneNumber}</p>}
                </div>

                <div>
                    <label className="block text-slate-600 mb-1.5">Địa chỉ *</label>
                    <input
                        className={cx(
                            "w-full rounded-2xl border p-3 placeholder-slate-400",
                            errors.addressLine ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        )}
                        value={values.addressLine}
                        onChange={(e) => setField("addressLine", e.target.value)}
                        placeholder="Số nhà, đường, phường/xã"
                    />
                    {errors.addressLine && <p className="mt-1 text-rose-600 text-sm">{errors.addressLine}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-slate-600 mb-1.5">Thành phố / Quận huyện</label>
                        <input
                            className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            value={values.city}
                            onChange={(e) => setField("city", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-600 mb-1.5">Tỉnh / Thành phố</label>
                        <input
                            className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            value={values.state}
                            onChange={(e) => setField("state", e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-slate-600 mb-1.5">Mã bưu chính</label>
                        <input
                            className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            value={values.postalCode}
                            onChange={(e) => setField("postalCode", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-600 mb-1.5">Quốc gia</label>
                        <input
                            className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            value={values.country}
                            onChange={(e) => setField("country", e.target.value)}
                        />
                    </div>
                </div>

                <label className="inline-flex items-center gap-3 select-none mt-1">
                    <input
                        type="checkbox"
                        className="size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                        checked={values.setDefault}
                        onChange={(e) => setField("setDefault", e.target.checked)}
                    />
                    <span>Đặt làm mặc định sau khi tạo</span>
                </label>

                <div className="mt-1.5 flex items-center justify-end gap-3">
                    <Link to="/addressPage" className="px-5 py-2.5 rounded-2xl border hover:bg-slate-50">
                        Huỷ
                    </Link>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                        disabled={submitting}
                    >
                        {submitting ? "Đang lưu..." : "Lưu địa chỉ"}
                    </button>
                </div>
            </form>
        </div>
    );
}
