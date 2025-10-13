import { getAllAccountService, updateAccountService, addAccountService } from "../../service/admin/AccountService.js";


export const getAllAccountController = async (req, res) => {
    try {
        const { q, role, isEnable, sortBy, sortDir } = req.query || {};

        const { rows, total } = await getAllAccountService({
            q,
            role,
            isEnable,
            sortBy,
            sortDir,
        });

        return res.status(200).json({
            success: true,
            data: rows,
            total,
            page: 1,          // không phân trang → cố định 1
            limit: total,     // không phân trang → = tổng
        });
    } catch (err) {
        const status = err.status || err.statusCode || 500;
        if (process.env.NODE_ENV !== "test") {
            console.error("Account getAll error:", err);
        }
        return res.status(status).json({
            success: false,
            message: err.message || "Account getAll error",
        });
    }
};


export const updateAccountController = async (req, res) => {
    try {
        const { userId } = req.params;
        const data = await updateAccountService(userId, req.body || {});
        return res.status(200).json({ success: true, data });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Admin update account error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Admin update account error",
        });
    }
};


export const addAccountController = async (req, res) => {
    try {
        const data = await addAccountService(req.body || {});
        return res.status(201).json({ success: true, data });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Admin add account error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Admin add account error",
        });
    }
};


