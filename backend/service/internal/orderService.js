import { sequelize } from "../../config/sequelize.js";
import { AppError } from "../../utils/AppError.js";
import Order from "../../model/Order.js";
import OrderItem from "../../model/OrderItem.js";
import Address from "../../model/Address.js";
import Cart from "../../model/Cart.js";
import CartItem from "../../model/CartItem.js";
import ProductVariant from "../../model/ProductVariant.js";
import Product from "../../model/Product.js";
import User from "../../model/User.js";



/* =========================================================================
 * Utility nhỏ gọn
 * ========================================================================= */
const toPosInt = (x) => {
    const n = Number(x);
    return Number.isInteger(n) && n > 0 ? n : NaN;
};
const toInt = (x, def = 0) => {
    const n = Number(x);
    return Number.isInteger(n) ? n : def;
};

// Đọc giá hiện tại (ưu tiên salePrice -> price -> unitPrice)
function readCurrentPrice(variant) {
    const cands = [variant?.salePrice ?? variant?.sale_price, variant?.price, variant?.unitPrice];
    for (const c of cands) {
        const n = Number(c);
        if (Number.isFinite(n) && n >= 0) return n;
    }
    return NaN;
}

/* =========================================================================
 * Hooks có thể thay thế/ghi đè tuỳ chính sách
 * ========================================================================= */
// Tính phí ship (placeholder: miễn phí nếu subtotal >= 300k)
export async function calcShippingFee({ address, subtotal, lines }, tx) {
    if (!Number.isFinite(subtotal)) return 0;
    return subtotal >= 300000 ? 0 : 30000;
}

// Tính giảm giá/khuyến mãi (placeholder: 0)
export async function calcDiscount({ userId, address, lines, subtotal, shippingFee }, tx) {
    return 0;
}

// Idempotency (placeholder: no-op). Bạn có thể lưu key vào bảng riêng để chống double-submit.
export async function ensureIdempotency({ userId, idempotencyKey }, tx) {
    // ví dụ:
    // await OrderRequest.findOrCreate({ where: { userId, key: idempotencyKey }, transaction: tx });
    return true;
}

/* =========================================================================
 * addOrderService
 * ========================================================================= */
/**
 * Tạo đơn hàng an toàn (transaction + row lock).
 *
 * @param {Object} payload
 * @param {number} payload.userId               - Bắt buộc
 * @param {number} payload.addressId            - Bắt buộc (địa chỉ thuộc user)
 * @param {string} [payload.source="cart"]      - "cart" | "buy_now"
 * @param {Array<{variantId:number, qty:number}>} [payload.items] - Bắt buộc nếu source = "buy_now"
 * @param {string} [payload.paymentMethod]      - (để dành, chưa lưu vào model Order hiện tại)
 * @param {string} [payload.note]               - Ghi chú đơn hàng
 * @param {string} [payload.idempotencyKey]     - Khoá idempotency (khuyến nghị gửi)
 *
 * @returns {Promise<{orderId:number,status:string,grandTotal:number}>}
 */
