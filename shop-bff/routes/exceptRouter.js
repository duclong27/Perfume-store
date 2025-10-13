import express from "express"
import { authCustomer } from "../middleware/authCustomer.js"
import { getMyOrdersController,cancelMyOrderController } from "../controller/orderController.js";

const exceptRouter = express.Router();

exceptRouter.get("/getMyOrders",authCustomer,getMyOrdersController)
exceptRouter.post("/cancelMyOrder/:orderId",authCustomer,cancelMyOrderController)

export default exceptRouter;