import { addCartItemService, updateCartQuantityService, deleteCartItemService } from "../service/customer/cartItemService.js";
import { passCoreError } from "../utils/errorMapper.js"

import { toCartDTO } from "../dto/cartDto.js";



export async function addCartItemController(req, res) {

  try {
    const userId = req.auth.userId;
    const body = { variantId: Number(req.body?.variantId), qty: Number(req.body?.qty ?? 1) };
    const raw = await addCartItemService(userId, body);
    const dto = toCartDTO(raw?.data ?? raw);
    return res.status(201).json({ success: true, data: dto });
  } catch (err) {
    return passCoreError(res, err);
  }
}


export async function updateCartItemController(req, res) {
  try {
    const userId = Number(req.auth?.userId); // JWT -> BFF
    const variantId = Number(req.body?.variantId);
    const qty = Number(req.body?.qty);

    
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
    }
    if (!Number.isInteger(variantId) || variantId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }
    if (!Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: "Invalid qty" });
    }

  
    const raw = await updateCartQuantityService(userId, { variantId, qty });

    
    const dto = toCartDTO(raw?.data ?? raw);
    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    return passCoreError(res, err);
  }
}

export async function deleteCartItemController(req, res) {
  try {
    const userId = Number(req.auth?.userId);        
    const cartItemId = Number(req.params?.cartItemId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
    }
    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid cartItemId" });
    }

    
    const raw = await deleteCartItemService(userId, cartItemId);

  
    const dto = toCartDTO(raw?.data ?? raw);
    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    return passCoreError(res, err);
  }
}