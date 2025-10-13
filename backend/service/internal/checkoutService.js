// /admin-backend/src/services/checkout/previewCheckoutService.js
import { Op } from "sequelize";
import { AppError } from "../../utils/AppError.js";
import Cart from "../../model/Cart.js";
import CartItem from "../../model/CartItem.js";
import ProductVariant from "../../model/ProductVariant.js";
import Product from "../../model/Product.js";
import Address from "../../model/Address.js";
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



/// sửa lại phần shipping fee
// Miễn phí ship khi subtotal >= 300_000, ngược lại 30_000
export function calcShippingFee({ subtotal }) {
    const n = Number(subtotal) || 0;
    return n >= 30000000 ? 0 : 30000;
}
/////hết phần sửa lại 


const {
    PAYMENT_BT_IMAGE_URL,
    PAYMENT_BT_NOTE_TEMPLATE,
} = process.env;


function sanitizePhone(p) {
    return p ? String(p).replace(/[^\d+]/g, "") : "";
}

function toAddressSnapshotFromAddrModel(addr) {
    return {
        shippingName: addr?.recipientName || null,
        shippingPhone: sanitizePhone(addr?.phoneNumber),
        shippingAddress: addr?.addressLine || null,
        shippingCity: addr?.city || null,
        shippingState: addr?.state || null,
        shippingPostal: addr?.postalCode || null,
        shippingCountry: addr?.country || null,
    };
}
function toAddressSnapshotFromBody(ss) {
    return {
        shippingName: ss?.shippingName || null,
        shippingPhone: sanitizePhone(ss?.shippingPhone),
        shippingAddress: ss?.shippingAddress || null,
        shippingCity: ss?.shippingCity || null,
        shippingState: ss?.shippingState || null,
        shippingPostal: ss?.shippingPostal || null,
        shippingCountry: ss?.shippingCountry || null,
    };
}
function buildBankTransferPreviewInstructions({ phone }) {
    const tpl = PAYMENT_BT_NOTE_TEMPLATE || "ORDER-{orderId}";
    const phoneStr = phone || "<SĐT>";
    const noteSample = tpl
        .replaceAll("{phone}", phoneStr)
        .replaceAll("{orderId}", "<mã đơn sẽ xuất hiện sau khi bạn đặt hàng>");
    return {
        imageUrl: PAYMENT_BT_IMAGE_URL || null,
        noteSample,
        noteTemplate: tpl,
        hint: "Bấm Đặt hàng để nhận mã đơn thật.",
    };
}







