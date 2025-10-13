import { Router } from "express";

import { getSuccessSummaryController } from "../controller/successController.js";
import { authCustomer } from "../middleware/authCustomer.js";


const successRouter  = Router();
successRouter.get("/getSuccess/:id",authCustomer,getSuccessSummaryController)
export default successRouter;