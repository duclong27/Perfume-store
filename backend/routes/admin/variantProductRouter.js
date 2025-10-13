import express from 'express'
import { addVariantController,getAllVariantController,variantUpdateController,getVariantByIdController } from '../../controller/admin/variantProductController.js'


const productVariantRouter = express.Router();

productVariantRouter.post('/addVariantProduct',addVariantController);
productVariantRouter.get('/getAllVariantProduct',getAllVariantController);
productVariantRouter.patch('/updateVariant/:id',variantUpdateController);
productVariantRouter.get('/getVariantById/:id',getVariantByIdController);



export default productVariantRouter;