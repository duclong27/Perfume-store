import { coreInternal } from "../../config/coreClient.js";





export async function addCartItemService(userId, body) {
  const { data } = await coreInternal.post(`/cart/addCartItems/${userId}/items`, body);
  return data;
}





export async function updateCartQuantityService(userId, { variantId, qty }) {
  const payload = { variantId, qty };
  const { data } = await coreInternal.patch(`/cart/updateQuantity/${userId}/items`, payload);
  // Core trả { success, data: { cart, adjustments } }
  return data;
}


export async function deleteCartItemService(userId, cartItemId) {
  const { data } = await coreInternal.delete(`/cart/deleteCartItem/${userId}/items/${cartItemId}`);
  // Core trả { success, data: { cart, adjustments } }
  return data;
}





// 
