
import express from 'express';


import { authCustomerOnly } from "../../middleware/auth.js"
const router = express.Router();

// Probe — chỉ để test middleware customer
router.get('/probe/checkCustomer', authCustomerOnly, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

export default router;
