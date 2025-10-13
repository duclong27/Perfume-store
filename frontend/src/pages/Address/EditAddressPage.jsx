// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";

// const cx = (...xs) => xs.filter(Boolean).join(" ");
// const trim = (s) => (typeof s === "string" ? s.trim() : s);

// export default function EditAddressPage() {
//     const { addressId } = useParams();
//     const { state } = useLocation();
//     const navigate = useNavigate();

//     const [values, setValues] = useState({
//         recipientName: "",
//         phoneNumber: "",
//         addressLine: "",
//         city: "",
//         state: "",
//         postalCode: "",
//         country: "VN",
//     });
//     const [errors, setErrors] = useState({});

//     // Prefill từ state (Link) — giống pattern editProduct bạn đưa
//     useEffect(() => {
//         if (state?.initialValues) {
//             const iv = state.initialValues;
//             setValues({
//                 recipientName: trim(iv?.recipientName) || "",
//                 phoneNumber: trim(iv?.phoneNumber) || "",
//                 addressLine: trim(iv?.addressLine) || "",
//                 city: trim(iv?.city) || "",
//                 state: trim(iv?.state) || "",
//                 postalCode: trim(iv?.postalCode) || "",
//                 country: trim(iv?.country) || "VN",
//             });
//         } else {
//             // Fallback: không có state → tuỳ bạn:
//             // 1) Redirect về list:
//             navigate("/profile/address");
//             // 2) Hoặc TODO: fetch theo id rồi setValues(...) (nếu muốn giữ lại trang)
//         }
//     }, [state, navigate]);

//     const setField = (k, v) => setValues((s) => ({ ...s, [k]: v }));

//     function validate() {
//         const e = {};
//         const name = trim(values.recipientName);
//         const phone = trim(values.phoneNumber);
//         const line = trim(values.addressLine);

//         if (!name) e.recipientName = "Vui lòng nhập tên người nhận";
//         if (!phone) e.phoneNumber = "Vui lòng nhập số điện thoại";
//         else if (!/^(0|\+84)\d{9,10}$/.test(phone.replace(/\s|-/g, "")))
//             e.phoneNumber = "Số điện thoại không hợp lệ";
//         if (!line) e.addressLine = "Vui lòng nhập địa chỉ";

//         setErrors(e);
//         return Object.keys(e).length === 0;
//     }

//     function handleSubmit(e) {
//         e.preventDefault();
//         if (!validate()) return;
//         // TODO: PATCH /updateAddressInfo/:id với values
//         navigate("/internal/v1/updateAddressInfo/:addressId"); //addressRouter.patch("/updateAddressInfo/:addressId", authCustomer, updateAddressInfoController)
//     }

//     return (
//         <div className="max-w-2xl mx-auto px-4 py-8">
//             <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Sửa địa chỉ</h1>

//             <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 text-[15px] md:text-base">
//                 <div>
//                     <label className="block text-slate-600 mb-1.5">Tên người nhận *</label>
//                     <input
//                         className={cx(
//                             "w-full rounded-2xl border p-3 placeholder-slate-400",
//                             errors.recipientName ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                         )}
//                         value={values.recipientName}
//                         onChange={(e) => setField("recipientName", e.target.value)}
//                     />
//                     {errors.recipientName && <p className="mt-1 text-rose-600 text-sm">{errors.recipientName}</p>}
//                 </div>

//                 <div>
//                     <label className="block text-slate-600 mb-1.5">Số điện thoại *</label>
//                     <input
//                         className={cx(
//                             "w-full rounded-2xl border p-3 placeholder-slate-400",
//                             errors.phoneNumber ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                         )}
//                         value={values.phoneNumber}
//                         onChange={(e) => setField("phoneNumber", e.target.value)}
//                     />
//                     {errors.phoneNumber && <p className="mt-1 text-rose-600 text-sm">{errors.phoneNumber}</p>}
//                 </div>

//                 <div>
//                     <label className="block text-slate-600 mb-1.5">Địa chỉ *</label>
//                     <input
//                         className={cx(
//                             "w-full rounded-2xl border p-3 placeholder-slate-400",
//                             errors.addressLine ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                         )}
//                         value={values.addressLine}
//                         onChange={(e) => setField("addressLine", e.target.value)}
//                         placeholder="Số nhà, đường, phường/xã"
//                     />
//                     {errors.addressLine && <p className="mt-1 text-rose-600 text-sm">{errors.addressLine}</p>}
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                     <div>
//                         <label className="block text-slate-600 mb-1.5">Thành phố</label>
//                         <input
//                             className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                             value={values.city}
//                             onChange={(e) => setField("city", e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-slate-600 mb-1.5">Tỉnh/Bang</label>
//                         <input
//                             className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                             value={values.state}
//                             onChange={(e) => setField("state", e.target.value)}
//                         />
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                     <div>
//                         <label className="block text-slate-600 mb-1.5">Mã bưu chính</label>
//                         <input
//                             className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                             value={values.postalCode}
//                             onChange={(e) => setField("postalCode", e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-slate-600 mb-1.5">Quốc gia</label>
//                         <input
//                             className="w-full rounded-2xl border p-3 placeholder-slate-400 border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
//                             value={values.country}
//                             onChange={(e) => setField("country", e.target.value)}
//                         />
//                     </div>
//                 </div>

//                 <div className="mt-1.5 flex items-center justify-end gap-3">
//                     <button type="button" onClick={() => navigate("/profile/address")} className="px-5 py-2.5 rounded-2xl border hover:bg-slate-50">
//                         Huỷ
//                     </button>
//                     <button type="submit" className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]">
//                         Lưu thay đổi
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../../api.js";
import { Link } from "react-router-dom";

