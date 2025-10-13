import express from 'express'
import { addCartItemController, updateCartController, deleteCartItemController } from '../../controller/internal/cartItemController.js'
import { checkInternalKey } from '../../middleware/checkInternalKey.js';


const cartItemRouter = express.Router();
cartItemRouter.post(
  "/addCartItems/:userId/items",
  checkInternalKey,
  addCartItemController
);

cartItemRouter.patch(
  "/updateQuantity/:userId/items",
  checkInternalKey,
  updateCartController
);

cartItemRouter.delete(
  "/deleteCartItem/:userId/items/:cartItemId",
  checkInternalKey,
  deleteCartItemController
);






export default cartItemRouter;