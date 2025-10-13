


import crypto from "crypto"; // [CHANGE] cần cho hmac512
import { sequelize } from "../../config/sequelize.js";
import { AppError } from "../../utils/AppError.js";
import Address from "../../model/Address.js";
import Order from "../../model/Order.js";
import PaymentTransaction from "../../model/PaymentTransactions.js";
import CartItem from "../../model/CartItem.js";
import Cart from "../../model/Cart.js";

import OrderItem from "../../model/OrderItem.js";
import ProductVariant from "../../model/ProductVariant.js";
import { previewCheckoutService } from "./checkOutService.js";
import { Op, Transaction } from "sequelize";
/* ---------- Helpers ---------- */
const ensureArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const toNum = (x, fb = null) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : fb;
};
const isPosInt = (x) => Number.isInteger(x) && x > 0;

/** Giá hiện tại từ ProductVariant.price */
function readCurrentPrice(variant) {
    const n = Number(variant?.price);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function calcShippingFee({ subtotal }) {
    const n = Number(subtotal) || 0;
    return n >= 30000000 ? 0 : 30000;
}

// ENV
const {
    VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET,
    VNPAY_ENDPOINT,
    VNPAY_RETURN_URL,
    PAYMENT_BT_IMAGE_URL,
    PAYMENT_BT_NOTE_TEMPLATE,
} = process.env;

/* ================= Helpers ================= */
function pad2(n) { return String(n).padStart(2, "0"); }

function formatVNPayDate(d = new Date()) {
    const y = d.getFullYear();
    const mo = pad2(d.getMonth() + 1);
    const da = pad2(d.getDate());
    const h = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    const s = pad2(d.getSeconds());
    return `${y}${mo}${da}${h}${mi}${s}`;
}

function sortObject(obj) {
    const sorted = {};
    Object.keys(obj).sort().forEach((k) => (sorted[k] = obj[k]));
    return sorted;
}

/* ==== new helpers for signed key ==== */
function sortAndClean(obj) {
    // sort theo alphabet + bỏ undefined/null/""
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .sort(([a], [b]) => a.localeCompare(b))
    );
}

// encode theo application/x-www-form-urlencoded: space -> '+'
function formEncode(s) {
    return encodeURIComponent(String(s)).replace(/%20/g, "+");
}


function toFormQuery(sortedObj) {
    return Object.keys(sortedObj)
        .map((k) => `${formEncode(k)}=${formEncode(sortedObj[k])}`)
        .join("&");
}

function hmac512(secret, data) {
    // VNPay so sánh UPPERCASE
    return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex").toUpperCase();
}

function buildSignedUrl(endpoint, params, secret) {
    const sorted = sortAndClean(params);          // bỏ rỗng + sort
    const signData = toFormQuery(sorted);         // space -> '+'
    const secureHash = hmac512(secret, signData); // UPPERCASE
    return `${endpoint}?${signData}&vnp_SecureHash=${secureHash}`;
}
/// /* ==== end new helpers for signed key ==== */

/** Sinh mã tham chiếu duy nhất, encode kèm orderId để đối chiếu */
function makeTxnRef(orderId, now = new Date()) {
    const stamp = formatVNPayDate(now); // yyyyMMddHHmmss
    return `ORDER-${orderId}-${stamp}`;
}

/** Lấy snapshot giao hàng: ưu tiên Address theo addressId, fallback shippingSnapshot */
async function resolveShippingSnapshot({ addressId, shippingSnapshot, userId, t = null }) {
    if (isPosInt(toNum(addressId))) {
        const addr = await Address.findOne({ where: { addressId: toNum(addressId), userId: toNum(userId) }, transaction: t });
        if (!addr) throw new AppError("Address not found", 400);
        return {
            recipientName: addr.recipientName || null,
            phoneNumber: addr.phoneNumber || null,
            addressLine: addr.addressLine || null,
            city: addr.city || null,
            state: addr.state || null,
            postalCode: addr.postalCode || null,
            country: addr.country || null,
        };
    }
    // fallback: dùng shippingSnapshot từ body (trường hợp khách chưa lưu address)
    if (shippingSnapshot && typeof shippingSnapshot === "object") {
        return {
            recipientName: shippingSnapshot.shippingName || null,
            phoneNumber: shippingSnapshot.shippingPhone || null,
            addressLine: shippingSnapshot.shippingAddress || null,
            city: shippingSnapshot.shippingCity || null,
            state: shippingSnapshot.shippingState || null,
            postalCode: shippingSnapshot.postalCode ?? shippingSnapshot.shippingPostal ?? null,
            country: shippingSnapshot.shippingCountry || null,


        };
    }
    throw new AppError("Missing shipping info (addressId or shippingSnapshot)", 400);
}