const cx = (...xs) => xs.filter(Boolean).join(" ");
const trim = (s) => (typeof s === "string" ? s.trim() : s);

export default function EditAddressPage() {
    const { addressId } = useParams();        // ✅ khớp :addressId
    const { state } = useLocation();          // chứa initialValues từ Link
    const navigate = useNavigate();

    const [values, setValues] = useState({
        recipientName: "",
        phoneNumber: "",
        addressLine: "",
        city: "",
        state: "",
        postalCode: "",
        country: "VN",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const firstInputRef = useRef(null);

    // Prefill từ state. Nếu không có → báo lỗi + quay về list.
    useEffect(() => {
        const iv = state?.initialValues;
        if (!iv || !addressId) {
            toast.error("Thiếu dữ liệu để sửa địa chỉ. Vui lòng mở từ danh sách.");
            navigate("/addressPage");
            return;
        }
        setValues({
            recipientName: trim(iv.recipientName) || "",
            phoneNumber: trim(iv.phoneNumber) || "",
            addressLine: trim(iv.addressLine) || "",
            city: trim(iv.city) || "",
            state: trim(iv.state) || "",
            postalCode: trim(iv.postalCode) || "",
            country: trim(iv.country) || "VN",
        });
        setTimeout(() => firstInputRef.current?.focus(), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addressId]); // đủ rồi; tránh re-run khi state thay đổi

    const setField = (k, v) => setValues((s) => ({ ...s, [k]: v }));

    // ✅ Validate full field
    const validate = () => {
        const e = {};
        const phone = trim(values.phoneNumber).replace(/\s|-/g, "");
        if (!trim(values.recipientName)) e.recipientName = "Vui lòng nhập tên người nhận";
        if (!phone) e.phoneNumber = "Vui lòng nhập số điện thoại";
        else if (!/^(0|\+84)\d{9,10}$/.test(phone)) e.phoneNumber = "Số điện thoại không hợp lệ";
        if (!trim(values.addressLine)) e.addressLine = "Vui lòng nhập địa chỉ";
        if (!trim(values.city)) e.city = "Vui lòng nhập Quận/Huyện/Thành phố trực thuộc";
        if (!trim(values.state)) e.state = "Vui lòng nhập Tỉnh/Thành phố";
        if (!trim(values.postalCode)) e.postalCode = "Vui lòng nhập mã bưu chính";
        if (!trim(values.country)) e.country = "Vui lòng nhập quốc gia";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        const patch = {
            recipientName: trim(values.recipientName),
            phoneNumber: trim(values.phoneNumber),
            addressLine: trim(values.addressLine),
            city: trim(values.city),
            state: trim(values.state),
            postalCode: trim(values.postalCode),
            country: trim(values.country || "VN"),
        };

        try {
            setSaving(true);
            const req = api.patch(`/internal/v1/updateAddressInfo/${addressId}`, patch); // ✅ đúng endpoint
            await toast.promise(
                req,
                {
                    pending: "Đang cập nhật địa chỉ…",
                    success: "Cập nhật địa chỉ thành công ✅",
                    error: {
                        render({ data: err }) {
                            return err?.response?.data?.message || err?.message || "Cập nhật thất bại";
                        },
                    },
                },
                { position: "top-right", theme: "colored" }
            );
            // Ở lại trang (không navigate). Nếu muốn quay về tự động thì:
            // navigate("/addressPage");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    Sửa địa chỉ
                </h1>
                <Link
                    to="/addressPage"
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                >
                    ← Quay lại
                </Link>
            </div>

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
                        <label className="block text-slate-600 mb-1.5">Thành phố / Quận huyện *</label>
                        <input
                            className={cx(
                                "w-full rounded-2xl border p-3 placeholder-slate-400",
                                errors.city ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            )}
                            value={values.city}
                            onChange={(e) => setField("city", e.target.value)}
                        />
                        {errors.city && <p className="mt-1 text-rose-600 text-sm">{errors.city}</p>}
                    </div>
                    <div>
                        <label className="block text-slate-600 mb-1.5">Tỉnh / Thành phố *</label>
                        <input
                            className={cx(
                                "w-full rounded-2xl border p-3 placeholder-slate-400",
                                errors.state ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            )}
                            value={values.state}
                            onChange={(e) => setField("state", e.target.value)}
                        />
                        {errors.state && <p className="mt-1 text-rose-600 text-sm">{errors.state}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-slate-600 mb-1.5">Mã bưu chính *</label>
                        <input
                            className={cx(
                                "w-full rounded-2xl border p-3 placeholder-slate-400",
                                errors.postalCode ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            )}
                            value={values.postalCode}
                            onChange={(e) => setField("postalCode", e.target.value)}
                        />
                        {errors.postalCode && <p className="mt-1 text-rose-600 text-sm">{errors.postalCode}</p>}
                    </div>
                    <div>
                        <label className="block text-slate-600 mb-1.5">Quốc gia *</label>
                        <input
                            className={cx(
                                "w-full rounded-2xl border p-3 placeholder-slate-400",
                                errors.country ? "border-rose-400" : "border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            )}
                            value={values.country}
                            onChange={(e) => setField("country", e.target.value)}
                        />
                        {errors.country && <p className="mt-1 text-rose-600 text-sm">{errors.country}</p>}
                    </div>
                </div>

                <div className="mt-1.5 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/addressPage")}
                        className="px-5 py-2.5 rounded-2xl border hover:bg-slate-50"
                        disabled={saving}
                    >
                        Huỷ
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                        disabled={saving}
                    >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </div>
    );
}


