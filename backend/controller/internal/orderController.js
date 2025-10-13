import { getOrderSummaryByIdService, getOrdersByUserIdService, cancelOrderService } from "../../service/internal/orderService.js";



function isOnlyPaymentInstructions(q) {
    if (!q) return false;
    const v = String(q).trim().toLowerCase();
    return ["paymentinstructions", "payment_instruction", "paymentinstrc", "paymentinstr", "pi", "bt"].includes(v);
}

export async function getOrderSummaryByIdController(req, res) {
    try {
        const orderId = Number(req.params.id);
        const onlyPI = isOnlyPaymentInstructions(req.query.only);

        const summary = await getOrderSummaryByIdService({
            orderId,
            transaction: undefined,
        });

        res.setHeader("Cache-Control", "no-store");

        // Nếu chỉ cần payment_instructions_snapshot (BANK_TRANSFER)
        if (onlyPI) {
            if (summary.paymentMethodCode !== "BANK_TRANSFER") {
                return res
                    .status(400)
                    .json({ success: false, message: "Payment instructions only available for BANK_TRANSFER orders." });
            }
            if (!summary.paymentInstructionsSnapshot) {
                return res
                    .status(404)
                    .json({ success: false, message: "Payment instructions snapshot not found." });
            }
            // Trả đúng “tối giản” như bạn muốn: chỉ snapshot
            return res.status(200).json({
                success: true,
                data: {
                    paymentInstructionsSnapshot: summary.paymentInstructionsSnapshot,
                },
            });
        }

        // Mặc định: trả full summary (dùng cho các trang khác nếu cần)
        return res.status(200).json({ success: true, data: summary });
    } catch (e) {
        const status = e?.status || 500;
        const message = e?.message || "Internal server error";
        res.setHeader("Cache-Control", "no-store");
        return res.status(status).json({ success: false, message });
    }
}


function toInt(v, def) {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : def;
}
function toBool(v, def = false) {
    if (v === undefined || v === null) return def;
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(s)) return true;
    if (["0", "false", "no", "n", "off"].includes(s)) return false;
    return def;
}

/**
 * GET /me/orders?page=1&pageSize=10&includePaymentInstructions=0|1
 * - Yêu cầu JWT user (req.user.userId)
 * - Không join OrderItem (nhẹ, nhanh)
 */
export const getOrdersByUserIdController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);

        const page = Number(req.query?.page) || 1;
        const pageSize = Number(req.query?.pageSize) || 10;
        const includePaymentInstructions = ["1", "true", "yes", "y", "on"].includes(
            String(req.query?.includePaymentInstructions ?? "").toLowerCase()
        );

        const data = await getOrdersByUserIdService({
            userId,
            page,
            pageSize,
            includePaymentInstructions,
        });

        return res.status(200).json({
            success: true,
            data, // { meta, orders }
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Order list error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Order list error",
        });
    }
};



export const cancelOrderController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);
        const orderId = Number(req.params?.orderId);
        const reason = (req.body?.reason ?? "").toString();

        const { order } = await cancelOrderService({ userId, orderId, reason });

        return res.status(200).json({
            success: true,
            data: { order },
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Order cancel error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Order cancel error",
        });
    }
};
