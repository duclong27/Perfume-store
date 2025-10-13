import {Router} from "express"

import { authCustomer } from "../middleware/authCustomer.js"

import { addCartItemController,deleteCartItemController,updateCartItemController } from "../controller/cartItemController.js";


const cartItemRouter = Router();


cartItemRouter.post("/addItems",authCustomer,addCartItemController)
cartItemRouter.patch("/updateCartItem",authCustomer,updateCartItemController)
cartItemRouter.delete("/deleteCartItem/:cartItemId",authCustomer,deleteCartItemController)



export default cartItemRouter;