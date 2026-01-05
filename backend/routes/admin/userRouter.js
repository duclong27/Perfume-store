import express from 'express'
import {  registerUserController,
        loginUserController,
    loginAdminOrStaffController,
    getUserByIdController,demoAdminLoginController } from "../../controller/admin/userController.js";

import { checkInternalKey } from '../../middleware/checkInternalKey.js';


const userRouter = express.Router();


userRouter.post('/register' ,registerUserController)
userRouter.post('/login' ,loginUserController)
userRouter.post('/loginAdminOrStaff' ,loginAdminOrStaffController)
userRouter.get(' /getUserById/:id',checkInternalKey,getUserByIdController)
userRouter.post('/demoAdminLogin', demoAdminLoginController)

export default userRouter;


