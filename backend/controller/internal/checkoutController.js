import { previewCheckoutService } from "../../service/internal/checkOutService.js";

import { passCoreError } from "../../utils/passCoreError.js";





// export const previewCheckoutController = async (req, res) => {
//     try {
//         // Lấy userId trực tiếp từ body/query (khi test Core, chưa có auth)
//         const rawUserId = req.body?.userId ?? req.query?.userId;
//         // const rawUserId = req.headers["x-user-id"] ?? req.body?.userId ?? req.query?.userId;    
//         const userId = Number(rawUserId);

//         if (!Number.isInteger(userId) || userId <= 0) {
//             return res.status(400).json({ success: false, message: "Missing or invalid userId" });
//         }

//         const source = (req.body?.source ?? "cart").toLowerCase();
//         const items = Array.isArray(req.body?.items) ? req.body.items : undefined;
//         const addressId = req.body?.addressId ?? null;
//         const shippingSnapshot = req.body?.shippingSnapshot ?? null;

//         const data = await previewCheckoutService({
//             userId,
//             source,
//             items,
//             addressId,
//             shippingSnapshot,
//             paymentMethodCode, 
//         });

//         return res.status(200).json({ success: true, data });
//     } catch (err) {
//         return passCoreError(res, err);
//     }
// };


export const previewCheckoutController = async (req, res) => {
  try {
    // userId (test Core chưa có auth)
    const rawUserId = req.body?.userId ?? req.query?.userId;
    const userId = Number(rawUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Missing or invalid userId" });
    }

    const source = String(req.body?.source ?? "cart").toLowerCase();
    const items = Array.isArray(req.body?.items) ? req.body.items : undefined;

    // address & snapshot
    const addressId = req.body?.addressId ?? null;
    const shippingSnapshot = req.body?.shippingSnapshot ?? null;

    // 🔴 BỊ THIẾU DÒNG NÀY
    const paymentMethodCode = req.body?.paymentMethodCode ?? null;

    const data = await previewCheckoutService({
      userId,
      source,
      items,
      addressId,
      shippingSnapshot,
      paymentMethodCode, // ✅ truyền xuống service
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return passCoreError(res, err);
  }
};
