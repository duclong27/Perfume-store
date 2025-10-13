import express from 'express'

import { getAllAccountController,updateAccountController,addAccountController } from '../../controller/admin/accountController.js'

import { adminOnly } from '../../middleware/adminAuth.js';


const accountRouter = express.Router();


accountRouter.post("/addAccount",adminOnly, addAccountController)
accountRouter.get("/getAllAccounts", getAllAccountController)
accountRouter.patch("/updateAccount/:userId",adminOnly, updateAccountController)

export default accountRouter;