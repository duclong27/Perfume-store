import { buildPreviewCheckoutDTO, buildPlaceCheckoutDTO } from "../dto/checkoutDto.js";

import { coreInternal } from "../config/coreClient.js";

import { previewCheckoutService, placeCheckoutService } from "../service/customer/checkoutService.js";
import { toPreviewDTO, toPlaceDTO } from "../dto/checkoutDto.js";




export const previewCheckoutController = async (req, res) => {
    try {
        const uid = Number(req.auth?.userId);
        if (!Number.isInteger(uid) || uid <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }

        const payload = buildPreviewCheckoutDTO({ body: req.body, userId: uid });
        const coreResp = await previewCheckoutService(payload); // { success, data }

        const data = coreResp?.data ?? coreResp;   // raw từ Core
        const dto = toPreviewDTO(data);            // ✅ chuẩn hoá cho FE (có imageUrl absolute)

        return res.status(200).json({ success: true, data: dto });
    } catch (err) {
        const status = err?.response?.status || 500;
        const resp = err?.response?.data || { success: false, message: "Internal server error" };
        return res.status(status).json(resp);
    }
};


// BFF: controllers/checkout/placeCheckoutController.js

export const placeCheckoutController = async (req, res) => {
    try {
        const uid = Number(req.auth?.userId);
        if (!Number.isInteger(uid) || uid <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }

        const payload = buildPlaceCheckoutDTO
            ? buildPlaceCheckoutDTO({ body: req.body, userId: uid })
            : buildPreviewCheckoutDTO({ body: req.body, userId: uid }); // fallback
        console.log("bff playload", payload)

        const coreResp = await placeCheckoutService(payload); // { success, data }
        const data = coreResp?.data ?? coreResp;             // raw Core
        const dto = toPlaceDTO(data);                        // ✅ chuẩn hoá cho FE

        return res.status(200).json({ success: true, data: dto });
    } catch (err) {
        const status = err?.response?.status || 500;
        const resp = err?.response?.data || { success: false, message: "Internal server error" };
        return res.status(status).json(resp);
    }
};
