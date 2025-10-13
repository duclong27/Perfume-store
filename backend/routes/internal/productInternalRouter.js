import { Router } from "express";

import  {getAllProductsInternalController}  from "../../controller/internal/productController.js";

const productInternalRouter = Router();
productInternalRouter.get("/", /*serviceAuth,*/ getAllProductsInternalController);


export default productInternalRouter;