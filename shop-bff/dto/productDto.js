import {
    pick,
    toStringSafe,
    toNumberSafe,
    toBoolSafe,
    toDateIso,
    ensureArray,
    pickImageUrl,
    normalizeImageUrl,
} from "./utils.js";


/** Needed helpers*/
// Nếu phần tử là Sequelize instance thì chuyển về plain object
const toPlain = (x) => (x && typeof x.get === "function" ? x.get({ plain: true }) : x);

// Lấy giá từ 1 variant theo nhiều key có thể có
const readVariantPrice = (v) =>
    toNumberSafe(pick(v.price, v.unitPrice, v.salePrice, null), NaN);

// Tìm variant có price nhỏ nhất (bỏ qua variant không có giá hợp lệ)
function getMinPricedVariant(variants) {
    let best = null;
    for (const raw of variants) {
        const v = toPlain(raw);
        const price = readVariantPrice(v);
        if (!Number.isFinite(price)) continue;
        if (!best || price < best.price) {
            best = {
                price,
                variantId: pick(v.variantId, v.id, v._id, v.vid, null),
                sku: toStringSafe(pick(v.sku, v.SKU, v.code, "")),
                capacityMl: toNumberSafe(pick(v.capacityMl, v.capacity, v.sizeMl, v.size, null), null),
            };
        }
    }
    return best;
}


/** Variant: KHÔNG có ảnh theo yêu cầu của bạn */
export function toCustomerProductVariantDTO(v = {}) {
    return {
        variantId: pick(v.variantId, v.id, v._id, v.vid, null),
        productId: pick(v.productId, v.pid, null),
        sku: toStringSafe(pick(v.sku, v.SKU, v.code, "")),
        capacityMl: toNumberSafe(pick(v.capacityMl, v.capacity, v.sizeMl, v.size, null), null),
        price: toNumberSafe(pick(v.price, v.unitPrice, v.salePrice, null), null),
        stock: toNumberSafe(pick(v.stock, v.qty, v.quantity, null), null),
        imageUrl: null, // variant không có ảnh
        createdAt: toDateIso(pick(v.createdAt, v.created_at, null)),
    };
}


/** Product: ảnh chỉ từ product; price/stock tính từ variants */
export function toCustomerProductDTO(p = {}) {
    const pPlain = toPlain(p);

    const categoryRaw = pick(pPlain.category, pPlain.Category, pPlain.productCategory, null);
    const category = categoryRaw ? toPlain(categoryRaw) : null;

    const variantsRaw = ensureArray(
        pick(pPlain.variants, pPlain.Variants, pPlain.productVariants, pPlain.variantList, [])
    ).map(toPlain);

    // Ảnh: chỉ lấy từ product
    const assetBase =
        process.env.ASSET_BASE_URL
    process.env.FILE_BASE_URL ||
        "http://localhost:4000"
        ;

    const fallbackRaw = process.env.FALLBACK_PRODUCT_IMAGE || null;
    const productImg = pickImageUrl(pPlain, { base: assetBase, fallback: null });
    const imageUrl = productImg ?? (fallbackRaw ? normalizeImageUrl(fallbackRaw, assetBase) : null);

    // isEnable: fallback nhiều key
    const isEnable = toBoolSafe(
        pick(
            pPlain.isEnable,
            pPlain.enabled,
            pPlain.active,
            pPlain.is_active,
            pPlain.status === "active" ? true : (pPlain.status === "inactive" ? false : undefined)
        ),
        true
    );

    // ➜ TÍNH MIN PRICE từ variants
    const minVariant = getMinPricedVariant(variantsRaw);
    const minPrice = minVariant ? minVariant.price : null;

    return {
        id: pick(pPlain.productId, pPlain.id, pPlain._id, null),
        name: toStringSafe(pick(pPlain.name, pPlain.title, "")),
        brand: toStringSafe(pick(pPlain.brand, pPlain.manufacturer, "")),
        gender: toStringSafe(pick(pPlain.gender, pPlain.targetGender, "")),
        description: toStringSafe(pick(pPlain.description, pPlain.desc, "")),
        imageUrl,
        isEnable,
        minPrice,


        minPriceVariant: minVariant
            ? {
                variantId: minVariant.variantId,
                sku: minVariant.sku,
                capacityMl: minVariant.capacityMl,
            }
            : null,

        category: category
            ? {
                id: pick(category.categoryId, category.id, category._id, null),
                name: toStringSafe(pick(category.name, category.title, "")),
            }
            : null,

        variants: variantsRaw.map((v) => toCustomerProductVariantDTO(v)),

        createdAt: toDateIso(pick(pPlain.createdAt, pPlain.created_at, null)),
        updatedAt: toDateIso(pick(pPlain.updatedAt, pPlain.updated_at, null)),
    };
}



export function toCustomerProductListDTO(data) {
    const rawArray = Array.isArray(data)
        ? data
        : (data?.items ?? data?.rows ?? data?.data ?? data?.list ?? data?.products ?? []);

    const itemsArr = ensureArray(rawArray).map((r) => toCustomerProductDTO(toPlain(r)));

    const total = Array.isArray(data)
        ? itemsArr.length
        : Number(data?.total ?? data?.count ?? itemsArr.length);

    const page = Array.isArray(data)
        ? 1
        : Number(data?.page ?? data?.currentPage ?? 1);

    const limit = Array.isArray(data)
        ? itemsArr.length
        : Number(data?.limit ?? data?.pageSize ?? itemsArr.length);

    return { items: itemsArr, total, page, limit };
}
