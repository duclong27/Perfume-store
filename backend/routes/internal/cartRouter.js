import express from 'express'
import { getCartByUserIdController } from '../../controller/internal/cartController.js'
import { checkInternalKey } from '../../middleware/checkInternalKey.js';


const cartRouter = express.Router();
cartRouter.get(
  "/getCartByUserId/:userId",
  checkInternalKey,          // bắt buộc key nội bộ
  getCartByUserIdController  // controller bạn vừa viết
);

export default cartRouter;