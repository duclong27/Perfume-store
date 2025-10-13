// import { addProductService, getAllProductsService, getProductByIdService, deleteProductService, setProductIsEnableService, getProductVariantsByProductIdService, updateProductService } from "../../service/admin/productService.js";
// import { AppError } from "../../utils/AppError.js";


// export async function getAllProductsInternalController(req, res, next) {
//     try {
//         const page = Number.parseInt(req.query.page ?? "1", 10);
//         const limit = Number.parseInt(req.query.limit ?? "20", 10);
//         const q = typeof req.query.q === "string" ? req.query.q : undefined;
//         const includeVariants =
//             (req.query.includeVariants ?? "true").toString().toLowerCase() !== "false";

//         const { rows, total, page: p, limit: l } = await getAllProductsService({
//             page,
//             limit,
//             q,
//             includeVariants,
//         });

//         // Sequelize instance -> plain
//         const plainRows = Array.isArray(rows)
//             ? rows.map(r => (typeof r?.get === "function" ? r.get({ plain: true }) : r))
//             : [];

//         const items = plainRows.map(p => ({
//             productId: p.productId,
//             name: p.name,
//             brand: p.brand,
//             gender: p.gender,
//             description: p.description,
//             imageUrl: p.imageUrl,
//             isEnable: p.isEnable,
//             category: p.category
//                 ? { categoryId: p.category.categoryId, name: p.category.name }
//                 : null,
//             variants: Array.isArray(p.variants)
//                 ? p.variants.map(v => ({
//                     variantId: v.variantId,
//                     productId: v.productId,
//                     sku: v.sku,
//                     capacityMl: v.capacityMl,
//                     price: v.price,
//                     stock: v.stock,
//                     imageUrl: v.imageUrl,
//                     createdAt: v.createdAt,
//                 }))
//                 : [], // khi includeVariants=false
//             createdAt: p.createdAt,
//         }));

//         res.json({ items, total, page: p, limit: l });
//     } catch (err) {
//         next(err instanceof AppError ? err : new AppError(err?.message || "Internal error", 500));
//     }
// }