export async function addOrderService({
    userId,
    addressId,
    source = "cart",
    items,
    paymentMethod,
    note,
    idempotencyKey,
} = {}) {
    const uid = toPosInt(userId);
    const addrId = toPosInt(addressId);
    if (!uid) throw new AppError("Invalid userId", 400);
    if (!addrId) throw new AppError("Invalid addressId", 400);
    if (source !== "cart" && source !== "buy_now") throw new AppError("Invalid source", 400);

    // Chuẩn hoá items nếu là buy_now
    let buyNowItems = [];
    if (source === "buy_now") {
        const arr = Array.isArray(items) ? items : [];
        for (const it of arr) {
            const vid = toPosInt(it?.variantId);
            const q = toPosInt(it?.qty);
            if (vid && q) buyNowItems.push({ variantId: vid, qty: q });
        }
        if (buyNowItems.length === 0) throw new AppError("Buy now payload is empty", 400);
    }

    const tx = await sequelize.transaction();
    try {
        /* ---------------- 1) Validate địa chỉ (thuộc user) ---------------- */
        const address = await Address.findOne({ where: { addressId: addrId, userId: uid }, transaction: tx });
        if (!address) throw new AppError("Invalid address", 400);

        /* ---------------- 2) Xác định nguồn items ---------------- */
        let reqLines = [];
        if (source === "cart") {
            // Lấy giỏ của user
            const cart = await Cart.findOne({ where: { userId: uid }, transaction: tx });
            if (!cart) throw new AppError("Cart is empty", 400);

            // Lock các cart items liên quan
            const cartItems = await CartItem.findAll({
                where: { cartId: cart.cartId },
                transaction: tx,
                lock: tx.LOCK.UPDATE,
            });
            if (cartItems.length === 0) throw new AppError("Cart is empty", 400);

            reqLines = cartItems.map((ci) => ({
                variantId: toInt(ci.variantId),
                qty: toInt(ci.qty),
            }));
        } else {
            // buy_now
            reqLines = buyNowItems;
        }

        // Gom theo variantId (nếu trùng)
        const grouped = new Map();
        for (const it of reqLines) {
            const vid = toInt(it.variantId);
            const q = toPosInt(it.qty);
            if (!vid || !q) continue;
            grouped.set(vid, (grouped.get(vid) || 0) + q);
        }
        if (grouped.size === 0) throw new AppError("No valid items", 400);

        const variantIds = Array.from(grouped.keys());

        /* ---------------- 3) Lock variants (FOR UPDATE) ---------------- */
        const variants = await ProductVariant.findAll({
            where: { variantId: variantIds },
            include: [{ model: Product, as: "Product", required: true }], // cần productId cho OrderItem
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        const vmap = new Map(variants.map((v) => [v.variantId, v]));

        /* ---------------- 4) Kiểm tồn & chốt giá hiện tại ---------------- */
        const finalLines = []; // { variantId, productId, qty, unitPrice, lineSubtotal }
        for (const [vid, requestedQty] of grouped) {
            const v = vmap.get(vid);
            if (!v) continue;
            if (v.isActive === false) continue;

            const stock = Number(v.stock ?? Infinity);
            const appliedQty = Math.max(0, Math.min(requestedQty, stock));
            if (appliedQty <= 0) continue;

            const unitPrice = readCurrentPrice(v);
            if (!Number.isFinite(unitPrice)) continue;

            finalLines.push({
                variantId: vid,
                productId: toInt(v.Product?.productId),
                qty: appliedQty,
                unitPrice,
                lineSubtotal: unitPrice * appliedQty,
            });
        }

        if (finalLines.length === 0) throw new AppError("All items unavailable", 409);

        /* ---------------- 5) Tính tổng tiền (subtotal/ship/discount) ---------------- */
        const subtotal = finalLines.reduce((s, x) => s + x.lineSubtotal, 0);
        const shippingFee = await calcShippingFee({ address, subtotal, lines: finalLines }, tx);
        const discountTotal = await calcDiscount({ userId: uid, address, lines: finalLines, subtotal, shippingFee }, tx);
        const grandTotal = subtotal + shippingFee - discountTotal;

        if (grandTotal < 0) throw new AppError("Invalid total", 400);

        /* ---------------- 6) Idempotency (tuỳ, có thể bỏ qua) ---------------- */
        if (idempotencyKey) {
            await ensureIdempotency({ userId: uid, idempotencyKey }, tx);
        }

        /* ---------------- 7) Tạo Order ---------------- */
        const order = await Order.create(
            {
                userId: uid,
                addressId: addrId,
                status: "pending",
                totalAmount: grandTotal, // model của bạn dùng totalAmount
                note: note || null,

                // Snapshot địa chỉ vào các trường shipping_*
                shippingName: address.name ?? null,
                shippingPhone: address.phone ?? null,
                shippingAddress: address.line1 ?? null,
                shippingCity: address.city ?? null,
                shippingState: address.state ?? null,
                shippingPostal: address.postalCode ?? null,
                shippingCountry: address.country ?? null,
            },
            { transaction: tx }
        );

        /* ---------------- 8) Tạo OrderItems (bulk) ---------------- */
        const orderItemsPayload = finalLines.map((l) => ({
            orderId: order.orderId,
            variantId: l.variantId,
            productId: l.productId,
            quantity: l.qty,
            price: l.unitPrice, // giá chốt đơn vị
        }));
        await OrderItem.bulkCreate(orderItemsPayload, { transaction: tx });

        /* ---------------- 9) Trừ tồn kho ---------------- */
        for (const l of finalLines) {
            const v = vmap.get(l.variantId);
            const cur = Number(v.stock ?? 0);
            const next = cur - l.qty;
            if (next < 0) throw new AppError("Stock conflict", 409);
            v.stock = next;
            await v.save({ transaction: tx });
        }

        /* ---------------- 10) Dọn giỏ (nếu đặt từ cart) ---------------- */
        if (source === "cart") {
            const cart = await Cart.findOne({ where: { userId: uid }, transaction: tx });
            if (cart) {
                await CartItem.destroy({ where: { cartId: cart.cartId }, transaction: tx });
            }
        }

        /* ---------------- 11) Commit ---------------- */
        await tx.commit();

        // (Tuỳ) tạo payUrl nếu có cổng thanh toán; model Order hiện tại chưa có field -> trả về ngoài response
        const payUrl = null;

        return {
            orderId: order.orderId,
            status: order.status,
            grandTotal,
            payUrl,
        };
    } catch (err) {
        await tx.rollback();
        throw err;
    }
}




/**
 * Lấy summary public-safe cho trang Success (và có thể dùng cho My Orders).
 * - KHÔNG join OrderItem theo yêu cầu.
 * - Nếu paymentMethodCode = "BANK_TRANSFER", trả đầy đủ paymentInstructionsSnapshot.
 */
export async function getOrderSummaryByIdService({
    orderId,
    transaction,
} = {}) {
    // Validate orderId
    const oid = Number.isInteger(orderId) ? orderId : Number(orderId);
    if (!Number.isInteger(oid) || oid <= 0) {
        throw new AppError("Invalid orderId", 400);
    }

    // Chỉ lấy các cột cần thiết từ bảng orders
    const order = await Order.findOne({
        where: { orderId: oid },
        attributes: [
            "orderId",
            "userId",
            "totalAmount",                // DECIMAL(10,2)
            "paymentMethodCode",          // 'COD' | 'BANK_TRANSFER' | 'VNPAY'
            "paymentStatus",              // 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled'
            "paymentInstructionsSnapshot",// JSON: { imageUrl, note, bankName, accountName, accountNumber, noteHint, ... }
            "paidAt",
            "createdAt",

            // Shipping snapshots (đã phân mảnh trong bảng)
            "shippingName",
            "shippingPhone",
            "shippingAddress",
            "shippingCity",
            "shippingState",
            "shippingPostal",
            "shippingCountry",
        ],
        transaction,
    });

    if (!order) throw new AppError("Order not found", 404);

    const o = order.get({ plain: true });

    // Shipping gọn
    const shipping = {
        name: o.shippingName || "",
        phone: o.shippingPhone || "",
        address: o.shippingAddress || "",
        city: o.shippingCity || "",
        state: o.shippingState || "",
        postal: o.shippingPostal || "",
        country: o.shippingCountry || "",
    };

    // Tối ưu cho FE: ép DECIMAL -> number
    const totalVnd = Number(o.totalAmount ?? 0);

    // Nếu là BANK_TRANSFER: trả nguyên snapshot
    const isBT = o.paymentMethodCode === "BANK_TRANSFER";
    const paymentInstructionsSnapshot = isBT ? (o.paymentInstructionsSnapshot || null) : null;

    const result = {
        orderId: o.orderId,
        orderNumber: `ORD-${String(o.orderId).padStart(6, "0")}`, // nếu bạn có orderNumber riêng, thay ở đây
        totalVnd,
        paymentMethodCode: o.paymentMethodCode,
        paymentStatus: o.paymentStatus,
        paidAt: o.paidAt ?? null,
        createdAt: o.createdAt ?? null,
        shipping,
        ...(isBT && paymentInstructionsSnapshot
            ? { paymentInstructionsSnapshot } // ✅ chỉ trả snapshot gốc
            : {}),
    };

    return result;
}




/**
 * Lấy danh sách đơn của CHÍNH user (My Orders)
 * - Không join OrderItem (nhẹ, nhanh).
 * - Hỗ trợ phân trang (page, pageSize).
 * - Có thể kèm snapshot chuyển khoản khi BANK_TRANSFER (includePaymentInstructions = true).
 */
export async function getOrdersByUserIdService({
    userId,
    page = 1,
    pageSize = 10,
    includePaymentInstructions = false,
    transaction,
} = {}) {
    // Validate userId
    const uid = Number.isInteger(userId) ? userId : Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
        throw new AppError("Invalid userId", 400);
    }

    // Validate & clamp paging
    const p = Number.isInteger(page) ? page : Number(page);
    const ps = Number.isInteger(pageSize) ? pageSize : Number(pageSize);
    const safePage = !Number.isNaN(p) && p > 0 ? p : 1;
    const safePageSize = !Number.isNaN(ps) && ps > 0 ? Math.min(ps, 50) : 10; // chặn max 50
    const offset = (safePage - 1) * safePageSize;
    const limit = safePageSize;

    // Chỉ lấy cột cần thiết
    const attributes = [
        "orderId",
        "userId",
        "totalAmount",
        "paymentMethodCode",   // 'COD' | 'BANK_TRANSFER' | 'VNPAY'
        "paymentStatus",       // 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled'
        "status",              // fulfillment status (pending/confirmed/shipped/completed/cancelled)
        "createdAt",
        "paidAt",
        "shippingName",
        // Nếu muốn hiển thị city/state ở danh sách, thêm 2 dòng dưới:
        // "shippingCity", "shippingState",
    ];

    if (includePaymentInstructions) {
        attributes.push("paymentInstructionsSnapshot"); // JSON (BANK_TRANSFER)
    }

    const { rows, count } = await Order.findAndCountAll({
        where: { userId: uid },
        attributes,
        order: [
            ["createdAt", "DESC"],
            ["orderId", "DESC"],
        ],
        offset,
        limit,
        transaction,
    });

    const orders = rows.map((r) => {
        const o = r.get({ plain: true });
        const base = {
            orderId: o.orderId,
            orderNumber: `ORD-${String(o.orderId).padStart(6, "0")}`,
            totalVnd: Number(o.totalAmount ?? 0),
            paymentMethodCode: o.paymentMethodCode,
            paymentStatus: o.paymentStatus,
            status: o.status, // fulfillment
            createdAt: o.createdAt ?? null,
            paidAt: o.paidAt ?? null,
            shippingName: o.shippingName || "",
            // shippingCity: o.shippingCity || "",
            // shippingState: o.shippingState || "",
        };

        if (includePaymentInstructions && o.paymentMethodCode === "BANK_TRANSFER") {
            return {
                ...base,
                paymentInstructionsSnapshot: o.paymentInstructionsSnapshot || null,
            };
        }
        return base;
    });

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / safePageSize);

    return {
        meta: {
            page: safePage,
            pageSize: safePageSize,
            totalItems,
            totalPages,
        },
        orders,
    };
}


