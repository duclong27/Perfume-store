import {getCartByUserIdService } from "../service/customer/cartService.js";
import {passCoreError} from "../utils/errorMapper.js"

import { toCartDTO } from "../dto/cartDto.js";

export async function getCartByUserIdController(req, res) {
  try {
    const userId = req.auth.userId;
    const includeDetails =
      String(req.query?.includeDetails ?? "true").toLowerCase() !== "false";


    const raw = await getCartByUserIdService(userId, { includeDetails });

    
    const dto = toCartDTO(raw?.data ?? raw);

    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    return passCoreError(res, err);
  }
}