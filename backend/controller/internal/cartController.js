import { getCartByUserIdService } from "../../service/internal/cartService.js";



export const getCartByUserIdController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);

        const includeDetails =
            String(req.query?.includeDetails ?? "true").toLowerCase() !== "false";

        const cart = await getCartByUserIdService({ userId, includeDetails });

        return res.status(200).json({
            success: true,
            data: cart, 
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Cart getByUserId error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Get cart error",
        });
    }
};