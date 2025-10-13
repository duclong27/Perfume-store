import { Router } from "express";
import { getAllProductsController } from "../controller/productController.js";
import { getProductByIdController } from "../controller/productController.js";
const productRouter = Router();

// GET /api/v1
productRouter.get("/getAllProducts", getAllProductsController);

// GET /api/v1
productRouter.get("/getProductById/:id", getProductByIdController);

export default productRouter;
