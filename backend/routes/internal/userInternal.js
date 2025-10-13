import express from 'express'
import { getUserByIdController } from '../../controller/admin/userController.js';

import { checkInternalKey } from '../../middleware/checkInternalKey.js';


const customerRouter = express.Router();



customerRouter.get('/getUserById/:id',checkInternalKey,getUserByIdController)

export default customerRouter;
