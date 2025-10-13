import { addCartItemService, updateQuantityService, deleteCartItemService } from "../../service/internal/cartItemService.js";



export const addCartItemController = async (req, res) => {
  try {
    const userId = Number(req.params?.userId);
    const { variantId, qty } = req.body || {};

    const { cart, adjustments } = await addCartItemService({ userId, variantId, qty });

    return res.status(200).json({
      success: true,
      data: { cart, adjustments },
    });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

    console.error("Cart addItem error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Cart add item error",
    });
  }
};



export const updateCartController = async (req, res) => {
  try {
    const userId = Number(req.params?.userId);
    const { variantId, qty } = req.body || {};

    const { cart, adjustments } = await updateQuantityService({ userId, variantId, qty });

    return res.status(200).json({
      success: true,
      data: { cart, adjustments },
    });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

    console.error("Cart updateQuantity error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Cart update quantity error",
    });
  }
};



/**
 * DELETE /internal/cart/:userId/items/:cartItemId
 * Header: x-internal-key: <key>
 * Mục tiêu: BFF sẽ proxy vào đây; bạn cũng có thể test trực tiếp bằng Postman.
 */
export const deleteCartItemController = async (req, res) => {
  try {
    const userId = Number(req.params?.userId);
    const cartItemId = Number(req.params?.cartItemId);

    // (Tuỳ chọn) validate sớm để trả lỗi 4xx rõ ràng
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid cartItemId" });
    }

    const { cart, adjustments } = await deleteCartItemService({ userId, cartItemId });

    return res.status(200).json({
      success: true,
      data: { cart, adjustments },
    });
  } catch (err) {
    const status =
      err?.status ||
      err?.statusCode ||
      (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

    console.error("Cart deleteCartItem error:", err);
    return res.status(status).json({
      success: false,
      message: err?.message || "Cart delete item error",
    });
  }
};