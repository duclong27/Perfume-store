import { Op, fn, col, where } from "sequelize";
import Order from "../../model/Order.js";
import { sequelize } from "../../config/sequelize.js";
import { Transaction } from "sequelize";


/**
 * Admin: lấy danh sách Orders (không join), phân trang + tìm kiếm nhẹ.
 * - q: tìm theo orderId (nếu q là số), hoặc theo shippingName/Phone (LIKE, case-insensitive)
 * - Có thể truyền kèm các filter đơn giản: status, paymentStatus, paymentMethodCode, createdFrom, createdTo
 */
export async function getAllOrdersService({
    page = 1,
    limit = 1000,
    q,
    status,              // 'pending' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled'
    paymentStatus,       // 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled'
    paymentMethodCode,   // 'COD' | 'BANK_TRANSFER' | 'VNPAY'
    createdFrom,         // ISO string/date
    createdTo,           // ISO string/date
} = {}) {
    // paginate
    const p = Number.isFinite(+page) && +page > 0 ? Math.floor(+page) : 1;
    const l = Number.isFinite(+limit) && +limit > 0 ? Math.min(1000, Math.floor(+limit)) : 1000;
    const offset = (p - 1) * l;

    // normalize q
    const ql = typeof q === "string" ? q.trim().toLowerCase() : "";
    const qNum = Number(ql);
    const isNumSearch = Number.isInteger(qNum) && qNum > 0;

    // build filters
    const andFilters = [];

    // q: nếu là số → ưu tiên match orderId; nếu là chữ/số → LIKE shippingName/Phone (lowercase)
    if (ql) {
        if (isNumSearch) {
            andFilters.push({ orderId: qNum });
        } else {
            const nameLike = where(fn("LOWER", col("shipping_name")), { [Op.like]: `%${ql}%` });
            const phoneLike = where(fn("LOWER", col("shipping_phone")), { [Op.like]: `%${ql}%` });
            andFilters.push({ [Op.or]: [nameLike, phoneLike] });
        }
    }

    if (status) andFilters.push({ status });
    if (paymentStatus) andFilters.push({ paymentStatus });
    if (paymentMethodCode) andFilters.push({ paymentMethodCode });

    // createdAt range
    const createdRange = {};
    if (createdFrom) createdRange[Op.gte] = new Date(createdFrom);
    if (createdTo) createdRange[Op.lte] = new Date(createdTo);
    if (Object.keys(createdRange).length > 0) {
        andFilters.push({ createdAt: createdRange });
    }

    const whereClause = andFilters.length ? { [Op.and]: andFilters } : undefined;

    const { rows, count } = await Order.findAndCountAll({
        where: whereClause,
        attributes: [
            "orderId",
            "userId",
            "addressId",
            "status",                    // pending|confirmed|paid|shipped|completed|cancelled
            "paymentMethodCode",         // COD|BANK_TRANSFER|VNPAY
            "paymentStatus",             // unpaid|pending|paid|failed|cancelled
            "totalAmount",
            "paidAt",
            "createdAt",
            "shippingName",
            "shippingPhone",
            "shippingAddress",
            "shippingCity",
            "shippingState",
            "shippingPostal",
            "shippingCountry",
            "paymentInstructionsSnapshot",

        ],
        order: [["createdAt", "DESC"]],
        limit: l,
        offset,
    });

    return { rows, total: count, page: p, limit: l };
}




// services/orders/updateOrderStatusAndPaymentStatusService.js


// Fulfillment flow (không dùng 'paid' legacy)
const FULFILL_FLOW = ["pending", "confirmed", "shipped", "completed"];
const FULFILL_ENUM = [...FULFILL_FLOW, "cancelled", "paid"]; // 'paid' là legacy -> chặn khi set
const PAYMENT_ENUM = ["unpaid", "pending", "paid", "failed", "cancelled"];

/** RULE: paymentStatus với 'unpaid' */
function canTransitionPaymentStatus(cur, nxt, paymentMethodCode) {
    const c = String(cur ?? "").toLowerCase();                 // unpaid|pending|paid|failed|cancelled
    const n = nxt == null || nxt === "" ? undefined : String(nxt).toLowerCase();
    const pm = String(paymentMethodCode ?? "").toUpperCase();  // VNPAY|COD|BANK_TRANSFER ...

    if (!n) return true;           // không đổi
    if (c === n) return true;      // idempotent

    // VNPAY: cấm "paid tay"
    if (pm === "VNPAY" && n === "paid") return false;

    // đã paid thì không đổi nữa
    if (c === "paid") return false;

    // unpaid → pending | failed
    if (c === "unpaid" && (n === "pending" || n === "failed")) return true;

    // pending → paid | failed
    if (c === "pending" && (n === "paid" || n === "failed")) return true;

    // bất kỳ không-phải-paid → failed
    if (n === "failed" && c !== "paid") return true;

    // không cho unpaid → paid (phải qua pending)
    if (c === "unpaid" && n === "paid") return false;

    // không cho set 'cancelled' qua endpoint này (nếu muốn, mở rule riêng)
    if (n === "cancelled") return false;

    return false;
}




