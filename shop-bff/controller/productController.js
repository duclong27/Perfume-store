import { getAllProductsService,getProductByIdService } from "../service/customer/productService.js";

export async function getAllProductsController(req, res, next) {
  try {
    const result = await getAllProductsService(req.query); 
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProductByIdController(req, res, next) {
  try {
    const product = await getProductByIdService(req.params.id);
    res.json(product);
  } catch (err) { next(err); }
}