
import { coreInternal } from "../../config/coreClient.js";



export async function getCartByUserIdService(userId, { includeDetails = true } = {}) {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new Error("Invalid userId");
  }

  
  const { data } = await coreInternal.get(`/cart/getCartByUserId/${uid}`, {
    params: { includeDetails },
  });

  // data từ CORE thường là { success, data: { cart, items } }
  return data;
}