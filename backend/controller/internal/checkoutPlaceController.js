import { checkoutPlaceService } from "../../service/internal/checkoutPlaceService.js";

import { passCoreError } from "../../utils/passCoreError.js";


function getClientIp(req) {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket?.remoteAddress ||
        "127.0.0.1"
    );
}


export const checkoutPlaceController = async (req, res) => {
    try {

        const rawUserId = req.body?.userId ?? req.query?.userId;
        const userId = Number(rawUserId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: "Missing or invalid userId" });
        }


        const source = String(req.body?.source ?? "cart").toLowerCase();
        const items = Array.isArray(req.body?.items) ? req.body.items : undefined;
        const addressId = req.body?.addressId ?? null;
        const shippingSnapshot = req.body?.shippingSnapshot ?? null;
        console.log(" shipping controller", shippingSnapshot)

        const clientIp = getClientIp(req);
        const paymentMethodCodeRaw = req.body?.paymentMethodCode;
        const paymentMethodCode = typeof paymentMethodCodeRaw === "string" ? paymentMethodCodeRaw.toUpperCase() : "";

        if (!["COD", "BANK_TRANSFER", "VNPAY"].includes(paymentMethodCode)) {
            return res.status(400).json({ success: false, message: "Missing or invalid paymentMethodCode (COD | BANK_TRANSFER | VNPAY)" });
        }



        const data = await checkoutPlaceService({
            userId,
            paymentMethodCode,
            addressId,
            shippingSnapshot,
            source,
            items,
            clientIp
        });

        return res.status(200).json({ success: true, data });
    } catch (err) {
        return passCoreError(res, err);
    }
};



