import { addAddressController,getAddressesByUserIdController,updateAddressController,setAddressDefaultController,deleteAddressController } from "../../controller/internal/addressController.js";

import express from "express"

import { checkInternalKey } from "../../middleware/checkInternalKey.js";



const addressRouter = express.Router()
addressRouter.post("/addAddress/:userId",checkInternalKey,addAddressController)
addressRouter.get("/getAddresses/:userId",checkInternalKey,getAddressesByUserIdController)
addressRouter.patch("/updateAddress/:userId/info/:addressId",checkInternalKey,updateAddressController)
addressRouter.patch("/updateAddress/:userId/default/:addressId",checkInternalKey,setAddressDefaultController)
addressRouter.delete("/deleteAddress/:userId/del/:addressId",checkInternalKey,deleteAddressController)

export default addressRouter;

