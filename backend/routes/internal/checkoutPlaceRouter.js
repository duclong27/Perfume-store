import express from "express"
import { checkoutPlaceController } from "../../controller/internal/checkoutPlaceController.js"
import { checkInternalKey } from "../../middleware/checkInternalKey.js";

const checkoutPlaceRouter = express.Router();
checkoutPlaceRouter.post ("/place",checkInternalKey,checkoutPlaceController)

export default checkoutPlaceRouter;
