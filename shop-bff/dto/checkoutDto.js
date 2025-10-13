function toLowerSafe(x, fb = "") {
    return (typeof x === "string" ? x : fb).toLowerCase();
}
function asArrayOrUndef(x) {
    return x == null ? undefined : (Array.isArray(x) ? x : undefined);
}





const toIdOrNull = (x) => {
    const n = Number(x);
    return Number.isInteger(n) && n > 0 ? n : null; // 0/undefined/null -> null
};

export function buildPreviewCheckoutDTO({ body, userId }) {
    return {
        userId: Number(userId),
        source: toLowerSafe(body?.source, "cart"),
        items: asArrayOrUndef(body?.items),
        addressId: toIdOrNull(body?.addressId),              // 👈 sửa: không để 0
        shippingSnapshot: body?.shippingSnapshot ?? null,
        paymentMethodCode: body?.paymentMethodCode ?? null,  // 👈 thêm: forward sang Core
    };
}

function numberOrNull(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
}
function stringOrNull(x) {
    return x == null ? null : String(x);
}

export function buildPlaceCheckoutDTO({ body, userId }) {
    return {
        userId: Number(userId),
        source: toLowerSafe(body?.source, "cart"),
        items: asArrayOrUndef(body?.items),
        addressId: toIdOrNull(body?.addressId),              // 👈 sửa: không để 0
        shippingSnapshot: body?.shippingSnapshot ?? null,
        paymentMethodCode: body?.paymentMethodCode ?? null,  // 👈 thêm: forward sang Core
    };
}


// /admin-backend/src/services/dto/previewDTO.js

/* ===== Helpers giống phong cách DTO của bạn ===== */
const toPlain = (x) => (x && typeof x.get === "function" ? x.get({ plain: true }) : x);

const pick = (...args) => {
    for (const x of args) if (x !== undefined && x !== null) return x;
    return null;
};

const toNumberSafe = (x, fb = null) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : fb;
};

const toStringSafe = (x, fb = null) => {
    if (x === undefined || x === null) return fb;
    const s = String(x);
    return s.length ? s : fb;
};

