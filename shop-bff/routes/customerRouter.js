import {Router} from "express"

import { authCustomer } from "../middleware/authCustomer.js"

import { getCustomerInfoController } from "../controller/customerController.js";


const customerRouter = Router();


customerRouter.get("/me",authCustomer,getCustomerInfoController)

export default customerRouter;