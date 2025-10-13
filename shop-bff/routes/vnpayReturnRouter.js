
import { vnpayReturnPostController } from "../controller/vnpayReturnController.js";


import express from "express"

const vnpayReturnRouter = express.Router();

vnpayReturnRouter.post("/vnpay/return", vnpayReturnPostController);
// Chặn mọi method khác về 405 cho rõ ràng


// router.all("/vnpay/return", (req, res) => {
//   res.setHeader("Cache-Control", "no-store");
//   res.status(405).json({ success: false, message: "Method Not Allowed. Use POST." });
// });


export default vnpayReturnRouter;
