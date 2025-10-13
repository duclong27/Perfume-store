// src/services/orders/getOrderByUserIdService.js
import { coreInternal } from "../../config/coreClient.js";

// ===== helpers =====
const toNum = (v, d = 0) => {
    if (v == null) return d;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
    if (typeof v === "object" && typeof v.toString === "function") {
        const n2 = Number(v.toString());
        return Number.isNaN(n2) ? d : n2;
    }
    return d;
};

function pickAmount(o) {
    const candidates = [o?.totalVnd, o?.totalAmount, o?.total_amount, o?.total, o?.amount];
    for (const v of candidates) {
        const n = toNum(v, NaN);
        if (!Number.isNaN(n)) return n;
    }
    return 0;
}

function mapOrderRow(o) {
    return {
        orderId: o.orderId,
        orderNumber: `${String(o.orderId).padStart(3, "0")}`,
        userId: o.userId,
        orderStatus: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethodCode: o.paymentMethodCode,
        totalVnd: pickAmount(o),
        createdAt: o.createdAt ?? null,
        paidAt: o.paidAt ?? null,
        shippingName: o.shippingName ?? "",
        shippingPhone: o.shippingPhone ?? "",
        shippingAddress: o.shippingAddress ?? "",
        note: o.note ?? null, // không expose snapshot nhạy cảm
    };
}

// Bóc nhiều shape thường gặp từ Core
function extractRowsPayload(raw) {
    if (raw && Array.isArray(raw.rows)) {
        const t = raw.total ?? raw.count ?? raw.totalCount ?? raw.total_items;
        return { rows: raw.rows, total: toNum(t, raw.rows.length) };
    }
    if (raw && Array.isArray(raw.orders)) {
        const t = raw.total ?? raw.count ?? raw.totalCount;
        return { rows: raw.orders, total: toNum(t, raw.orders.length) };
    }
    if (raw && Array.isArray(raw.items)) {
        const t = raw.total ?? raw.count ?? raw.totalCount;
        return { rows: raw.items, total: toNum(t, raw.items.length) };
    }
    if (raw?.data && (Array.isArray(raw.data.rows) || Array.isArray(raw.data.items))) {
        const arr = Array.isArray(raw.data.rows) ? raw.data.rows : raw.data.items;
        const t = raw.data.total ?? raw.data.count ?? raw.data.totalCount;
        return { rows: arr, total: toNum(t, arr.length) };
    }
    if (Array.isArray(raw)) return { rows: raw, total: raw.length };
    if (raw && typeof raw === "object") return { rows: [raw], total: 1 };
    return { rows: [], total: 0 };
}

/**
 * BFF → Core proxy: GET /order/getOrderByUserId/:userId
 * Luôn gom HẾT về 1 lần (no pagination)
 * Trả: { rows, total }
 */
export async function getOrderByUserIdService({
    userId,
    // các tham số page/limit bỏ qua vì ta gom hết
    max = 5000,         // trần an toàn để tránh gọi quá đà
} = {}) {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
        const e = new Error("Invalid userId");
        e.status = 400;
        throw e;
    }

    // Thử xin page size lớn để Core trả trọn gói, nếu Core vẫn phân trang → ta loop
    const PAGE_SIZE = 1000;

    const sendParams = (curPage, pageSize) => ({
        page: curPage,
        pageIndex: curPage,
        currentPage: curPage,
        limit: pageSize,
        pageSize: pageSize,
        size: pageSize,
        perPage: pageSize,
        per_page: pageSize,
        offset: (curPage - 1) * pageSize,
    });

    // Lần 1
    const r1 = await coreInternal.get(`/order/getOrderByUserId/${uid}`, {
        params: sendParams(1, PAGE_SIZE),
    });
    const raw1 = r1?.data?.data ?? r1?.data ?? r1;
    const first = extractRowsPayload(raw1);

    let rows = first.rows || [];
    let total = Number.isFinite(+first.total) ? +first.total : rows.length;

    // Nếu Core đã trả hết trong 1 lần hoặc ít hơn PAGE_SIZE → xong
    if (!raw1?.rows || rows.length >= total || rows.length < PAGE_SIZE) {
        const mapped = rows.map(mapOrderRow);
        return { rows: mapped, total: mapped.length };
    }

    // Vẫn còn phân trang → loop gom
    let page = 1;
    while (rows.length < Math.min(total, max)) {
        page += 1;
        const rn = await coreInternal.get(`/order/getOrderByUserId/${uid}`, {
            params: sendParams(page, PAGE_SIZE),
        });
        const rawn = rn?.data?.data ?? rn?.data ?? rn;
        const next = extractRowsPayload(rawn);

        if (!next.rows || next.rows.length === 0) break;
        rows = rows.concat(next.rows);

        // nếu Core không trả total chuẩn, dừng khi trang nhận < PAGE_SIZE
        if (next.rows.length < PAGE_SIZE) break;
    }

    const mapped = rows.slice(0, max).map(mapOrderRow);
    return { rows: mapped, total: mapped.length };
}


/**
 * Forward cancel order to Core
 * @param {object} args
 * @param {number} args.userId - required (from JWT)
 * @param {number} args.orderId - required (path param)
 * @param {string|null} args.reason - optional note for audit
 */
export async function cancelOrderService({ userId, orderId, reason = null }) {
    const uid = Number(userId);
    const oid = Number(orderId);
    if (!Number.isInteger(uid) || uid <= 0) throw new Error("Invalid userId");
    if (!Number.isInteger(oid) || oid <= 0) throw new Error("Invalid orderId");

    // coreInternal interceptor đã gắn x-internal-key
    const { data } = await coreInternal.post(`/order/cancelOrder/${uid}/${oid}`, { reason });
    return data; // { success, ... } pass-through
}