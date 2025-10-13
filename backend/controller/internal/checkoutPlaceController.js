import { checkoutPlaceService } from "../../service/internal/checkoutPlaceService.js";

import { passCoreError } from "../../utils/passCoreError.js";


export const checkoutPlaceController = async (req, res) => {
    try {
        // Lấy userId trực tiếp từ body/query (khi test Core, chưa có auth)
        const rawUserId = req.body?.userId ?? req.query?.userId;
        const userId = Number(rawUserId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: "Missing or invalid userId" });
        }

        // Chuẩn hoá input giống preview
        const source = String(req.body?.source ?? "cart").toLowerCase();
        const items = Array.isArray(req.body?.items) ? req.body.items : undefined;
        const addressId = req.body?.addressId ?? null;
        const shippingSnapshot = req.body?.shippingSnapshot ?? null;
        console.log(" shipping controller",shippingSnapshot)

        // Bắt buộc: phương thức thanh toán
        const paymentMethodCodeRaw = req.body?.paymentMethodCode;
        const paymentMethodCode = typeof paymentMethodCodeRaw === "string" ? paymentMethodCodeRaw.toUpperCase() : "";

        if (!["COD", "BANK_TRANSFER", "VNPAY"].includes(paymentMethodCode)) {
            return res.status(400).json({ success: false, message: "Missing or invalid paymentMethodCode (COD | BANK_TRANSFER | VNPAY)" });
        }

        // (Optional) Lấy IP thật của client để truyền xuống service build VNPay URL (nếu bạn muốn)
        // Hiện tại checkoutPlaceService đang set "0.0.0.0", bạn có thể truyền vào nếu đã hỗ trợ:
        // const clientIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();

        const data = await checkoutPlaceService({
            userId,
            paymentMethodCode,
            addressId,
            shippingSnapshot,
            source,
            items,
            // clientIp, // nếu bạn quyết định hỗ trợ IP ở service
        });

        return res.status(200).json({ success: true, data });
    } catch (err) {
        return passCoreError(res, err);
    }
};