/** RULE: fulfillment status */
function canTransitionOrderStatus(cur, nxt, effectivePaymentStatus) {
    const c = String(cur ?? "").toLowerCase();
    const n = nxt == null || nxt === "" ? undefined : String(nxt).toLowerCase();
    const pay = String(effectivePaymentStatus ?? "").toLowerCase();

    if (!n) return true;       // không đổi
    if (c === n) return true;  // idempotent

    // cấm set 'paid' (legacy)
    if (n === "paid") return false;

    // cancelled: chỉ khi đang pending/confirmed
    if (n === "cancelled") return c === "pending" || c === "confirmed";

    // completed: chỉ được từ 'shipped' và khi paymentStatus = 'paid'
    if (n === "completed") {
        const iC = FULFILL_FLOW.indexOf(c);
        const iN = FULFILL_FLOW.indexOf(n);
        if (!(iC >= 0 && iN === iC + 1)) return false; // phải là 'shipped' → 'completed'
        return pay === "paid";
    }

    // enforce đi đúng 1 nấc: pending→confirmed→shipped→completed
    const iC = FULFILL_FLOW.indexOf(c);
    const iN = FULFILL_FLOW.indexOf(n);
    return iC >= 0 && iN === iC + 1;
}

/**
 * Chỉ cập nhật: order.status (fulfillment) &/hoặc order.paymentStatus
 * - Enforce mọi rule ở trên
 * - Tự set paidAt khi chuyển sang 'paid' lần đầu
 */
// export async function updateOrderStatusAndPaymentStatusService(orderId, payload = {}) {
//     if (!orderId) {
//         const e = new Error("ORDER_ID_REQUIRED");
//         e.statusCode = 400;
//         throw e;
//     }

//     const hasOrder = Object.prototype.hasOwnProperty.call(payload, "orderStatus");
//     const hasPay = Object.prototype.hasOwnProperty.call(payload, "paymentStatus");
//     if (!hasOrder && !hasPay) {
//         const e = new Error("NO_FIELDS_TO_UPDATE");
//         e.statusCode = 400;
//         throw e;
//     }
//     //

//     const nextOrderStatusRaw = hasOrder ? payload.orderStatus : undefined;
//     const nextPaymentStatusRaw = hasPay ? payload.paymentStatus : undefined;

//     const nextOrderStatus = typeof nextOrderStatusRaw === "string" && nextOrderStatusRaw.trim() !== ""
//         ? nextOrderStatusRaw.trim().toLowerCase()
//         : undefined;

//     const nextPaymentStatus = typeof nextPaymentStatusRaw === "string" && nextPaymentStatusRaw.trim() !== ""
//         ? nextPaymentStatusRaw.trim().toLowerCase()
//         : undefined;


//     // Enum guard (bẫy typo như 'comfirmed')
//     if (hasOrder && nextOrderStatus && !FULFILL_ENUM.includes(nextOrderStatus)) {
//         const e = new Error(`INVALID_ORDER_STATUS '${nextOrderStatus}'`);
//         e.statusCode = 400;
//         throw e;
//     }
//     if (hasPay && nextPaymentStatus && !PAYMENT_ENUM.includes(nextPaymentStatus)) {
//         const e = new Error(`INVALID_PAYMENT_STATUS '${nextPaymentStatus}'`);
//         e.statusCode = 400;
//         throw e;
//     }

//     return await sequelize.transaction(
//         { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
//         async (t) => {
//             // lock row để tránh race
//             const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
//             if (!order) {
//                 const e = new Error("ORDER_NOT_FOUND");
//                 e.statusCode = 404;
//                 throw e;
//             }

//             // Validate payment first (vì fulfillment completed phụ thuộc payment)
//             if (hasPay) {
//                 const okPay = canTransitionPaymentStatus(order.paymentStatus, nextPaymentStatus, order.paymentMethodCode);
//                 if (!okPay) {
//                     const e = new Error("INVALID_PAYMENT_STATUS_TRANSITION");
//                     e.statusCode = 400;
//                     throw e;
//                 }
//             }

//             // payment “sau patch” để check completed
//             const effectivePayment = hasPay ? nextPaymentStatus : String(order.paymentStatus ?? "").toLowerCase();

//             // Validate fulfillment
//             if (hasOrder) {
//                 const okFul = canTransitionOrderStatus(order.status, nextOrderStatus, effectivePayment);
//                 if (!okFul) {
//                     const e = new Error("INVALID_ORDER_STATUS_TRANSITION");
//                     e.statusCode = 400;
//                     throw e;
//                 }
//             }

