import { vnpayReturnService } from "../service/customer/vnpayReturnService.js";




/**
 * POST /internal/v1/vnpay/return
 * Public (không JWT). Nhận JSON body chứa nguyên vẹn vnp_* rồi forward sang Core.
 */
export async function vnpayReturnPostController(req, res) {
    try {
        const merged = { ...req.query, ...req.body };
        const hasVnp = Object.keys(merged).some((k) => k.startsWith("vnp_"));
        if (!hasVnp) {
            res.setHeader("Cache-Control", "no-store");
            return res.status(400).json({ success: false, message: "Missing vnp_* params" });
        }

        console.log("[BFF] VNPAY RETURN POST >>>", {
            vnp_TxnRef: merged?.vnp_TxnRef,
            vnp_Amount: merged?.vnp_Amount,
            vnp_ResponseCode: merged?.vnp_ResponseCode,
            hasSecureHash: !!merged?.vnp_SecureHash,
        });

        // gọi Core
        const coreResp = await vnpayReturnService(merged);
        // coreResp có thể dạng { ok, status, orderId, message }
        const { ok, status, orderId, message } = coreResp || {};

        // ✅ chuẩn hoá thống nhất
        const unified = ok
            ? {
                success: true,
                data: {
                    orderId,
                    paymentMethodCode: "VNPAY",
                    paymentStatus: status, // "paid" | "failed" | ...
                    message,
                },
            }
            : {
                success: false,
                data: { orderId },
                message,
            };

        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json(unified);
    } catch (e) {
        const isTimeout = e?.code === "ECONNABORTED";
        const upstreamStatus = e?.response?.status;
        const status = isTimeout ? 504 : upstreamStatus || 502;

        const payload = e?.response?.data
            ? e.response.data
            : isTimeout
                ? { success: false, message: "Upstream timeout" }
                : { success: false, message: "Upstream unavailable" };

        res.setHeader("Cache-Control", "no-store");
        return res.status(status).json(payload);
    }
}