/* --------- BANK TRANSFER instructions --------- */
// [CHANGE] chuẩn hoá số ĐT
function sanitizePhone(p) { return p ? String(p).replace(/[^\d+]/g, "") : ""; }

// [CHANGE] trả về note (rendered) + phone + giữ template để audit
function buildBankTransferInstructions({ orderId, shippingPhone }) {
    const tpl = PAYMENT_BT_NOTE_TEMPLATE || "{phone}-{orderId}";
    const phone = sanitizePhone(shippingPhone);
    const note = tpl
        .replaceAll("{orderId}", String(orderId))
        .replaceAll("{phone}", phone);
    return {
        imageUrl: PAYMENT_BT_IMAGE_URL || null,
        note,                 // [CHANGE] giá trị hiển thị cho KH
        phone,                // [CHANGE] cho KH dễ copy
        // noteTemplate: tpl,    // (audit) template gốc
        noteHint: "Vui lòng ghi đúng nội dung chuyển khoản như trên để đối soát nhanh.",
    };
}

/* * ================= Service chính ================= */
/**
 * Tạo đơn hàng theo phương thức thanh toán.
 * - COD: payment_status = 'unpaid'
 * - BANK_TRANSFER: payment_status = 'pending', trả paymentInstructions
 * - VNPAY: payment_status = 'pending', tạo payment_transactions + trả paymentUrl
 */
// export async function checkoutPlaceService({
//     userId,
//     paymentMethodCode,
//     addressId = null,
//     shippingSnapshot = null,
//     source = "cart",
//     items = [],
// } = {}) {
//     const uid = toNum(userId);
//     if (!isPosInt(uid)) throw new AppError("Invalid userId", 400);

//     const method = String(paymentMethodCode || "").toUpperCase();
//     if (!["COD", "BANK_TRANSFER", "VNPAY"].includes(method)) {
//         throw new AppError("Unsupported payment method", 400);
//     }

//     // 1) Tính tiền qua preview
//     const preview = await previewCheckoutService({
//         userId: uid,
//         source,
//         items,
//         addressId,
//         shippingSnapshot,
//     });

//     // Chặn case không có dòng hợp lệ
//     const hasAnyPriced = (preview?.lines || []).some(
//         (l) => toNum(l.qtyPriced) > 0 && Number.isFinite(l.unitPrice)
//     );
//     if (!hasAnyPriced) throw new AppError("No valid items to place order", 400);

//     // 2) Snapshot địa chỉ
//     const shipSnap = await resolveShippingSnapshot({
//         addressId,
//         shippingSnapshot,
//         userId: uid,
//     });
//      console.log("shipSnap : ", shipSnap)

//     // 3) Tạo order + (tuỳ method) tạo payment transaction / build URL
//     return await sequelize.transaction(async (t) => {
//         // Note mặc định theo phương thức
//         let initialNote = null;
//         if (method === "COD") initialNote = "Thanh toán khi nhận hàng";
//         if (method === "VNPAY") initialNote = "Thanh toán VNPay - chờ xác nhận";
//         // (BANK_TRANSFER sẽ cập nhật note sau khi có orderId)

//         // 3.1) Tạo ORDER
//         const order = await Order.create(
//             {
//                 userId: uid,
//                 addressId: isPosInt(toNum(addressId)) ? toNum(addressId) : null,
//                 status: "pending",
//                 totalAmount: toNum(preview?.totals?.grandTotal, 0), 

//                 // snapshot địa chỉ
//                 shippingName: shipSnap.recipientName,
//                 shippingPhone: shipSnap.phoneNumber,
//                 shippingAddress: shipSnap.addressLine,
//                 shippingCity: shipSnap.city,
//                 shippingState: shipSnap.state,
//                 shippingPostal: shipSnap.postalCode,
//                 shippingCountry: shipSnap.country,




//                 // thanh toán
//                 paymentMethodCode: method,
//                 paymentStatus: method === "COD" ? "unpaid" : "pending",

//                 // ghi note ngay khi tạo (COD/VNPAY có sẵn, BANK_TRANSFER cập nhật sau)
//                 note: initialNote,

