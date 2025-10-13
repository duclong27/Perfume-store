import { Op, fn, col, where } from "sequelize";
import ProductVariant from "../../model/ProductVariant.js";
import { AppError } from "../../utils/AppError.js";
import Product from "../../model/Product.js";
import Category from "../../model/Category.js";




export async function addVariantService({ productId, sku, capacityMl, price, stock } = {}) {
  const pId = Number.isInteger(productId) ? productId : Number.parseInt(productId, 10) || null;
  const s = typeof sku === "string" ? sku.trim() : null;

  // Parse capacityMl an toàn: nhận number hoặc string số; rỗng => null
  const c = (capacityMl === undefined || capacityMl === null || capacityMl === '')
    ? null
    : Number.parseInt(String(capacityMl), 10);

  const pr = (price === undefined || price === null || price === '')
    ? null
    : Number.parseFloat(String(price));

  const st = Number.isInteger(stock)
    ? stock
    : ((stock === undefined || stock === null || stock === '') ? 0 : Number.parseInt(String(stock), 10));

  // validate cơ bản
  if (!pId) throw new AppError("ProductId must be provided", 400);
  if (pr === null || Number.isNaN(pr) || pr <= 0) throw new AppError("Price must be greater than 0", 400);
  if (c !== null && (Number.isNaN(c) || c <= 0)) throw new AppError("capacityMl must be a positive integer", 400);

  // check trùng sku (case-insensitive, nếu có sku)
  if (s) {
    const existed = await ProductVariant.findOne({
      where: where(fn("LOWER", col("sku")), s.toLowerCase()),
      attributes: ["variantId"],
    });
    if (existed) throw new AppError("SKU already exists", 409);
  }

  // tạo mới variant
  const variant = await ProductVariant.create({
    productId: pId,
    sku: s,
    capacityMl: c,
    price: pr,
    stock: st,
  });

  return { variant };
}




export async function getAllVariantService({ page = 1, limit = 1000, q } = {}) {
  const p = Number.isFinite(+page) && +page > 0 ? Math.floor(+page) : 1000;
  const l =
    Number.isFinite(+limit) && +limit > 0 ? Math.min(1000, Math.floor(+limit)) : 1000;
  const offset = (p - 1) * l;

  const ql = typeof q === "string" ? q.trim().toLowerCase() : "";

  // filter theo SKU nếu có q
  const skuFilter = ql
    ? where(fn("LOWER", col("ProductVariant.sku")), {
      [Op.like]: `%${ql}%`,
    })
    : undefined;

  const { rows, count } = await ProductVariant.findAndCountAll({
    where: skuFilter ? { [Op.and]: [skuFilter] } : undefined,
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["productId", "name"],

      },
    ],
    order: [["createdAt", "DESC"]],
    limit: l,
    offset,
  });

  return { rows, total: count, page: p, limit: l };
}






export async function getVariantByIdService(variantId) {
  // ép kiểu và kiểm tra id hợp lệ
  const id = Number.isFinite(+variantId) && +variantId > 0 ? Math.floor(+variantId) : null;
  if (!id) {
    throw new Error("Invalid variantId");
  }

  // tìm variant theo id
  const variant = await ProductVariant.findOne({
    where: { variantId: id },
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["productId", "name"],
      },
    ],
  });

  if (!variant) {
    throw new Error("Variant not found");
  }

  return variant;
}


export async function updateVariantService({
  variantId,
  productId,
  sku,
  capacityMl,
  price,
  stock,
} = {}) {
  // 1) validate & parse id
  const id = Number(variantId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid variantId", 400);
  }

  // 2) lấy record
  const variant = await ProductVariant.findByPk(id);
  if (!variant) {
    throw new AppError("Variant not found", 404);
  }

  // 3) chuẩn hoá input (chỉ set khi có truyền vào)
  const pId =
    productId === undefined ? undefined : Number(productId);
  const s =
    sku === undefined ? undefined : (typeof sku === "string" ? sku.trim() : null);
  const c =
    capacityMl === undefined ? undefined : Number(capacityMl);
  const pr =
    price === undefined ? undefined : Number.parseFloat(price);
  const st =
    stock === undefined ? undefined : Number(stock);

  // 4) validate các field được truyền
  if (pId !== undefined && (!Number.isInteger(pId) || pId <= 0)) {
    throw new AppError("productId must be a positive integer", 400);
  }
  if (c !== undefined && (!Number.isInteger(c) || c < 0)) {
    throw new AppError("capacityMl must be an integer >= 0", 400);
  }
  if (pr !== undefined && (!Number.isFinite(pr) || pr <= 0)) {
    throw new AppError("price must be greater than 0", 400);
  }
  if (st !== undefined && (!Number.isInteger(st) || st < 0)) {
    throw new AppError("stock must be an integer >= 0", 400);
  }

  // 5) build updateData từng phần
  const updateData = {};

  if (pId !== undefined && variant.productId !== pId) {
    updateData.productId = pId;
  }

  if (c !== undefined && variant.capacityMl !== c) {
    updateData.capacityMl = c;
  }

  if (st !== undefined && variant.stock !== st) {
    updateData.stock = st;
  }

  if (pr !== undefined) {
    const currentPrice = typeof variant.price === "string" ? parseFloat(variant.price) : variant.price;
    if (currentPrice !== pr) {
      updateData.price = pr;
    }
  }

  // 6) xử lý SKU (check trùng case-insensitive, cho phép set null)
  if (s !== undefined) {
    const currentSkuNorm =
      typeof variant.sku === "string" ? variant.sku.trim().toLowerCase() : null;
    const newSkuNorm = s === null ? null : s.toLowerCase();

    const sameIgnoringCase =
      currentSkuNorm === newSkuNorm;

    if (!sameIgnoringCase) {
      // chỉ check trùng khi s khác hiện tại (case-insensitive) và s không null
      if (s) {
        const dup = await ProductVariant.findOne({
          where: {
            [Op.and]: [
              where(fn("LOWER", col("sku")), s.toLowerCase()),
              { variantId: { [Op.ne]: id } },
            ],
          },
          attributes: ["variantId"],
        });
        if (dup) {
          throw new AppError("SKU already exists", 409);
        }
      }
      updateData.sku = s;
    } else {

      if (typeof variant.sku === "string" && s !== null && variant.sku !== s) {
        updateData.sku = s;
      }
      if (s === null && variant.sku !== null) {
        updateData.sku = null;
      }
    }
  }

  // 7) không có gì để cập nhật -> trả về hiện trạng
  if (Object.keys(updateData).length === 0) {
    return { variant };
  }

  // 8) lưu & trả
  const updated = await variant.update(updateData);
  console.log("new data :", updated)
  return { variant: updated };
}


