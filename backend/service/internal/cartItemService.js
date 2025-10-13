
import { sequelize } from "../../config/sequelize.js";
import { AppError } from "../../utils/AppError.js";
import CartItem from "../../model/CartItem.js";
import ProductVariant from "../../model/ProductVariant.js";
import { getOrCreateCartService, getCartByUserIdService } from "./cartService.js"




// === Helpers an toàn với schema khác nhau ===
function readCurrentPrice(v) {
    // Ưu tiên salePrice nếu có, rồi đến price/unitPrice
    const candidates = [v?.salePrice, v?.price, v?.unitPrice];
    for (const x of candidates) {
        const n = Number(x);
        if (Number.isFinite(n) && n >= 0) return n;
    }
    return NaN; // không có giá hợp lệ
}

function readAvailableStock(v) {
    // Nếu bạn có trường stockAvailable thì dùng luôn.
    // Nếu không, thử suy ra từ stockOnHand - stockAllocated.
    // Nếu mọi thứ đều undefined => coi như "không giới hạn" (Infinity).
    const onHand = Number(v?.stockOnHand);
    const allocated = Number(v?.stockAllocated || 0);
    if (Number.isFinite(v?.stockAvailable)) return Math.max(0, Number(v.stockAvailable));
    if (Number.isFinite(onHand)) return Math.max(0, onHand - (Number.isFinite(allocated) ? allocated : 0));
    if (Number.isFinite(v?.inventory)) return Math.max(0, Number(v.inventory));
    return Infinity; // không theo dõi tồn kho chi tiết
}

/**
 * Add/Upsert 1 dòng cart_item cho user (đã đăng nhập)
 * - Upsert theo UNIQUE (cart_id, variant_id)
 * - Cắt qty theo tồn kho nếu cần
 * - Chụp unit_price_snapshot từ giá hiện tại của variant
 *
 * @param {Object} args
 * @param {number} args.userId
 * @param {number} args.variantId
 * @param {number} args.qty
 * @returns {Promise<{ cart: any, adjustments?: Array }>}
 */






