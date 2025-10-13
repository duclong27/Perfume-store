import express from "express"
import { vnpayReturnController } from "../../controller/internal/vnpayReturnController.js";
import { checkInternalKey } from "../../middleware/checkInternalKey.js";



const vnpayReturnRouter = express.Router()
// vnpayReturnRouter.post("/return",  vnpayReturnController)
vnpayReturnRouter.post("/return",checkInternalKey, vnpayReturnController)
export default vnpayReturnRouter;