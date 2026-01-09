// import { loginCustomerService, registerCustomerService } from "../service/customer/authService.js";



// export async function registerCustomerController(req, res, next) {
//   try {
//     const result = await registerCustomerService(req.body);
//     res.json(result);
//   } catch (err) {
//     next(err);
//   }
// }


// export async function loginCustomerController(req, res, next) {
//   try {
//     const result = await loginCustomerService(req.body);
//     res.json(result);
//   } catch (err) {
//     next(err);
//   }
// }

// new auth controller for demo

import { loginCustomerService, registerCustomerService } from "../service/customer/authService.js";
import { passCoreError } from "../utils/errorMapper.js";

export async function registerCustomerController(req, res, next) {
  try {
    const result = await registerCustomerService(req.body);
    res.json(result);
  } catch (err) {
    return passCoreError(res, err);
  }
}

export async function loginCustomerController(req, res, next) {
  try {
    const result = await loginCustomerService(req.body);
    res.json(result);
  } catch (err) {
    return passCoreError(res, err);
  }
}