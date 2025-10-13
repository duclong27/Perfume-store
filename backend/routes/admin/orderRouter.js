import { getAllOrdersController,updateOrderStatusAndPaymentStatusController } from "../../controller/admin/orderController.js";
import express from "express"


const adminRouter = express.Router();
adminRouter.get("/getAllOrders",getAllOrdersController)
adminRouter.patch("/updateOrder/:orderId",updateOrderStatusAndPaymentStatusController)
export default adminRouter;