export async function cancelOrderService({ userId, orderId, reason } = {}) {
    const uid = Number(userId);
    const oid = Number(orderId);
    const trimmedReason = (reason ?? "").toString().trim();

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (!Number.isInteger(oid) || oid <= 0) throw new AppError("Invalid orderId", 400);

    const tx = await sequelize.transaction();
    try {
        // (optional) verify user + lock (cho chắc, giống form của bạn)
        const user = await User.findOne({
            where: { userId: uid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!user) throw new AppError("User not found", 404);

        // Lấy đúng order thuộc user + lock
        const order = await Order.findOne({
            where: { orderId: oid, userId: uid },
            attributes: [
                "orderId",
                "userId",
                "status",            // fulfillment status: pending|confirmed|paid|shipped|completed|cancelled
                "paymentStatus",     // unpaid|pending|paid|failed|cancelled
                "paymentMethodCode", // COD|BANK_TRANSFER|VNPAY
                "totalAmount",
                "createdAt",
                "note",
            ],
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!order) throw new AppError("Order not found", 404);

        // Idempotent: đã cancelled thì trả luôn summary, không lỗi
        if (order.status === "cancelled" || order.paymentStatus === "cancelled") {
            await tx.commit();
            return { order: summarize(order) };
        }

        // Rule: chỉ cho huỷ khi chưa xử lý sâu & chưa thu tiền xong
        const allowStatus = ["pending", "confirmed"].includes(order.status);
        const allowPayment = ["unpaid", "pending"].includes(order.paymentStatus);
        if (!(allowStatus && allowPayment)) {
            throw new AppError("Order cannot be cancelled at current state", 409);
        }

        // Cập nhật 2 cột sẵn có (không đổi DB)
        order.status = "cancelled";
        order.paymentStatus = "cancelled";

        // (optional) prepend lý do vào note, giữ tổng <= 255 ký tự
        if (trimmedReason) {
            const ts = new Date().toISOString(); // log nhẹ timestamp vào note
            const prefix = `[CANCELLED BY CUSTOMER ${ts}] ${trimmedReason}`.slice(0, 200);
            const old = order.note || "";
            order.note = (prefix + (old ? ` | ${old}` : "")).slice(0, 255);
        }

        await order.save({ transaction: tx });
        await tx.commit();

        return { order: summarize(order) };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}

// Helper chuẩn hoá trả về (giống style gọn cho FE)
function summarize(model) {
    const o = model.get ? model.get({ plain: true }) : model;
    return {
        orderId: o.orderId,
        orderNumber: `ORD-${String(o.orderId).padStart(6, "0")}`,
        status: o.status,                 // 'cancelled'
        paymentStatus: o.paymentStatus,   // 'cancelled'
        paymentMethodCode: o.paymentMethodCode,
        totalVnd: Number(o.totalAmount ?? 0),
        createdAt: o.createdAt ?? null,
    };
}



