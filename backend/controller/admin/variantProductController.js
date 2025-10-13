// controllers/productVariantController.js
import { addVariantService, getAllVariantService, updateVariantService, getVariantByIdService } from "../../service/admin/variantProductService.js";

export const addVariantController = async (req, res) => {
  try {
    const { productId, sku, capacityMl, price, stock } = req.body || {};
    const { variant } = await addVariantService({ productId, sku, capacityMl, price, stock }); // <-- await + đúng key
    return res.status(201).json({ success: true, data: variant });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

    console.error("Variant add error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Variant add error",
    });
  }
};


export const getAllVariantController = async (req, res) => {
  try {
    const { page, limit, q } = req.query || {};
    const { rows, total, page: p, limit: l } = await getAllVariantService({ page, limit, q });

    return res.status(200).json({
      success: true,
      data: rows,
      total,
      page: p,
      limit: l,
    });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeDatabaseError" ? 400 : 500);

    console.error("Variant list error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Variant list error",
    });
  }
};



export const getVariantByIdController = async (req, res) => {
  try {
    const { id } = req.params; 
    const variant = await getVariantByIdService(id);

    return res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeDatabaseError" ? 400 : 500);

    console.error("Get variant by id error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Get variant by id error",
    });
  }
};



export const variantUpdateController = async (req, res) => {
  try {
    const variantId = Number(req.params.id);
    const { productId, sku, capacityMl, price, stock } = req.body || {};
    const { variant } = await updateVariantService({
      variantId,
      productId,
      sku,
      capacityMl,
      price,
      stock,
    });

    return res.status(200).json({ success: true, data: variant });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

    console.error("Variant update error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Variant update error",
    });
  }
};