//             // No-op?
//             if (
//                 (!hasPay || nextPaymentStatus === String(order.paymentStatus ?? "").toLowerCase()) &&
//                 (!hasOrder || nextOrderStatus === String(order.status ?? "").toLowerCase())
//             ) {
//                 return order; // không đổi gì
//             }

//             // Persist
//             if (hasPay && nextPaymentStatus) {
//                 order.paymentStatus = nextPaymentStatus;
//                 if (nextPaymentStatus === "paid" && !order.paidAt) {
//                     order.paidAt = new Date();
//                 }
//             }

//             if (hasOrder && nextOrderStatus) {
//                 if (nextOrderStatus === "paid") { // chặn legacy
//                     const e = new Error("STATUS_PAID_IS_LEGACY_NOT_ALLOWED");
//                     e.statusCode = 400;
//                     throw e;
//                 }
//                 order.status = nextOrderStatus;
//             }

//             await order.save({ transaction: t });
//             return order;
//         }
//     );
// }


export async function updateOrderStatusAndPaymentStatusService(orderId, payload = {}) {
    if (!orderId) {
        const e = new Error("ORDER_ID_REQUIRED");
        e.statusCode = 400;
        throw e;
    }

    const hasOrder = Object.prototype.hasOwnProperty.call(payload, "orderStatus");
    const hasPay = Object.prototype.hasOwnProperty.call(payload, "paymentStatus");
    if (!hasOrder && !hasPay) {
        const e = new Error("NO_FIELDS_TO_UPDATE");
        e.statusCode = 400;
        throw e;
    }

    // --- chuẩn hóa input: chỉ coi là thay đổi khi có giá trị thật (non-empty) ---
    const nextOrderStatusRaw = hasOrder ? payload.orderStatus : undefined;
    const nextPaymentStatusRaw = hasPay ? payload.paymentStatus : undefined;

    const nextOrderStatus = (typeof nextOrderStatusRaw === "string" && nextOrderStatusRaw.trim() !== "")
        ? nextOrderStatusRaw.trim().toLowerCase()
        : undefined;

    const nextPaymentStatus = (typeof nextPaymentStatusRaw === "string" && nextPaymentStatusRaw.trim() !== "")
        ? nextPaymentStatusRaw.trim().toLowerCase()
        : undefined;

    // --- Enum guards (bẫy typo) ---
    if (hasOrder && nextOrderStatus && !FULFILL_ENUM.includes(nextOrderStatus)) {
        const e = new Error(`INVALID_ORDER_STATUS '${nextOrderStatus}'`);
        e.statusCode = 400;
        throw e;
    }
    if (hasPay && nextPaymentStatus && !PAYMENT_ENUM.includes(nextPaymentStatus)) {
        const e = new Error(`INVALID_PAYMENT_STATUS '${nextPaymentStatus}'`);
        e.statusCode = 400;
        throw e;
    }

    return await sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
        async (t) => {
            // lock row để tránh race condition
            const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!order) {
                const e = new Error("ORDER_NOT_FOUND");
                e.statusCode = 404;
                throw e;
            }

            // Validate payment trước (completed phụ thuộc payment)
            if (hasPay) {
                const okPay = canTransitionPaymentStatus(order.paymentStatus, nextPaymentStatus, order.paymentMethodCode);
                if (!okPay) {
                    const e = new Error("INVALID_PAYMENT_STATUS_TRANSITION");
                    e.statusCode = 400;
                    throw e;
                }
            }

            // payment “sau patch” — chỉ override khi nextPaymentStatus có giá trị thật
            const currentPay = String(order.paymentStatus ?? "").toLowerCase();
            const effectivePayment = nextPaymentStatus ?? currentPay;

            // Validate fulfillment
            if (hasOrder) {
                const okFul = canTransitionOrderStatus(order.status, nextOrderStatus, effectivePayment);
                if (!okFul) {
                    const e = new Error("INVALID_ORDER_STATUS_TRANSITION");
                    e.statusCode = 400;
                    throw e;
                }
            }

            // No-op? (xem undefined là không đổi)
            const currentFul = String(order.status ?? "").toLowerCase();
            const noPayChange = !hasPay || nextPaymentStatus === undefined || nextPaymentStatus === currentPay;
            const noFulChange = !hasOrder || nextOrderStatus === undefined || nextOrderStatus === currentFul;
            if (noPayChange && noFulChange) {
                return order;
            }

            // Persist
            if (hasPay && nextPaymentStatus) {
                order.paymentStatus = nextPaymentStatus;
                if (nextPaymentStatus === "paid" && !order.paidAt) {
                    order.paidAt = new Date();
                }
            }

            if (hasOrder && nextOrderStatus) {
                if (nextOrderStatus === "paid") { // chặn legacy
                    const e = new Error("STATUS_PAID_IS_LEGACY_NOT_ALLOWED");
                    e.statusCode = 400;
                    throw e;
                }
                order.status = nextOrderStatus;
            }

            await order.save({ transaction: t });
            return order;
        }
    );
}
