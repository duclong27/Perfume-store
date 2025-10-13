import { previewCheckoutController,placeCheckoutController } from "../controller/checkoutController.js";

import { authCustomer } from "../middleware/authCustomer.js";

import express from "express"



const checkoutRouter = express.Router();

checkoutRouter.post("/preview",authCustomer,previewCheckoutController);
checkoutRouter.post("/place",authCustomer,placeCheckoutController);


export default checkoutRouter;