//                 // [CHANGE] snapshot tạm thời: tránh null ở lúc mới tạo (optional)
//                 paymentInstructionsSnapshot:
//                     method === "BANK_TRANSFER"
//                         ? buildBankTransferInstructions({
//                             orderId: "PENDING",
//                             shippingPhone: shipSnap.phoneNumber,
//                         })
//                         : null,
//             },
//             { transaction: t }
//         );
//         // console.log( shippingName)
//         // console.log(shippingPhone)
//         // console.log( shippingAddress)

//         // 3.1b) Nếu BANK_TRANSFER: cập nhật snapshot & note sau khi đã có orderId
//         let finalSnap = null; // [CHANGE] giữ lại để trả FE
//         if (method === "BANK_TRANSFER") {
//             finalSnap = buildBankTransferInstructions({
//                 orderId: order.orderId,
//                 shippingPhone: shipSnap.phoneNumber,
//             });
//             await order.update(
//                 {
//                     paymentInstructionsSnapshot: finalSnap,
//                     note: `Chuyển khoản - ORDER-${order.orderId}`,
//                 },
//                 { transaction: t }
//             );
//         }

//         // 3.2) (TODO) bulkCreate OrderItems từ preview.lines…

//         // 3.3) Theo phương thức thanh toán → trả kết quả phù hợp
//         if (method === "COD") {
//             return {
//                 orderId: order.orderId,
//                 paymentMethodCode: method,
//                 paymentStatus: order.paymentStatus, // unpaid
//                 message: "Thanh toán khi nhận hàng",
//             };
//         }

//         if (method === "BANK_TRANSFER") {
//             // [CHANGE] dùng finalSnap vừa lưu DB để trả về FE (tránh lệch)
//             return {
//                 orderId: order.orderId,
//                 paymentMethodCode: method,
//                 paymentStatus: order.paymentStatus, // pending
//                 paymentInstructions: finalSnap,
//             };
//         }

//         // VNPAY
//         if (method === "VNPAY") {
//             // tạo payment_transactions
//             const txnRef = makeTxnRef(order.orderId);
//             await PaymentTransaction.create(
//                 {
//                     orderId: order.orderId,
//                     provider: "vnpay",
//                     txnRef,
//                     amountVnd: toNum(order.totalAmount, 0),
//                     status: "pending",
//                 },
//                 { transaction: t }
//             );

//             // build VNPay URL
//             const vnpParams = {
//                 vnp_Version: "2.1.0",
//                 vnp_Command: "pay",
//                 vnp_TmnCode: VNPAY_TMN_CODE,
//                 vnp_Locale: "vn",
//                 vnp_CurrCode: "VND",
//                 vnp_TxnRef: txnRef,
//                 vnp_OrderInfo: `Thanh toan don hang #${order.orderId}`,
//                 vnp_OrderType: "other",
//                 vnp_Amount: toNum(order.totalAmount, 0) * 100, // VND × 100
//                 vnp_ReturnUrl: (VNPAY_RETURN_URL || "").replace(
//                     ":orderId",
//                     String(order.orderId)
//                 ),
//                 vnp_IpAddr: "0.0.0.0", // nếu muốn, truyền IP thật ở controller
//                 vnp_CreateDate: formatVNPayDate(new Date()),
//             };

//             // Bảo vệ ENV
//             if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_ENDPOINT || !VNPAY_RETURN_URL) {
//                 throw new AppError("VNPay env is not configured", 500);
//             }

//             const paymentUrl = buildSignedUrl(
//                 VNPAY_ENDPOINT,
//                 vnpParams,
//                 VNPAY_HASH_SECRET
//             );

//             return {
//                 orderId: order.orderId,
//                 paymentMethodCode: method,
//                 paymentStatus: order.paymentStatus, // pending
//                 paymentUrl,
//             };
//         }

//         throw new AppError("Unsupported payment method", 400);
//     });
// }



