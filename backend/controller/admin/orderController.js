import { getAllOrdersService, updateOrderStatusAndPaymentStatusService } from "../../service/admin/orderService.js";


export const getAllOrdersController = async (req, res) => {
    try {
        const {
            page,
            limit,
            q,
            status,
            paymentStatus,
            paymentMethodCode,
            createdFrom,
            createdTo,
        } = req.query;

        const result = await getAllOrdersService({
            page,
            limit,
            q,
            status,
            paymentStatus,
            paymentMethodCode,
            createdFrom,
            createdTo,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Admin get orders error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Admin get orders error",
        });
    }
};



export const updateOrderStatusAndPaymentStatusController = async (req, res) => {
    try {
        const orderId = Number(req.params.orderId);
        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid orderId" });
        }

        
        const { orderStatus, paymentStatus } = req.body ?? {};
        const hasOrder = Object.prototype.hasOwnProperty.call(req.body ?? {}, "orderStatus");
        const hasPay = Object.prototype.hasOwnProperty.call(req.body ?? {}, "paymentStatus");

        if (!hasOrder && !hasPay) {
            return res.status(400).json({ success: false, message: "NO_FIELDS_TO_UPDATE" });
        }

        const updated = await updateOrderStatusAndPaymentStatusService(orderId, {
            orderStatus,
            paymentStatus,
        });

        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Admin update order status/payment error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Admin update order status/payment error",
        });
    }
};