export async function previewCheckoutService({
    userId,
    source = "cart",
    items = [],
    addressId = null,
    shippingSnapshot = null,
    // [ADD] nhận method để render preview payment
    paymentMethodCode = null,
} = {}) {
    const uid = toNum(userId);
    if (!isPosInt(uid)) throw new AppError("Invalid userId", 400);

    /* ================= 0) Resolve Address (read-only) ================= */
    let resolvedAddressId = null;
    let addressSnapshot = null;

    const aid = toNum(addressId);
    if (isPosInt(aid)) {
        // đọc DB để echo địa chỉ ra preview (KHÔNG ghi)
        const addr = await Address.findOne({
            where: { addressId: aid, userId: uid },
            attributes: [
                "addressId", "recipientName", "phoneNumber",
                "addressLine", "city", "state", "postalCode", "country"
            ],
        });
        if (addr) {
            resolvedAddressId = aid;
            addressSnapshot = toAddressSnapshotFromAddrModel(addr);
        }
    }
    if (!addressSnapshot && shippingSnapshot && typeof shippingSnapshot === "object") {
        addressSnapshot = toAddressSnapshotFromBody(shippingSnapshot);
    }
    if (!addressSnapshot) {
        // chưa chọn gì: echo rỗng để FE hiển thị
        addressSnapshot = toAddressSnapshotFromBody({});
    }

    /* ================= 1) Lấy danh sách {variantId, qtyRequested} ================= */
    let requested = [];

    if (source === "cart") {
        const cart = await Cart.findOne({
            where: { userId: uid },
            attributes: ["cartId", "userId"],
            include: [
                {
                    model: CartItem,
                    as: "items",
                    attributes: ["variantId", "quantity"],
                    include: [
                        {
                            model: ProductVariant,
                            as: "variant",
                            attributes: ["variantId", "productId", "sku", "capacityMl", "price", "stock", "imageUrl"],
                            include: [
                                {
                                    model: Product,
                                    as: "product",
                                    attributes: ["productId", "name", "imageUrl", "isEnable"],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
            throw new AppError("Cart is empty", 400);
        }

        requested = cart.items.map((ci) => ({
            variantId: toNum(ci.variantId),
            qtyRequested: toNum(ci.quantity, 0),
            _variant: ci.variant || null,
        }));

    } else if (source === "buy_now") {
        const arr = ensureArray(items)
            .map((x) => ({
                variantId: toNum(x?.variantId),
                qtyRequested: toNum(x?.qty),
            }))
            .filter((x) => isPosInt(x.variantId) && isPosInt(x.qtyRequested));

        if (arr.length === 0) throw new AppError("Empty items for buy_now", 400);

        const merged = new Map();
        for (const it of arr) {
            merged.set(it.variantId, (merged.get(it.variantId) || 0) + it.qtyRequested);
        }
        requested = Array.from(merged, ([variantId, qtyRequested]) => ({ variantId, qtyRequested }));

    } else {
        throw new AppError("Invalid source", 400);
    }

    /* ================= 2) Fetch variants khi cần ================= */
    const needFetchIds = requested.filter((r) => !r._variant).map((r) => r.variantId);
    let fetchedById = new Map();
    if (needFetchIds.length > 0) {
        const variants = await ProductVariant.findAll({
            where: { variantId: { [Op.in]: needFetchIds } },
            attributes: ["variantId", "productId", "sku", "capacityMl", "price", "stock", "imageUrl"],
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["productId", "name", "imageUrl", "isEnable"],
                },
            ],
        });
        fetchedById = new Map(variants.map((v) => [Number(v.variantId), v]));
    }

    /* ================= 3) Tính dòng ================= */
    const lines = [];
    let subtotal = 0;

    for (const r of requested) {
        const vid = toNum(r.variantId);
        const qtyReq = toNum(r.qtyRequested, 0);
        const variant = r._variant || fetchedById.get(vid) || null;

        const warnings = [];
        if (!variant) {
            lines.push({
                variantId: vid,
                qtyRequested: qtyReq,
                qtyPriced: 0,
                unitPrice: null,
                lineSubtotal: 0,
                warnings: ["not_found"],
            });
            continue;
        }

        const product = variant.product || null;
        const isActive = product?.isEnable !== false;
        if (!isActive) warnings.push("inactive");

        const stock = toNum(variant.stock, 0);
        let qtyPriced = Math.min(qtyReq, Math.max(stock, 0));
        if (qtyPriced < qtyReq) warnings.push("low_stock");

        const unitPrice = readCurrentPrice(variant);
        if (!Number.isFinite(unitPrice)) {
            warnings.push("price_missing");
            qtyPriced = 0;
        }

        const lineSubtotal = Number.isFinite(unitPrice) ? unitPrice * qtyPriced : 0;
        subtotal += lineSubtotal;

        lines.push({
            variantId: vid,
            qtyRequested: qtyReq,
            qtyPriced,
            unitPrice: Number.isFinite(unitPrice) ? Number(unitPrice) : null,
            lineSubtotal,
            warnings,
            // [MOD] meta gọn cho FE
            name: product?.name ?? null,
            imageUrl: product?.imageUrl ?? variant?.imageUrl ?? null,
            variant: {
                variantId: toNum(variant.variantId),
                productId: toNum(variant.productId),
                sku: variant?.sku ?? null,
                capacityMl: toNum(variant?.capacityMl),
                product: {
                    name: product?.name ?? null,
                    imageUrl: product?.imageUrl ?? null,
                    isEnable: product?.isEnable ?? true,
                },
            },
        });
    }

    /* ================= 4) Totals ================= */
    const discountTotal = 0;
    const shippingFee = calcShippingFee({ subtotal });
    const grandTotal = subtotal + shippingFee - discountTotal;

    /* ================= 5) Payment block (preview) ================= */
    const requestedMethod = String(paymentMethodCode || "").toUpperCase() || null;
    const paymentOptions = [
        { code: "COD", label: "Thanh toán khi nhận hàng" },
        { code: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
        { code: "VNPAY", label: "VNPay (chuyển hướng sau khi đặt hàng)" },
    ];

    let payment = { requested: requestedMethod, effective: requestedMethod, options: paymentOptions };

    if (requestedMethod === "BANK_TRANSFER") {
        const previewIns = buildBankTransferPreviewInstructions({
            phone: addressSnapshot.shippingPhone || null,
        });
        payment = {
            ...payment,
            options: paymentOptions.map((o) =>
                o.code !== "BANK_TRANSFER" ? o : { ...o, previewInstructions: previewIns }
            ),
        };
    }

    /* ================= 6) Trả về ================= */
    return {
        addressId: resolvedAddressId ?? null,        // <— KHÔNG dùng 0
        addressSnapshot,                              // <— echo để FE nhìn thấy & dùng phone sample
        source,
        lines,
        totals: {
            subtotal,
            shippingFee,
            discountTotal,
            grandTotal,
        },
        warnings: [],                                 // (tuỳ chọn) bạn có thể nối thêm cảnh báo address
        hasAnyWarning: lines.some((l) => (l.warnings?.length || 0) > 0),
        payment,                                      // <— block payment cho preview
    };
}

