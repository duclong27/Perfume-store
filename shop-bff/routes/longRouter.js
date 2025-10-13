import {Router} from "express"

import { authCustomer } from "../middleware/authCustomer.js"

import { getCartByUserIdController } from "../controller/cartController.js";


const longRouter = Router();


longRouter.get("/getCartByUserId",authCustomer,getCartByUserIdController)

export default longRouter;