import express from 'express'
import { loginCustomerController,registerUserController } from '../../controller/customer/authController.js'




const newUserRouter = express.Router();
newUserRouter.post("/registerCustomer",registerUserController)
newUserRouter.post("/loginCustomer",loginCustomerController)


export default newUserRouter;