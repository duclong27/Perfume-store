import { getOrderByUserIdService, cancelOrderService } from "../service/customer/orderService.js";

// export async function getMyOrdersController(req, res, next) {
//   try {
//     const dto = await getOrderByUserIdService({
//       userId: req.auth.userId,     // từ JWT (authCustomerOnly đã gắn)
//       page: req.query.page,
//       limit: req.query.limit,
//     });
//     res.json(dto);                 // ❌ không await ở đây
//   } catch (err) { next(err); }
// }


export const getMyOrdersController = async (req, res) => {
    try {
        const uid = Number(req.auth?.userId);
        if (!Number.isInteger(uid) || uid <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }

        // query: page, limit
        const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
        const limit = Math.max(1, Math.min(200, parseInt(req.query.limit ?? "20", 10)));

        // gọi lần 1
        let { rows, total, page: pageOut, limit: limitOut } =
            await getOrderByUserIdService({ userId: uid, page, limit, useDTO: true, fetchAll: false });

        // Nếu Core không trả total đúng chuẩn (vd: bằng số rows trên trang), ta thăm dò lại
        const looksIncomplete = !(Number.isFinite(total) && total > rows.length) && page > 1;
        if (looksIncomplete) {
            const tryFirst = await getOrderByUserIdService({ userId: uid, page: 1, limit: 1, useDTO: false, fetchAll: false });
            if (Number.isFinite(tryFirst?.total) && tryFirst.total >= rows.length) {
                total = tryFirst.total; // nâng cấp total chuẩn
            }
        }

        return res.status(200).json({
            success: true,
            data: { rows, total, page: pageOut, limit: limitOut }
        });
    } catch (err) {
        const status = err?.status || err?.response?.status || 500;
        const message = err?.response?.data?.message || err.message || "Internal server error";
        return res.status(status).json({ success: false, message });
    }
};


export async function cancelMyOrderController(req, res) {
    try {
        // lấy userId từ JWT (tùy middleware của bạn: req.user hoặc req.auth)
        const userId = Number(req.user?.userId ?? req.auth?.userId ?? req.user?.id ?? req.auth?.sub);
        const orderId = Number(req.params?.orderId);
        const reason = req.body?.reason ?? null;

        if (!Number.isInteger(userId) || userId <= 0) {
            res.setHeader("Cache-Control", "no-store");
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!Number.isInteger(orderId) || orderId <= 0) {
            res.setHeader("Cache-Control", "no-store");
            return res.status(400).json({ success: false, message: "Invalid orderId" });
        }

        const data = await cancelOrderService({ userId, orderId, reason });

        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json(data);
    } catch (e) {
        const status = e?.response?.status || 500;
        const body = e?.response?.data || { success: false, message: "Cancel order failed" };
        res.setHeader("Cache-Control", "no-store");
        return res.status(status).json(body);
    }
}

