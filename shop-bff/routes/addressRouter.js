import { addAddressController, getAddressesController,updateAddressInfoController,
    setAddressDefaultController,deleteAddressController
} from "../controller/addressController.js";

import express from "express"

import { authCustomer } from "../middleware/authCustomer.js";



const addressRouter = express.Router();

addressRouter.post("/addAddress",authCustomer,addAddressController)
addressRouter.get("/getAddresses", authCustomer, getAddressesController)
addressRouter.patch("/updateAddressInfo/:addressId", authCustomer, updateAddressInfoController)
addressRouter.patch("/setDefault/:addressId", authCustomer, setAddressDefaultController)
addressRouter.delete("/deleteAddress/:addressId",authCustomer,deleteAddressController)



export default addressRouter;
