import { coreInternal } from "../../config/coreClient.js";

function pickVnpParams(obj = {}) {
    const out = {};
    for (const k in obj) if (Object.hasOwn(obj, k) && k.startsWith("vnp_")) out[k] = String(obj[k]);
    return out;
}


export async function vnpayReturnService(queryOrBody) {
    const vnp = pickVnpParams(queryOrBody);

    console.log("[BFF→Core] /vnpay/return payload:", {
        keys: Object.keys(vnp).length,
        hasSecureHash: !!vnp.vnp_SecureHash,
        vnp_TxnRef: vnp.vnp_TxnRef,
        vnp_Amount: vnp.vnp_Amount,
        vnp_ResponseCode: vnp.vnp_ResponseCode,
    });

    // Nếu coreInternal đã tự gắn x-internal-key bằng interceptor thì KHÔNG cần headers ở đây.
    // Nếu CHƯA, thì dùng: { headers: { "x-internal-key": process.env.INTERNAL_KEY } }
    const { data } = await coreInternal.post("/vnpay/return", vnp);
    return data; // giữ nguyên kiểu trả về như bạn làm với place
}