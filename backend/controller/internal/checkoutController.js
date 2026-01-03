import { previewCheckoutService } from "../../service/internal/checkoutService.js";

import { passCoreError } from "../../utils/passCoreError.js";





export const previewCheckoutController = async (req, res) => {
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

    
    const paymentMethodCode = req.body?.paymentMethodCode ?? null;

    const data = await previewCheckoutService({
      userId,
      source,
      items,
      addressId,
      shippingSnapshot,
      paymentMethodCode, 
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return passCoreError(res, err);
  }
};