export async function addCartItemService({ userId, variantId, qty } = {}) {
    const uid = Number(userId);
    const vid = Number(variantId);
    const q = Number(qty);

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (!Number.isInteger(vid) || vid <= 0) throw new AppError("Invalid variantId", 400);
    if (!Number.isInteger(q) || q <= 0) throw new AppError("qty must be a positive integer", 400);

    const tx = await sequelize.transaction();
    try {
        // 1) Lấy / tạo giỏ
        const { cart } = await getOrCreateCartService({
            userId: uid,
            withItems: false,
            transaction: tx,
        });

        // 2) LOCK biến thể
        const variant = await ProductVariant.findOne({
            where: { variantId: vid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!variant) throw new AppError("Variant not found", 404);

        const isActive = (variant.isActive ?? variant.isEnable ?? true) === true;
        if (!isActive) throw new AppError("Variant is not available for sale", 404);

        // 3) Giá snapshot
        const unitPrice = readCurrentPrice(variant);
        if (!Number.isFinite(unitPrice)) throw new AppError("Variant price unavailable", 409);

        // 4) Tồn kho
        const stock = Number.isFinite(Number(variant.stock)) && Number(variant.stock) >= 0
            ? Number(variant.stock)
            : 0;

        // 5) LOCK cart item (nếu đã có)
        const existing = await CartItem.findOne({
            where: { cartId: cart.cartId, variantId: vid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });

        const existingQty = Number(existing?.quantity || 0);
        const remaining = Math.max(0, stock - existingQty);
        if (q > remaining) throw new AppError("Not enough stock", 409);

        const finalQty = existingQty + q;

        // 6) Upsert
        if (existing) {
            await existing.update(
                {
                    quantity: finalQty,
                    ...(CartItem.rawAttributes?.unitPriceSnapshot
                        ? { unitPriceSnapshot: unitPrice }
                        : {}),
                },
                { transaction: tx }
            );
        } else {
            await CartItem.create(
                {
                    cartId: cart.cartId,
                    variantId: vid,
                    quantity: finalQty,
                    ...(CartItem.rawAttributes?.unitPriceSnapshot
                        ? { unitPriceSnapshot: unitPrice }
                        : {}),
                },
                { transaction: tx }
            );
        }

        // 7) Lấy lại giỏ bằng service đã include đầy đủ (variant → product) + ORDER
        const fresh = await getCartByUserIdService({
            userId: uid,
            includeDetails: true,
            transaction: tx,
        });

        // 🔧 FLATTEN: đưa items vào trong cart để khớp với toCartDTO hiện tại
        const flattenedCart = {
            ...fresh.cart,      // { cartId, userId, ... }
            items: fresh.items, // mảng items đã có variant.product{name,imageUrl}
        };

        await tx.commit();

        // 8) Giữ nguyên hợp đồng trả về
        return { cart: flattenedCart, adjustments: [] };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}

function readStock(variant) {
    const n = Number(variant?.stock);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}



export async function updateQuantityService({ userId, variantId, qty } = {}) {
    const uid = Number(userId);
    const vid = Number(variantId);
    const q = Number(qty);

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (!Number.isInteger(vid) || vid <= 0) throw new AppError("Invalid variantId", 400);
    if (!Number.isInteger(q)) throw new AppError("qty must be an integer", 400);
    if (q < 0) throw new AppError("qty must not be negative", 400);

    const tx = await sequelize.transaction();
    try {
        // 1) Ensure cart
        const { cart } = await getOrCreateCartService({
            userId: uid,
            withItems: false,
            transaction: tx,
        });

        // 2) LOCK variant
        const variant = await ProductVariant.findOne({
            where: { variantId: vid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!variant) throw new AppError("Variant not found", 404);

        const isActive = (variant.isActive ?? variant.isEnable ?? true) === true;

        // 3) LOCK cart item
        const item = await CartItem.findOne({
            where: { cartId: cart.cartId, variantId: vid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });

        if (!item) {
            if (q === 0) {
                // idempotent
            } else {
                throw new AppError("Cart item not found", 404);
            }
        }

        // 4) Stock & policy
        const stock = (n => (Number.isFinite(n) && n >= 0 ? n : 0))(Number(variant?.stock));
        const requestedQty = q;

        if (requestedQty === 0) {
            if (item) await item.destroy({ transaction: tx });
        } else {
            const existingQty = Number(item?.quantity || 0);

            if (!isActive && requestedQty > existingQty) {
                throw new AppError("Variant is not available for sale", 409);
            }
            if (requestedQty > stock) {
                throw new AppError("Not enough stock", 409);
            }

            if (item) {
                await item.update({ quantity: requestedQty }, { transaction: tx });
            } else {
                await CartItem.create(
                    { cartId: cart.cartId, variantId: vid, quantity: requestedQty },
                    { transaction: tx }
                );
            }
        }

        // 5) Trả giỏ mới nhất — dùng service đã include đầy đủ (variant.product) + order ASC
        const fresh = await getCartByUserIdService({
            userId: uid,
            includeDetails: true,
            transaction: tx,
        });

        await tx.commit();

        // Giữ hợp đồng hiện tại (BFF expect { cart, adjustments })
        return { cart: fresh, adjustments: [] };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}



export async function deleteCartItemService({ userId, cartItemId, variantId } = {}) {
    const uid = Number(userId);
    const cid = cartItemId != null ? Number(cartItemId) : null;
    const vid = variantId != null ? Number(variantId) : null;

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (cid == null && vid == null) throw new AppError("cartItemId or variantId is required", 400);
    if (cid != null && (!Number.isInteger(cid) || cid <= 0)) throw new AppError("Invalid cartItemId", 400);
    if (vid != null && (!Number.isInteger(vid) || vid <= 0)) throw new AppError("Invalid variantId", 400);

    const tx = await sequelize.transaction();
    try {
        // 1) Đảm bảo có cart của user
        const { cart } = await getOrCreateCartService({
            userId: uid,
            withItems: false,
            transaction: tx,
        });

        // 2) Xác định item trong cart (theo cartItemId hoặc variantId)
        const where = { cartId: cart.cartId };
        if (cid != null) where.cartItemId = cid;
        else where.variantId = vid;

        // 3) LOCK & xoá (idempotent)
        const item = await CartItem.findOne({
            where,
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (item) {
            await item.destroy({ transaction: tx });
        }

        // 4) Trả giỏ mới nhất bằng service đã include đầy đủ (variant → product) + ORDER
        const fresh = await getCartByUserIdService({
            userId: uid,
            includeDetails: true,
            transaction: tx,
        });

        // 🔧 FLATTEN để khớp toCartDTO (raw.cart là object có sẵn items bên trong)
        const flattenedCart = {
            ...fresh.cart,     // { cartId, userId, ... }
            items: fresh.items // mảng items đã include variant.product
        };

        await tx.commit();
        return { cart: flattenedCart, adjustments: [] };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}



export default addCartItemService;
