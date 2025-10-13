import express from 'express'

import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import { authAdminOrStaff } from "../../middleware/adminOrStaffAuth.js"



import {addProductController,getAllProductsController,getProductByIdController,
  deleteProductController,getProductVariantByProductIdController,
  setProductIsEnableController,updateProductController

} from "../../controller/admin/productController.js"

const productRouter = express.Router();

productRouter.post('/addProduct', upload.single("file"), addProductController)
productRouter.get('/getAllProduct', getAllProductsController)
productRouter.get('/getProductById/:id', getProductByIdController)
productRouter.get('/getProductVariant/:id', getProductVariantByProductIdController)
productRouter.delete('/deleteProduct/:id', authAdminOrStaff, deleteProductController)
productRouter.patch('/updateIsEnableProduct/:id/is-enable',  setProductIsEnableController)

productRouter.patch('/updateProduct/:id',
  upload.any(),            
  async (req, res, next) => {
    console.log('FILES =', req.files?.map(f => f.fieldname));

    const file = Array.isArray(req.files) && req.files.length ? req.files[0] : undefined;
    req.file = file;          
    return updateProductController(req, res, next);
  }
);



export default productRouter;

