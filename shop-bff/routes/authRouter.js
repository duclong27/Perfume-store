import { Router } from "express";
import { loginCustomerController,registerCustomerController } from "../controller/authController.js";


const authRouter = Router();


authRouter.post("/registerCustomer",registerCustomerController)
authRouter.post("/loginCustomer",loginCustomerController)



export default authRouter;
