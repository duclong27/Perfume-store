import { sequelize, UniqueConstraintError } from "../../config/sequelize.js";
import Cart from "../../model/Cart.js";
import CartItem from "../../model/CartItem.js";
import ProductVariant from "../../model/ProductVariant.js";
import Product from "../../model/Product.js";
import { AppError } from "../../utils/AppError.js";


// helper nhỏ: Sequelize instance → plain object
const toPlain = (x) =>
  x && typeof x.get === "function" ? x.get({ plain: true }) : x;

/**
 * Đảm bảo user có đúng 1 cart (tạo nếu chưa có).
 * - Nếu cần, truyền sẵn `transaction`.
 * - Nếu không, hàm tự mở/đóng transaction.
 * - Khuyến nghị: UNIQUE INDEX trên carts(user_id) để chống race thật sự.
 *
 * @param {Object} args
 * @param {number} args.userId
 * @param {boolean} [args.withItems=false]     
 * @param {import('sequelize').Transaction} [args.transaction]
 * @returns {Promise<{ cart: import('../models/Cart.js').default }>}
 */



export async function getOrCreateCartService({ userId, withItems = false, transaction } = {}) {
  const uid = Number.isInteger(userId) ? userId : Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new AppError("Invalid userId", 400);
  }

  const externalTx = Boolean(transaction);
  const tx = transaction || await sequelize.transaction();

  // include theo quan hệ bạn đã cấu hình
  const include = withItems
    ? [{
      model: CartItem,
      as: "items",
      include: [{ model: ProductVariant, as: "variant" }],
    }]
    : undefined;

  try {
    // 1) Tìm cart hiện có
    let cart = await Cart.findOne({ where: { userId: uid }, include, transaction: tx });
    if (cart) {
      if (!externalTx) await tx.commit();
      return { cart };
    }

    // 2) Chưa có → tạo mới (lạc quan)
    try {
      cart = await Cart.create(
        { userId: uid, createdAt: new Date() },
        { transaction: tx }
      );

      if (withItems) {
        cart = await Cart.findOne({ where: { userId: uid }, include, transaction: tx });
      }

      if (!externalTx) await tx.commit();
      return { cart };
    } catch (e) {
      // 3) Race: nếu UNIQUE(user_id) nổ, đọc lại
      if (e instanceof UniqueConstraintError || e?.name === "SequelizeUniqueConstraintError") {
        const existed = await Cart.findOne({ where: { userId: uid }, include, transaction: tx });
        if (existed) {
          if (!externalTx) await tx.commit();
          return { cart: existed };
        }
      }
      throw e;
    }
  } catch (err) {
    if (!externalTx) {
      try { await tx.rollback(); } catch { }
    }
    throw err;
  }
}


export async function getCartByUserIdService({
  userId,
  includeDetails = true,
  transaction,
} = {}) {
  const uid = Number.isInteger(userId) ? userId : Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);

  // 1) Đảm bảo có cart
  const { cart } = await getOrCreateCartService({
    userId: uid,
    withItems: false,
    transaction,
  });
  const c = toPlain(cart);

  // 2) Load items (variant -> product)
  const include = [];
  if (includeDetails) {
    include.push({
      model: ProductVariant,
      as: "variant",
      attributes: [
        "variantId",
        "productId",
        "sku",
        "capacityMl",
        "price",
        "stock",

      ],
      required: false,
      include: [
        {
          model: Product,
          as: "product",
          // do model đã map field: "image_url" -> attr: imageUrl
          attributes: ["name", "imageUrl"],
          required: false,
        },
      ],
    });
  }

  const items = await CartItem.findAll({
    where: { cartId: c.cartId },
    include,
    order: [["cartItemId", "ASC"]],
    transaction,
  });

  return {
    cart: {
      cartId: c.cartId,
      userId: c.userId,
      createdAt: c.createdAt ?? null,
    },
    items, // để nguyên, DTO sẽ .get({ plain:true }) nếu cần
  };
}
