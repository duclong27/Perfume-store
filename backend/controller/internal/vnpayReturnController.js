import { handleVnpReturn } from "../../service/internal/vnpayReturnService.js";

import { passCoreError } from "../../utils/tempCoreError.js";





// helper: parse "YYYYMMDDHHmmss" -> "YYYY-MM-DD HH:MM:SS"
function parseVnpPayDateToMysql(vnpPayDate) {
    if (!/^\d{14}$/.test(vnpPayDate || "")) return null;
    const y = vnpPayDate.slice(0, 4);
    const M = vnpPayDate.slice(4, 6);
    const d = vnpPayDate.slice(6, 8);
    const h = vnpPayDate.slice(8, 10);
    const m = vnpPayDate.slice(10, 12);
    const s = vnpPayDate.slice(12, 14);
    return `${y}-${M}-${d} ${h}:${m}:${s}`;
}

function pickVnpParams(src = {}) {
    const out = {};
    for (const [k, v] of Object.entries(src)) {
        if (!k || !k.startsWith("vnp_")) continue;
        if (v === undefined || v === null) continue;
       
        out[k] = typeof v === "string" ? v : String(v);
    }
    return out;
}

export const vnpayReturnController = async (req, res) => {
    try {
      
        const vnpParams = pickVnpParams(req.body || {});
        if (Object.keys(vnpParams).length === 0) {
            return res.status(400).json({ ok: false, message: "Missing vnp_* params" });
        }


        const normalized = {
            amountVnd: (() => {
                const n = Number(vnpParams.vnp_Amount);
                return Number.isFinite(n) ? Math.round(n / 100) : null; // VNPay trả *100
            })(),
            payDateMySql: parseVnpPayDateToMysql(vnpParams.vnp_PayDate), // "YYYY-MM-DD HH:MM:SS" hoặc null
            responseOk: vnpParams.vnp_ResponseCode === "00",
            tranStatusOk: vnpParams.vnp_TransactionStatus === "00",
            secureHashType: vnpParams.vnp_SecureHashType || "SHA512",
        };

        console.log("[CORE VNPAY] POST /vnpay/return >>>", {
            txnRef: vnpParams.vnp_TxnRef,
            respCode: vnpParams.vnp_ResponseCode,
            hasHash: !!vnpParams.vnp_SecureHash,
        });
        console.log("[CORE VNPAY] normalized >>>", normalized);

       
        const result = await handleVnpReturn(vnpParams, normalized);

        console.log("[CORE VNPAY] POST /vnpay/return <<<", result);
       
        return res.status(200).json({ ok: true, ...result });
    } catch (err) {
        return passCoreError(res, err);
    }
};
