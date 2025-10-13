import crypto from "crypto";

import { sequelize } from "../../config/sequelize.js";
import { AppError } from "../../utils/AppError.js";

import Order from "../../model/Order.js";
import PaymentTransaction from "../../model/PaymentTransactions.js";


const { VNPAY_HASH_SECRET } = process.env;


/* ---------- Helpers: unify with checkoutPlaceService ---------- */

// lọc param rỗng + sort ↑
function sortAndClean(obj) {
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .sort(([a], [b]) => a.localeCompare(b))
    );
}

// encode theo application/x-www-form-urlencoded (space -> '+')
function formEncode(s) {
    return encodeURIComponent(String(s)).replace(/%20/g, "+");
}
function toFormQuery(sortedObj) {
    return Object.keys(sortedObj)
        .map(k => `${formEncode(k)}=${formEncode(sortedObj[k])}`)
        .join("&");
}

// HMAC SHA512 → UPPERCASE (match VNPay)
function hmac512(secret, data) {
    return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex").toUpperCase();
}

// dựng chuỗi ký
function buildSignData(paramsNoHash) {
    const sorted = sortAndClean(paramsNoHash);
    return toFormQuery(sorted);
}

// VNPay gửi amount = VND × 100 → so sánh dạng CHUỖI
function expectedAmount100(totalVnd) {
    const n = Number(totalVnd) || 0;
    return String(n * 100);
}

function normalizeVnpPayDate(input) {
    if (!input) return null;
    if (input instanceof Date && !isNaN(input)) return input;

    // Chuỗi MySQL "YYYY-MM-DD HH:mm:ss"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) {
        const [d, t] = input.split(" ");
        const [Y, M, D] = d.split("-").map(Number);
        const [h, m, s] = t.split(":").map(Number);
        const dt = new Date(Y, M - 1, D, h, m, s); // local time
        return isNaN(dt) ? null : dt;
    }

    // Chuỗi raw từ VNPay "yyyyMMddHHmmss" (phòng khi bạn truyền thẳng)
    if (/^\d{14}$/.test(input)) {
        const y = +input.slice(0, 4);
        const mo = +input.slice(4, 6) - 1;
        const d = +input.slice(6, 8);
        const h = +input.slice(8, 10);
        const mi = +input.slice(10, 12);
        const s = +input.slice(12, 14);
        const dt = new Date(y, mo, d, h, mi, s);
        return isNaN(dt) ? null : dt;
    }

    return null;
}


function normalizeAmountVnd(x) {
    const n = Number(x);
    return Number.isFinite(n) ? Math.trunc(n) : null;
}




// * ----------Core helpers---------- */
export async function findOrderByTxnRef(txnRef) {
    const paymentTxn = await PaymentTransaction.findOne({
        where: { provider: "vnpay", txnRef: String(txnRef) },
    });
    if (!paymentTxn) throw new AppError("UNKNOWN_TXN_REF", 400);

    const order = await Order.findByPk(paymentTxn.orderId);
    if (!order) throw new AppError("ORDER_NOT_FOUND", 400);

    return { order, paymentTxn };
}

export function verifySignature(allParams) {
    const provided = String(allParams?.vnp_SecureHash || "").toLowerCase();
    const toVerify = { ...allParams };
    delete toVerify.vnp_SecureHash;
    delete toVerify.vnp_SecureHashType;

    const signData = buildSignData(toVerify);
    const calc = hmac512(VNPAY_HASH_SECRET, signData).toLowerCase();
    return provided === calc;
}

export async function persistReturnLog(paymentTxnId, { signatureOk, respCode, raw }) {
    // Tên field có thể khác nhau tuỳ model map; sửa cho khớp model của bạn
    await PaymentTransaction.update(
        {
            rawResponse: JSON.stringify(raw || {}),
            signatureOk: signatureOk ? 1 : 0,
            vnpResponseCode: respCode ?? null,
        },
        { where: { paymentTxnId } }
    );
}


/* ---------- State transitions ---------- */

// Success: set cả payment_status & status = 'paid', set paid_at
export async function markOrderPaid(order, paymentTxn, detail = {}) {
    const now = new Date();
    const payDate = normalizeVnpPayDate(detail.vnpPayDate);
    const amountVndReceived = normalizeAmountVnd(detail.amountVndReceived);

    console.log("[VNPAY] markOrderPaid >>>", {
        orderId: order.orderId,
        txnId: paymentTxn.paymentTxnId,
        vnpTxnNo: detail.vnpTransactionNo,
        amountVndReceived,
        payDate
    });

    await sequelize.transaction(async (t) => {
        await Order.update(
            { paymentStatus: "paid", status: "confirmed", paidAt: now },
            { where: { orderId: order.orderId }, transaction: t }
        );

        await PaymentTransaction.update(
            {
                status: "paid",
                paidAt: now,
                vnpResponseCode: detail.respCode ?? "00",
                vnpTransactionNo: detail.vnpTransactionNo ?? null,
                vnpPayDate: payDate,                  // ✅ Date hợp lệ hoặc null
                vnpBankCode: detail.bankCode ?? null,
                vnpCardType: detail.cardType ?? null,
                amountVndReceived,                    // ✅ integer hoặc null
                failureReason: null,
            },
            { where: { paymentTxnId: paymentTxn.paymentTxnId }, transaction: t }
        );
    });

    console.log("[VNPAY] markOrderPaid <<< done");
}

