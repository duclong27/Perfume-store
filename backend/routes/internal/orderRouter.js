import express from "express"

import { getOrderSummaryByIdController,getOrdersByUserIdController,cancelOrderController } from "../../controller/internal/orderController.js"

import { checkInternalKey } from "../../middleware/checkInternalKey.js"

const router = express.Router()
router.get("/getOrderSummaryById/:id",checkInternalKey,getOrderSummaryByIdController)
router.get("/getOrderByUserId/:userId",checkInternalKey,getOrdersByUserIdController)
router.post("/cancelOrder/:userId/:orderId",checkInternalKey,cancelOrderController)

export default router;