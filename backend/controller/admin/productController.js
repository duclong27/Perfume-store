import { addProductService, getAllProductsService, getProductByIdService, deleteProductService, setProductIsEnableService, getProductVariantsByProductIdService, updateProductService } from "../../service/admin/productService.js";
import { AppError } from "../../utils/AppError.js";





function toBool(v) {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "true";
    return undefined;
}

const addProductController = async (req, res) => {
    try {
        const {
            categoryId,
            name,
            brand,
            gender,
            description,
            imageUrl,   
            isEnable,
            image,      // legacy: mảng string
        } = req.body || {};

        const { product } = await addProductService({
            categoryId,
            name,
            brand,
            gender,
            description,
            imageUrl,            // vẫn cho phép truyền URL có sẵn
            isEnable: toBool(isEnable),
            image,
            file: req.file || null,  // ⬅️ quan trọng: truyền file vào service
        });

        return res.status(201).json({ success: true, data: product });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        if (process.env.NODE_ENV !== "test") {
            console.error("Product add error:", err);
        }

        return res.status(status).json({
            success: false,
            message: err.message || "Product add error",
        });
    }
};



const getAllProductsController = async (req, res) => {
    try {
        const { page, limit, q } = req.query || {};
        const { rows, total, page: p, limit: l } = await getAllProductsService({ page, limit, q });

        return res.status(200).json({
            success: true,
            data: rows,
            total,
            page: p,
            limit: l,
        });
    } catch (err) {
        const status = err.status || err.statusCode || 500;
        if (process.env.NODE_ENV !== "test") {
            console.error("Product getAll error:", err);
        }
        return res.status(status).json({
            success: false,
            message: err.message || "Product getAll error",
        });
    }
};



const getProductByIdController = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const { product } = await getProductByIdService({ productId });

        return res.status(200).json({ success: true, data: product });
    } catch (err) {
        const status = err.status || err.statusCode || 500;
        if (process.env.NODE_ENV !== "test") {
            console.error("Product getById error:", err);
        }
        return res.status(status).json({
            success: false,
            message: err.message || "Product getById error",
        });
    }
};



const deleteProductController = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const { product } = await deleteProductService({ productId });

        return res.status(200).json({
            success: true,
            data: product,
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeForeignKeyConstraintError" ? 409 : 500);

        if (process.env.NODE_ENV !== "test") {
            console.error("Product delete error:", err);
        }

        return res.status(status).json({
            success: false,
            message:
                err?.name === "SequelizeForeignKeyConstraintError"
                    ? "Product is in use and cannot be deleted"
                    : err.message || "Product delete error",
        });
    }
};



const setProductIsEnableController = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid id",
            });
        }

        const parseBool = (v) =>
            v === true || v === 1 || v === "1" || v === "true";

        const isEnable = parseBool(req.body?.isEnable);

        const data = await setProductIsEnableService(id, isEnable);

        return res
            .status(200)
            .set("Cache-Control", "no-store") // tránh cache cho admin
            .json({
                success: true,
                data,
            });
    } catch (err) {
        const status = err.status || err.statusCode || 500;
        if (process.env.NODE_ENV !== "test") {
            console.error("Product setIsEnable error:", err);
        }
        return res.status(status).json({
            success: false,
            message: err.message || "Product setIsEnable error",
        });
    }
};



const getProductVariantByProductIdController = async (req, res) => {
    try {
        const productId = Number(req.params.id);

        const { product } = await getProductVariantsByProductIdService({ productId });

        return res.status(200).json({
            success: true,
            data: product,
        });
    } catch (err) {
        const status = err.status || err.statusCode || 500;

        if (process.env.NODE_ENV !== "test") {
            console.error("Product getById error:", err);
        }

        return res.status(status).json({
            success: false,
            message: err.message || "Product getById error",
        });
    }
};


const updateProductController = async (req, res) => {
    try {
        const productId = Number(req.params.id);

        const input = {
            ...req.body,       // body trước
            productId,         // param id luôn ghi đè (đúng)
            file: req.file,    // nếu có upload
        };

        const { product } = await updateProductService(input);
        return res.status(200).json({ success: true, data: product });
    } catch (err) {
        const status = err.status || err.statusCode || 500;
        if (process.env.NODE_ENV !== "test") {
            console.error("Product update error:", err);
        }
        return res.status(status).json({
            success: false,
            message: err.message || "Product update error",
        });
    }
};









export { addProductController, getAllProductsController, getProductByIdController, deleteProductController, setProductIsEnableController, getProductVariantByProductIdController, updateProductController };