// Fail: set payment_status = 'failed'; giữ status = 'pending' (cho phép retry)
export async function markOrderFailed(order, paymentTxn, reason = "FAILED") {
    console.warn("[VNPAY] markOrderFailed >>>", {
        orderId: order.orderId,
        txnId: paymentTxn.paymentTxnId,
        reason,
    });

    await sequelize.transaction(async (t) => {
        await Order.update(
            { paymentStatus: "failed" /* , status: "cancelled" */ },
            { where: { orderId: order.orderId }, transaction: t }
        );

        await PaymentTransaction.update(
            { status: "failed", failureReason: reason },
            { where: { paymentTxnId: paymentTxn.paymentTxnId }, transaction: t }
        );
    });

    console.warn("[VNPAY] markOrderFailed <<< done");
}



/* ---------- Orchestrator ---------- */
export async function handleVnpReturn(allParams) {
    const respCode = String(allParams?.vnp_ResponseCode || "");
    const txnRef = String(allParams?.vnp_TxnRef || "");
    const tmnCode = String(allParams?.vnp_TmnCode || "");
    const amount100 = String(allParams?.vnp_Amount || "");

    console.log("[VNPAY] /vnpay/return >>> incoming", {
        txnRef,
        respCode,
        tmnCode,
        amount100,
        hasHash: !!allParams?.vnp_SecureHash,
    });

    // 1) Tìm order & txn
    const { order, paymentTxn } = await findOrderByTxnRef(txnRef);
    console.log("[VNPAY] found order/txn", {
        orderId: order.orderId,
        txnId: paymentTxn.paymentTxnId,
        provider: paymentTxn.provider,
        orderTotalVnd: order.totalAmount,
    });

    // 2) Log raw trước (signatureOk tạm false)
    await persistReturnLog(paymentTxn.paymentTxnId, {
        signatureOk: false,
        respCode,
        raw: allParams,
    });

    // 2.1) Kiểm tra TmnCode
    if (tmnCode !== process.env.VNPAY_TMN_CODE) {
        console.error("[VNPAY] TMN mismatch", { tmnCode, expected: process.env.VNPAY_TMN_CODE });
        await markOrderFailed(order, paymentTxn, "WRONG_TMN_CODE");
        return { status: "failed", orderId: order.orderId, message: "Wrong TmnCode" };
    }

    // 3) Verify signature
    const toVerify = { ...allParams };
    delete toVerify.vnp_SecureHash; delete toVerify.vnp_SecureHashType;

    const signData = buildSignData(toVerify);
    const calcSig = hmac512(process.env.VNPAY_HASH_SECRET, signData);
    const provided = String(allParams?.vnp_SecureHash || "").toUpperCase();

    console.log("[VNPAY] signature check", {
        signDataSample: signData.slice(0, 120) + (signData.length > 120 ? "..." : ""),
        providedFirst8: provided.slice(0, 8),
        calcFirst8: calcSig.slice(0, 8),
        match: provided === calcSig,
    });

    if (provided !== calcSig) {
        await persistReturnLog(paymentTxn.paymentTxnId, { signatureOk: false, respCode, raw: allParams });
        await markOrderFailed(order, paymentTxn, "INVALID_SIGNATURE");
        return { status: "failed", orderId: order.orderId, message: "Invalid signature" };
    }
    await persistReturnLog(paymentTxn.paymentTxnId, { signatureOk: true, respCode, raw: allParams });

    // 4) Đối chiếu amount (chuỗi số ×100)
    const expected100 = expectedAmount100(order.totalAmount);
    const amountOk = amount100 === expected100;
    console.log("[VNPAY] amount check", { amount100, expected100, amountOk });

    if (!amountOk) {
        await markOrderFailed(order, paymentTxn, "AMOUNT_MISMATCH");
        return { status: "failed", orderId: order.orderId, message: "Amount mismatch" };
    }

    // 5) Quyết định theo respCode
    if (respCode === "00") {
        // Idempotent: nếu đã paid thì trả paid luôn
        if (String(order.paymentStatus).toLowerCase() === "paid") {
            console.log("[VNPAY] already paid – idempotent");
            return { status: "paid", orderId: order.orderId, message: "Already paid" };
        }

        await markOrderPaid(order, paymentTxn, {
            respCode: "00",
            vnpTransactionNo: allParams?.vnp_TransactionNo || null,
            vnpPayDate: allParams?.vnp_PayDate ?? null,    // yyyyMMddHHmmss (bạn có thể parse Date sau)
            bankCode: allParams?.vnp_BankCode || null,
            cardType: allParams?.vnp_CardType || null,
            amountVndReceived: Number(order.totalAmount) || 0,
        });

        console.log("[VNPAY] return <<< success");
        return { status: "paid", orderId: order.orderId, message: "Payment confirmed" };
    }

    await markOrderFailed(order, paymentTxn, `VNPAY_${respCode || "UNKNOWN"}`);
    console.warn("[VNPAY] return <<< failed", { respCode });
    return { status: "failed", orderId: order.orderId, message: `VNPay code ${respCode || "?"}` };
}
