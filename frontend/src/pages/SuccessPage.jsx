import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api.js";

export default function SuccessPage() {
    const { id: orderId } = useParams();
    const [search] = useSearchParams();
    const navigate = useNavigate();

    const method = (search.get("pm") || "UNKNOWN").toUpperCase();   // VNPAY | BANK_TRANSFER | COD | UNKNOWN
    const urlStatus = (search.get("status") || "paid").toLowerCase(); // paid | pending | unpaid | failed | unknown

    const [loading, setLoading] = useState(true);
    const [apiData, setApiData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!Number.isInteger(+orderId) || +orderId <= 0) {
                setLoading(false);
                setError("orderId không hợp lệ");
                return;
            }
            try {
                setLoading(true);
                setError("");

                // ⬇️ Fetch đúng “form” kiểu place: const res = await api.post(...)
                const res = await api.get(`/internal/v1/getSuccess/${orderId}`);
                const payload = res?.data?.data ?? res?.data; // cùng style parse như place
                if (mounted) setApiData(payload);
            } catch (err) {
                if (mounted) setError(err?.response?.data?.message || "Không tải được thông tin đơn.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [orderId]);

    const effectiveStatus = useMemo(() => {
        const apiVnp = apiData?.vnpayResult?.status;
        if (apiVnp && method === "VNPAY") return apiVnp;
        return urlStatus;
    }, [apiData, method, urlStatus]);

    const heading = useMemo(() => {
        if (effectiveStatus === "paid") return "Thanh toán thành công";
        if (effectiveStatus === "failed") return "Giao dịch thất bại";
        if (method === "BANK_TRANSFER") return "Đặt hàng thành công – Chờ chuyển khoản";
        if (method === "COD") return "Đặt hàng thành công – Thanh toán khi nhận hàng";
        return "Đặt hàng thành công";
    }, [method, effectiveStatus]);

    const badgeClass = useMemo(() => {
        const base = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
        if (effectiveStatus === "paid") return `${base} bg-green-100 text-green-700`;
        if (effectiveStatus === "failed") return `${base} bg-red-100 text-red-700`;
        if (effectiveStatus === "pending") return `${base} bg-yellow-100 text-yellow-700`;
        if (effectiveStatus === "unpaid") return `${base} bg-gray-100 text-gray-700`;
        return `${base} bg-slate-100 text-slate-700`;
    }, [effectiveStatus]);

    const goShop = () => navigate("/");
    const goMyOrders = () => navigate("/account/orders");
    const onPrint = () => window.print();

    const onCopy = async (text) => {
        try { await navigator.clipboard.writeText(text || ""); alert("Đã sao chép."); }
        catch { alert("Không sao chép được, vui lòng thử lại."); }
    };

    const s = apiData?.paymentInstructionsSnapshot;
    const c = apiData?.codInfo;
    const v = apiData?.vnpayResult;

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 md:p-10">
                <div className="flex flex-col items-center text-center gap-3">
                    <div className={
                        effectiveStatus === "paid"
                            ? "w-16 h-16 rounded-full grid place-items-center bg-green-100"
                            : effectiveStatus === "failed"
                                ? "w-16 h-16 rounded-full grid place-items-center bg-red-100"
                                : "w-16 h-16 rounded-full grid place-items-center bg-yellow-100"
                    }>
                        <span className="text-2xl">{effectiveStatus === "paid" ? "✅" : effectiveStatus === "failed" ? "❌" : "⏳"}</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-semibold">{heading}</h1>

                    <div className="flex flex-wrap items-center gap-2 text-slate-600">
                        <span className={badgeClass}>{effectiveStatus.toUpperCase()}</span>
                        <span>Mã đơn:</span>
                        <span className="font-semibold">#{orderId}</span>
                        {method !== "UNKNOWN" && (
                            <>
                                <span className="text-slate-400">•</span>
                                <span className="uppercase tracking-wide text-slate-500 text-sm">{method}</span>
                            </>
                        )}
                    </div>

                    {/* hint ngắn khi chưa có snapshot */}
                    {method === "BANK_TRANSFER" && effectiveStatus !== "failed" && !s && !loading && !error && (
                        <p className="text-slate-500 text-sm">
                            Hướng dẫn chuyển khoản &amp; QR nằm trong <span className="font-medium">My orders</span>.
                        </p>
                    )}
                    {method === "COD" && !loading && !error && (
                        <p className="text-slate-500 text-sm">Bạn sẽ thanh toán khi nhận hàng.</p>
                    )}
                </div>

                {/* BODY */}
                {loading ? (
                    <div className="mt-8 animate-pulse space-y-3">
                        <div className="h-4 bg-slate-100 rounded" />
                        <div className="h-4 bg-slate-100 rounded w-2/3" />
                        <div className="h-40 bg-slate-100 rounded" />
                    </div>
                ) : error ? (
                    <p className="mt-6 text-red-600 text-sm">{error}</p>
                ) : (
                    <>
                        {/* BANK_TRANSFER */}
                        {method === "BANK_TRANSFER" && effectiveStatus !== "failed" && s && (
                            <div className="mt-8 grid gap-5">
                                <div className="rounded-xl border p-4">
                                    <div className="text-left space-y-3">
                                        <div>
                                            <div className="text-sm text-slate-500">Nội dung chuyển khoản</div>
                                            <div className="flex items-center gap-2">
                                                <code className="px-2 py-1 bg-slate-50 rounded border text-slate-800">{s.note}</code>
                                                <button onClick={() => onCopy(s.note)} className="px-2 py-1 text-sm rounded border hover:bg-slate-50">Copy</button>
                                            </div>
                                        </div>
                                        {s.phone ? (
                                            <div>
                                                <div className="text-sm text-slate-500">Số điện thoại</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{s.phone}</span>
                                                    <button onClick={() => onCopy(s.phone)} className="px-2 py-1 text-sm rounded border hover:bg-slate-50">Copy</button>
                                                </div>
                                            </div>
                                        ) : null}
                                        {s.noteHint ? (
                                            <p className="text-sm text-sky-700 bg-sky-50 border border-sky-100 rounded p-3">{s.noteHint}</p>
                                        ) : null}
                                    </div>
                                </div>
                                {s.imageUrl ? (
                                    <div className="rounded-xl border p-4">
                                        <div className="text-sm text-slate-500 mb-2">QR chuyển khoản</div>
                                        <img src={s.imageUrl} alt="QR chuyển khoản" className="w-full max-w-sm mx-auto rounded-lg border" />
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* COD */}
                        {method === "COD" && (
                            <div className="mt-8 rounded-xl border p-4 text-left">
                                <div className="text-slate-800 font-medium">{c?.message || "Thanh toán khi nhận hàng"}</div>
                                <div className="text-sm text-slate-500 mt-1">{c?.hint || "Vui lòng chuẩn bị tiền mặt đúng số tiền trên đơn."}</div>
                            </div>
                        )}

                        {/* VNPAY */}
                        {method === "VNPAY" && (
                            <div className="mt-8 rounded-xl border p-4 text-left space-y-1">
                                {effectiveStatus === "paid" ? (
                                    <>
                                        <div className="text-slate-800 font-medium">Thanh toán VNPay thành công</div>
                                        <div className="text-sm text-slate-600">
                                            Số tiền: <span className="font-semibold">{Number(v?.amountVnd ?? 0).toLocaleString("vi-VN")} ₫</span>
                                        </div>
                                        {v?.paidAt && (
                                            <div className="text-sm text-slate-600">
                                                Thời gian: <span className="font-medium">{new Date(v.paidAt).toLocaleString("vi-VN")}</span>
                                            </div>
                                        )}
                                    </>
                                ) : effectiveStatus === "failed" ? (
                                    <>
                                        <div className="text-slate-800 font-medium">Thanh toán VNPay thất bại</div>
                                        <div className="text-sm text-slate-600 mt-1">Vui lòng thử lại thanh toán hoặc đổi phương thức.</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-slate-800 font-medium">Đang chờ xác nhận thanh toán VNPay</div>
                                        <div className="text-sm text-slate-600 mt-1">Hệ thống sẽ cập nhật trạng thái đơn của bạn sau ít phút.</div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* CTA */}
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    <button onClick={goShop} className="px-5 py-3 rounded-xl bg-slate-900 text-white hover:opacity-90">Back to shopping</button>
                    <button onClick={goMyOrders} className="px-5 py-3 rounded-xl border hover:bg-slate-50">My orders</button>
                    <button onClick={onPrint} className="px-5 py-3 rounded-xl border hover:bg-slate-50">Print</button>
                </div>
            </div>
        </div>
    );
}