export async function checkoutPlaceService({
  userId,
  paymentMethodCode,
  addressId = null,
  shippingSnapshot = null,
  source = "cart",          // "cart" | "buy_now"
  items = [],               // cho buy_now: [{ variantId, qty }, ...] (nếu preview đã xử lý vẫn ok)
} = {}) {
  const uid = toNum(userId);
  if (!isPosInt(uid)) throw new AppError("Invalid userId", 400);

  const method = String(paymentMethodCode || "").toUpperCase();
  if (!["COD", "BANK_TRANSFER", "VNPAY"].includes(method)) {
    throw new AppError("Unsupported payment method", 400);
  }

  // 1) Preview để lấy totals và lines (ẩn các rule định giá vào 1 chỗ)
  const preview = await previewCheckoutService({
    userId: uid,
    source,
    items,
    addressId,
    shippingSnapshot,
  });

  const hasAnyPriced = (preview?.lines || []).some(
    (l) => toNum(l.qtyPriced) > 0 && Number.isFinite(toNum(l.unitPrice))
  );
  if (!hasAnyPriced) throw new AppError("No valid items to place order", 400);

  // 2) Snapshot địa chỉ giao hàng
  const shipSnap = await resolveShippingSnapshot({
    addressId,
    shippingSnapshot,
    userId: uid,
  });

  // 3) Transaction: tạo Order, copy items, dọn cart, tạo payment nếu cần
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      // Note mặc định theo phương thức
      let initialNote = null;
      if (method === "COD") initialNote = "Thanh toán khi nhận hàng";
      if (method === "VNPAY") initialNote = "Thanh toán VNPay - chờ xác nhận";

      // === 3.1) Tạo ORDER (tạm set theo preview, sẽ tính lại từ payload) ===
      const order = await Order.create(
        {
          userId: uid,
          addressId: isPosInt(toNum(addressId)) ? toNum(addressId) : null,

          status: "pending",
          totalAmount: toNum(preview?.totals?.grandTotal, 0), // sẽ update lại

          // snapshot địa chỉ
          shippingName: shipSnap.recipientName,
          shippingPhone: shipSnap.phoneNumber,
          shippingAddress: shipSnap.addressLine,
          shippingCity: shipSnap.city,
          shippingState: shipSnap.state,
          shippingPostal: shipSnap.postalCode,
          shippingCountry: shipSnap.country,

          // thanh toán
          paymentMethodCode: method,
          paymentStatus: method === "COD" ? "unpaid" : "pending",

          // note
          note: initialNote,

          // snapshot hướng dẫn thanh toán (Bank Transfer cập nhật lại sau khi có orderId)
          paymentInstructionsSnapshot:
            method === "BANK_TRANSFER"
              ? buildBankTransferInstructions({
                  orderId: "PENDING",
                  shippingPhone: shipSnap.phoneNumber,
                })
              : null,
        },
        { transaction: t }
      );

      // 3.1b) Bank transfer: cập nhật instruction + note sau khi có orderId
      let bankInstructions = null;
      if (method === "BANK_TRANSFER") {
        bankInstructions = buildBankTransferInstructions({
          orderId: order.orderId,
          shippingPhone: shipSnap.phoneNumber,
        });
        await order.update(
          {
            paymentInstructionsSnapshot: bankInstructions,
            note: `Chuyển khoản - ORDER-${order.orderId}`,
          },
          { transaction: t }
        );
      }

      // === 3.2) Chuẩn bị payload cho order_items (đúng schema OrderItem của bạn) ===
      let oiPayload = [];

      if (String(source).toLowerCase() === "cart") {
        // Lấy cart_items trực tiếp từ DB để dùng snapshot/price chính xác
        const userCart = await Cart.findOne({
          where: { userId: uid },
          include: [
            {
              model: CartItem,
              as: "items",
              required: true,
              include: [
                {
                  model: ProductVariant,
                  as: "variant",
                  attributes: ["variantId", "price", "productId"], // KHÔNG có salePrice
                },
              ],
            },
          ],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        const cartItems = userCart?.items ?? [];
        if (cartItems.length === 0) {
          throw new AppError("Cart is empty", 400);
        }

        oiPayload = cartItems.map((ci) => {
          const qty = toNum(ci.quantity);
          const unit = (ci.unitPriceSnapshot != null && ci.unitPriceSnapshot !== "")
            ? toNum(ci.unitPriceSnapshot)
            : toNum(ci.variant?.price, 0); // fallback về price của Variant

          if (!isPosInt(qty) || !Number.isFinite(unit) || unit < 0) {
            throw new AppError("Invalid cart line", 400);
          }

          return {
            orderId: order.orderId,
            productId: ci.variant?.productId,   // lấy trực tiếp từ Variant
            variantId: ci.variantId,
            quantity: qty,
            price: unit,                        // đơn giá (unit price)
          };
        });
      } else {
        // source = "buy_now" (hoặc khác): dùng preview.lines đã chuẩn hoá
        const lines = (preview?.lines ?? []).filter(
          (l) => toNum(l.qtyPriced) > 0 && Number.isFinite(toNum(l.unitPrice))
        );

        if (lines.length === 0) {
          throw new AppError("No valid items to place order", 400);
        }

        oiPayload = lines.map((l) => {
          const qty = toNum(l.qtyPriced);
          const unit = toNum(l.unitPrice);
          const variantId = l.variantId ?? l.variant?.variantId ?? null;
          const productId = l.productId ?? l.variant?.productId ?? null;

          if (!isPosInt(qty) || !isPosInt(toNum(variantId)) || !isPosInt(toNum(productId))) {
            throw new AppError("Invalid buy_now line", 400);
          }

          return {
            orderId: order.orderId,
            productId,
            variantId,
            quantity: qty,
            price: unit, // đơn giá (unit price)
          };
        });
      }

      // Tạo order_items
      await OrderItem.bulkCreate(oiPayload, { transaction: t });

      // Tính lại total từ payload (qty * price) + ship - discount
      const merchandiseTotal = oiPayload.reduce(
        (sum, it) => sum + toNum(it.quantity) * toNum(it.price),
        0
      );
      const shippingFee = toNum(preview?.totals?.shippingFee, 0);
      const discount = toNum(preview?.totals?.discount, 0);
      const grandTotal = merchandiseTotal + shippingFee - discount;

      await order.update({ totalAmount: grandTotal }, { transaction: t });

      // === 3.3) Nếu source=cart: xoá cart_items đã đặt ===
      if (String(source).toLowerCase() === "cart") {
        const variantIdsPlaced = oiPayload.map((it) => it.variantId).filter(Boolean);
        const userCart = await Cart.findOne({
          where: { userId: uid },
          attributes: ["cartId"],
          transaction: t,
        });
        if (userCart && variantIdsPlaced.length > 0) {
          await CartItem.destroy({
            where: { cartId: userCart.cartId, variantId: { [Op.in]: variantIdsPlaced } },
            transaction: t,
          });
        }
      }

      // === 3.4) Tuỳ phương thức thanh toán: trả output ===
      if (method === "COD") {
        return {
          orderId: order.orderId,
          paymentMethodCode: method,
          paymentStatus: order.paymentStatus, // "unpaid"
          message: "Thanh toán khi nhận hàng",
        };
      }

      if (method === "BANK_TRANSFER") {
        return {
          orderId: order.orderId,
          paymentMethodCode: method,
          paymentStatus: order.paymentStatus, // "pending"
          paymentInstructions: bankInstructions,
        };
      }

      // === VNPAY ===
      if (method === "VNPAY") {
        // Tạo payment_transactions
        const txnRef = makeTxnRef(order.orderId);

        await PaymentTransaction.create(
          {
            orderId: order.orderId,
            provider: "vnpay",
            txnRef,
            amountVnd: toNum(order.totalAmount, 0),
            status: "pending",
          },
          { transaction: t }
        );

        // Check ENV
        if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_ENDPOINT || !VNPAY_RETURN_URL) {
          throw new AppError("VNPay env is not configured", 500);
        }

        const vnpParams = {
          vnp_Version: "2.1.0",
          vnp_Command: "pay",
          vnp_TmnCode: VNPAY_TMN_CODE,
          vnp_Locale: "vn",
          vnp_CurrCode: "VND",
          vnp_TxnRef: txnRef,
          vnp_OrderInfo: `Thanh toan don hang #${order.orderId}`,
          vnp_OrderType: "other",
          vnp_Amount: toNum(order.totalAmount, 0) * 100, // VND × 100
          vnp_ReturnUrl: (VNPAY_RETURN_URL || "").replace(":orderId", String(order.orderId)),
          vnp_IpAddr: "0.0.0.0", // controller có thể truyền IP thật của client
          vnp_CreateDate: formatVNPayDate(new Date()),
        };

        const paymentUrl = buildSignedUrl(VNPAY_ENDPOINT, vnpParams, VNPAY_HASH_SECRET);

        return {
          orderId: order.orderId,
          paymentMethodCode: method,
          paymentStatus: order.paymentStatus, // "pending"
          paymentUrl,
        };
      }

      // fallback (không tới đây)
      throw new AppError("Unsupported payment method", 400);
    }
  );
}