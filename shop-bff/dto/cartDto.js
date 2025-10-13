



import {
    pick,
    toNumberSafe,
    toStringSafe,
    ensureArray,
    // NEW: dùng đúng helpers như Product DTO
    normalizeImageUrl,
} from "./utils.js";

const toPlain = (x) =>
    x && typeof x.get === "function" ? x.get({ plain: true }) : x;

/* ===== Helpers giá/stock ===== */
function readCurrentPrice(v) {
    const candidates = [pick(v?.salePrice, v?.sale_price, null), v?.price, v?.unitPrice];
    for (const x of candidates) {
        const n = Number(x);
        if (Number.isFinite(n) && n >= 0) return n;
    }
    return NaN;
}

function effectiveUnitPriceOf(ci, variant) {
    const snap = Number(ci?.unitPriceSnapshot ?? ci?.unit_price_snapshot);
    if (Number.isFinite(snap) && snap >= 0) return snap;
    const cur = readCurrentPrice(variant || {});
    if (Number.isFinite(cur) && cur >= 0) return cur;
    return NaN;
}

/* ===== NEW: helpers ảnh (chuẩn hoá absolute giống Product DTO) ===== */
function pickImageUrlRaw(p) {
    // đọc cả camelCase & snake_case
    return toStringSafe(pick(p?.imageUrl, p?.image_url, null), null);
}

function toAbsoluteImage(urlOrPath, base) {
    if (!urlOrPath) return null;
    // nếu đã absolute (http/https/data/blob), trả luôn
    if (/^(?:https?:)?\/\//i.test(urlOrPath) || /^(data|blob):/i.test(urlOrPath)) return urlOrPath;
    // nối base + path
    const b = (base || "").replace(/\/+$/, "");
    const p = String(urlOrPath).startsWith("/") ? urlOrPath : `/${urlOrPath}`;
    return `${b}${p}`;
}

/* ===== Item DTO (KHÔNG trả createdAt/updatedAt) ===== */
export function toCustomerCartItemDTO(raw = {}) {
    const ci = toPlain(raw);
    const vRaw =
        toPlain(pick(ci?.variant, ci?.Variant, ci?.productVariant, ci?.ProductVariant, null)) || {};

    // lấy product lồng trong variant (nếu service đã include)
    const pRaw = toPlain(pick(vRaw?.product, vRaw?.Product, null)) || {};

    const variantId = toNumberSafe(
        pick(ci?.variantId, ci?.variant_id, vRaw?.variantId, vRaw?.id, vRaw?._id, null),
        null
    );
    const qty = toNumberSafe(pick(ci?.quantity, ci?.qty, ci?.q, null), 0);

    const eup = effectiveUnitPriceOf(ci, vRaw);
    const effectiveUnitPrice = Number.isFinite(eup) ? eup : null;
    const lineSubtotal =
        Number.isFinite(eup) && Number.isFinite(qty) ? eup * qty : null;

    // ===== NEW: chuẩn hoá tên & ảnh hiển thị (absolute từ CORE) =====
    const displayName = (() => {
        const s1 = toStringSafe(vRaw?.name || "", "").trim();
        if (s1) return s1;
        const s2 = toStringSafe(pRaw?.name || "", "").trim();
        return s2 || "";
    })();

    // base URL giống Product DTO
    const assetBase =
        process.env.ASSET_BASE_URL ||
        process.env.FILE_BASE_URL ||
        "http://localhost:4000";

    // Ảnh ưu tiên lấy từ Product (đúng triết lý ảnh nằm ở product)
    const pImgRaw = pickImageUrlRaw(pRaw);               // có thể là "/images/.."
    const pImgAbs = toAbsoluteImage(pImgRaw, assetBase); // thành "http://localhost:4000/images/.."

    // Nếu sau này variant có ảnh, cũng hỗ trợ
    const vImgRaw = toStringSafe(pick(vRaw?.imageUrl, vRaw?.image_url, null), null);
    const vImgAbs = toAbsoluteImage(vImgRaw, assetBase);

    const fallbackRaw =
        process.env.FALLBACK_VARIANT_IMAGE || process.env.FALLBACK_PRODUCT_IMAGE || null;
    const fallbackAbs = toAbsoluteImage(fallbackRaw, assetBase);

    const displayImageUrl = pImgAbs || vImgAbs || fallbackAbs || null;

    return {
        cartItemId: toNumberSafe(
            pick(ci?.cartItemId, ci?.cart_item_id, ci?.id, ci?._id, null),
            null
        ),
        cartId: toNumberSafe(pick(ci?.cartId, ci?.cart_id, null), null),
        variantId,

        qty,
        unitPriceSnapshot: toNumberSafe(
            pick(ci?.unitPriceSnapshot, ci?.unit_price_snapshot, null),
            null
        ),
        effectiveUnitPrice,
        lineSubtotal,

        // >>> NEW: tiện cho FE hiển thị trực tiếp (đã absolute)
        name: displayName || null,
        imageUrl: displayImageUrl || null,

        // block variant giữ nguyên + bổ sung name/product (giữ ổn định cho FE cũ)
        variant: {
            variantId,
            productId: toNumberSafe(pick(vRaw?.productId, vRaw?.pid, null), null),
            sku: toStringSafe(pick(vRaw?.sku, vRaw?.SKU, vRaw?.code, "")),
            capacityMl: toNumberSafe(
                pick(vRaw?.capacityMl, vRaw?.capacity, vRaw?.sizeMl, vRaw?.size, null),
                null
            ),
            name: toStringSafe(vRaw?.name || null, null), // có thể null; FE nên ưu tiên field root `name`
            product: pRaw
                ? {
                    name: toStringSafe(pRaw?.name || "", ""),
                    imageUrl: pImgAbs || null, // ✅ absolute như Product DTO
                }
                : null,
            // không có timestamps
        },

        // ❌ không trả createdAt / updatedAt
    };
}

/* ===== Cart DTO (KHÔNG trả createdAt/updatedAt) ===== */
export function toCartDTO(raw = {}) {
    const c0 = toPlain(raw?.cart ?? raw);

    const cartId = toNumberSafe(
        pick(c0?.cartId, c0?.cart_id, c0?.id, c0?._id, null),
        null
    );
    const userId = toNumberSafe(pick(c0?.userId, c0?.user_id, null), null);

    const itemsRaw =
        ensureArray(
            pick(
                c0?.items,
                c0?.cartItems,
                c0?.CartItems,
                raw?.items,
                raw?.cartItems,
                raw?.CartItems,
                []
            )
        ) || [];

    const items = itemsRaw.map(toCustomerCartItemDTO);

    // ✅ subtotal = tổng lineSubtotal (ưu tiên snapshot của item)
    const subtotal = items.reduce((s, it) => s + (Number(it.lineSubtotal) || 0), 0);

    return {
        cartId,
        userId,
        items,
        itemCount: items.length,
        totalQty: items.reduce((s, it) => s + (Number(it.qty) || 0), 0),
        subtotal, // FE hiển thị tổng tiền hàng
    };
}
