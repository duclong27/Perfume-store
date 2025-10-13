import express from "express"
import { checkInternalKey } from "../../middleware/checkInternalKey.js"

import { previewCheckoutController } from "../../controller/internal/checkoutController.js"


const checkoutRouter = express.Router();


checkoutRouter.post("/preview",checkInternalKey,previewCheckoutController)

export default checkoutRouter;