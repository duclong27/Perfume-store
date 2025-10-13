import express from 'express'


import { addCategoriesController,updateCategoryController,deleteCategoryController ,getCategoriesController} from '../../controller/admin/categoryController.js';


const categoryRouter = express.Router();


categoryRouter.post('/addCategory' ,addCategoriesController)
categoryRouter.patch('/updateCategory/:id',updateCategoryController)
categoryRouter.delete('/deleteCategory/:id',deleteCategoryController)
categoryRouter.get('/getAllCategories',getCategoriesController)


export default categoryRouter;