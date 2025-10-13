// src/pages/ReturnPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ReturnPage() {
    const navigate = useNavigate();
    const { id } = useParams(); // /order/:id/return
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryPayload, setRetryPayload] = useState(null);

    useEffect(() => {
        // Lấy toàn bộ query vnp_* từ URL
        const searchParams = new URLSearchParams(window.location.search);
        const payload = Object.fromEntries(searchParams.entries());
        setRetryPayload(payload);

        if (Object.keys(payload).length === 0) {
            setError("Thiếu tham số vnp_*");
            setLoading(false);
            return;
        }

        const callApi = async () => {
            try {
                setLoading(true);
                const resp = await fetch(
                    "http://localhost:5000/internal/v1/vnpay/return",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    }
                );
                const result = await resp.json();

                if (result.success && result.data.paymentStatus === "paid") {
                    navigate(
                        `/order/success/${result.data.orderId}?pm=VNPAY&status=paid`
                    );
                } else {
                    navigate(
                        `/order/success/${result.data.orderId}?pm=VNPAY&status=failed&reason=${encodeURIComponent(
                            result.message || "Giao dịch thất bại"
                        )}`
                    );
                }
            } catch (err) {
                console.error("ReturnPage error:", err);
                setError("Lỗi mạng. Vui lòng thử lại.");
                setLoading(false);
            }
        };

        callApi();
    }, [navigate]);

    const handleRetry = async () => {
        if (!retryPayload) return;
        setError(null);
        setLoading(true);
        try {
            const resp = await fetch(
                "http://localhost:5000/internal/v1/vnpay/return",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(retryPayload),
                }
            );
            const result = await resp.json();
            if (result.success && result.data.paymentStatus === "paid") {
                navigate(`/order/success/${result.data.orderId}?pm=VNPAY&status=paid`);
            } else {
                navigate(
                    `/order/success/${result.data.orderId}?pm=VNPAY&status=failed&reason=${encodeURIComponent(
                        result.message || "Giao dịch thất bại"
                    )}`
                );
            }
        } catch (err) {
            console.error("Retry error:", err);
            setError("Lỗi mạng lần nữa. Vui lòng thử lại.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-xl">Đang xác thực thanh toán VNPay...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <p className="text-red-600 text-xl">{error}</p>
                <button
                    onClick={handleRetry}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white"
                >
                    Thử xác thực lại
                </button>
            </div>
        );
    }

    return null;
}