// biến URL tương đối thành absolute theo base
function toAbsoluteImage(url, base) {
    if (!url) return null;
    try {
        if (/^https?:\/\//i.test(url)) return url; // đã absolute
        const cleanBase = (base || "").replace(/\/+$/, "");
        const cleanUrl = String(url).startsWith("/") ? url : `/${url}`;
        return `${cleanBase}${cleanUrl}`;
    } catch {
        return url;
    }
}

// Ưu tiên nhiều key ảnh (imageUrl, image_url, thumbnail, thumb, ...)
function pickImageUrlRaw(obj) {
    return toStringSafe(
        pick(obj?.imageUrl, obj?.image_url, obj?.thumbnail, obj?.thumb, null),
        null
    );
}

// Preview dùng current price từ Variant (không snapshot)
function readCurrentPrice(variant) {
    const n = Number(variant?.price);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/* =========================================================================
 * 1) DTO cho từng dòng preview — đồng bộ chọn ảnh: Product > Variant > fallback
 * ========================================================================= */
export function toPreviewLineDTO(raw = {}) {
    const l = toPlain(raw);

    // 0) ENV cho absolute ảnh
    const assetBase =
        process.env.ASSET_BASE_URL ||
        process.env.FILE_BASE_URL ||
        "http://localhost:4000";

    // 1) Lấy variant/product theo cách thường (eager-load)
    let vRaw =
        toPlain(pick(l?.variant, l?.Variant, l?.productVariant, l?.ProductVariant, l?.meta?.variant, null)) || {};
    let pRaw =
        toPlain(pick(vRaw?.product, vRaw?.Product, l?.meta?.product, null)) || {};

    // 2) Nếu không có include nhưng có meta phẳng -> dựng pseudo objects
    const m = l?.meta || {};
    const hasFlatMeta =
        m.productId != null ||
        !!m.productName ||
        !!m.sku ||
        !!m.imageUrl ||
        m.capacityMl != null ||
        m.capacity_ml != null ||
        !!m.variantName;

    if ((!vRaw || Object.keys(vRaw).length === 0) && hasFlatMeta) {
        vRaw = {
            sku: toStringSafe(m.sku, null),
            capacityMl: toNumberSafe(pick(m.capacityMl, m.capacity_ml, null), null),
            name: toStringSafe(pick(m.variantName, null), null),
            productId: toNumberSafe(m.productId, null),
            // price nếu Core có gắn vào meta thì có thể đọc thêm ở đây
        };
    }

    if ((!pRaw || Object.keys(pRaw).length === 0) && hasFlatMeta) {
        pRaw = {
            name: toStringSafe(m.productName || "", ""),
            imageUrl: toStringSafe(m.imageUrl || null, null),
            isEnable: true,
        };
    }

    // 3) Ids & qty
    const variantId = toNumberSafe(
        pick(l?.variantId, l?.variant_id, vRaw?.variantId, vRaw?.id, vRaw?._id, null),
        null
    );

    const qtyRequested = toNumberSafe(pick(l?.qtyRequested, l?.qty_req, l?.qty, null), 0);
    const qtyPriced = toNumberSafe(pick(l?.qtyPriced, l?.qty_price, null), 0);

    // 4) Giá preview = current price ở Variant (không snapshot)
    const unitPrice = (() => {
        const cur = toNumberSafe(pick(l?.unitPrice, l?.unit_price, null), null);
        if (Number.isFinite(cur)) return cur;
        const n = readCurrentPrice(vRaw);
        return Number.isFinite(n) ? n : null;
    })();

    const lineSubtotal =
        Number.isFinite(unitPrice) && Number.isFinite(qtyPriced) ? unitPrice * qtyPriced : null;

    // 5) Tên hiển thị: Variant.name > Product.name (+ capacity) > ""
    const displayName = (() => {
        const vName = toStringSafe(vRaw?.name || "", "").trim();
        if (vName) return vName;

        const pName = toStringSafe(pRaw?.name || "", "").trim();
        if (!pName) return "";

        const cap =
            toNumberSafe(
                pick(vRaw?.capacityMl, vRaw?.capacity_ml, m?.capacityMl, m?.capacity_ml, null),
                null
            ) || null;

        return cap ? `${pName} ${cap}ml` : pName;
    })();

    // 6) Ảnh: Product > Variant > meta.imageUrl > fallback (absolute)
    const pImgAbs = toAbsoluteImage(pickImageUrlRaw(pRaw), assetBase);
    const vImgAbs = toAbsoluteImage(pickImageUrlRaw(vRaw), assetBase);
    const mImgAbs = toAbsoluteImage(toStringSafe(m?.imageUrl || null, null), assetBase);

    const fallbackAbs = toAbsoluteImage(
        process.env.FALLBACK_VARIANT_IMAGE || process.env.FALLBACK_PRODUCT_IMAGE || null,
        assetBase
    );

    const displayImageUrl = pImgAbs || vImgAbs || mImgAbs || fallbackAbs || null;

    // 7) Warnings
    const warnings = Array.isArray(l?.warnings) ? l.warnings : [];

    // 8) Trả về line DTO đồng bộ với CartDTO
    return {
        variantId,
        qtyRequested,
        qtyPriced,
        unitPrice,
        lineSubtotal,
        warnings,

        // tiện cho FE
        name: displayName || null,
        imageUrl: displayImageUrl || null,

        // block variant ổn định
        variant: {
            variantId,
            productId: toNumberSafe(pick(vRaw?.productId, vRaw?.pid, m?.productId, null), null),
            sku: toStringSafe(pick(vRaw?.sku, vRaw?.SKU, vRaw?.code, m?.sku, ""), ""),
            capacityMl: toNumberSafe(
                pick(
                    vRaw?.capacityMl,
                    vRaw?.capacity_ml,
                    m?.capacityMl,
                    m?.capacity_ml,
                    null
                ),
                null
            ),
            name: toStringSafe(vRaw?.name || null, null),
            product: pRaw
                ? {
                    name: toStringSafe(pRaw?.name || "", ""),
                    imageUrl: pImgAbs || mImgAbs || null,
                    isEnable: !!(pRaw?.isEnable ?? true),
                }
                : null,
        },
    };
}
/* =========================================================================
 * 2) DTO tổng cho preview
 * ========================================================================= */
export function toPreviewDTO(raw = {}) {
    const src = toStringSafe(raw?.source || "cart", "cart");
    const lines = Array.isArray(raw?.lines) ? raw.lines.map(toPreviewLineDTO) : [];
    const t = raw?.totals || {};

    // ✅ passthrough addressSnapshot
    const addr = raw?.addressSnapshot ?? null;
    const addressSnapshot = addr
        ? {
            shippingName: toStringSafe(addr?.shippingName, null),
            shippingPhone: toStringSafe(addr?.shippingPhone, null),
            shippingAddress: toStringSafe(addr?.shippingAddress, null),
            shippingCity: toStringSafe(addr?.shippingCity, null),
            shippingState: toStringSafe(addr?.shippingState, null),
            shippingPostal: toStringSafe(addr?.shippingPostal, null),
            shippingCountry: toStringSafe(addr?.shippingCountry, null),
        }
        : null;

    // ✅ passthrough payment (giữ nguyên cấu trúc Core trả về)
    const payment = raw?.payment ?? null;

    return {
        // 👇 giữ nguyên logic cũ, chỉ đổi về null nếu không hợp lệ
        addressId: toNumberSafe(raw?.addressId, null),
        addressSnapshot,                 // 👈 mới
        source: src,

        // ❗ không động vào mapping lines (bao gồm image)
        lines,

        totals: {
            subtotal: toNumberSafe(t?.subtotal, 0),
            shippingFee: toNumberSafe(t?.shippingFee, 0),
            discountTotal: toNumberSafe(t?.discountTotal, 0),
            grandTotal: toNumberSafe(t?.grandTotal, 0),
        },

        // ❗ giữ nguyên warnings/hasAnyWarning như logic hiện tại
        warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
        hasAnyWarning:
            raw?.hasAnyWarning ??
            !!lines.find((l) => (l.warnings?.length || 0) > 0),

        payment,                         // 👈 mới
    };
}

// BFF: services/dto/placeDTO.js

// Giữ nguyên mọi giá trị từ Core, KHÔNG chỉnh sửa image URL
export function toPlaceDTO(raw = {}) {
    const orderId = numberOrNull(raw?.orderId);
    const method = stringOrNull(raw?.paymentMethodCode);
    const status = stringOrNull(raw?.paymentStatus);

    if (!method) {
        // fallback: trả nguyên raw nếu Core không có method (edge case)
        return raw;
    }

    switch (method.toUpperCase()) {
        case "COD":
            return {
                orderId,
                paymentMethodCode: "COD",
                paymentStatus: status || "unpaid",
                message: stringOrNull(raw?.message),
            };

        case "BANK_TRANSFER":
            // Giữ nguyên block paymentInstructions (không sửa imageUrl)
            return {
                orderId,
                paymentMethodCode: "BANK_TRANSFER",
                paymentStatus: status || "pending",
                paymentInstructions: raw?.paymentInstructions ?? null,
                // kỳ vọng: { imageUrl, note, phone, noteHint }
            };

        case "VNPAY":
            return {
                orderId,
                paymentMethodCode: "VNPAY",
                paymentStatus: status || "pending",
                paymentUrl: stringOrNull(raw?.paymentUrl),
            };

        default:
            // Không biết phương thức gì -> trả nguyên raw để không phá flow
            return raw;
    }
}
