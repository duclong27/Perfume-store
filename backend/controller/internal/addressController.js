import { addAddressService, getAddressesByUserIdService, updateAddressService, setAddressDefaultService, deleteAddressService } from "../../service/internal/addressService.js";

export const addAddressController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);
        const payload = req.body || {};

        const { address } = await addAddressService({ userId, payload });

        return res.status(200).json({
            success: true,
            data: { address },
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Address add error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Address add error",
        });
    }
};


export const getAddressesByUserIdController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);

        const { addresses } = await getAddressesByUserIdService({ userId });

        return res.status(200).json({
            success: true,
            data: { addresses },
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Address list error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Address list error",
        });
    }
};

/**
 * PATCH /internal/v1/users/:userId/addresses/:addressId
 * Cập nhật text fields; KHÔNG cho sửa isDefault tại đây
 */
export const updateAddressController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);
        const addressId = Number(req.params?.addressId);
        const payload = req.body || {};

        const { address } = await updateAddressService({ userId, addressId, payload });

        return res.status(200).json({
            success: true,
            data: { address },
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Address update error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Address update error",
        });
    }
};



export const setAddressDefaultController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);
        const addressId = Number(req.params?.addressId);

        const { address } = await setAddressDefaultService({ userId, addressId });

        return res.status(200).json({
            success: true,
            data: { address },
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

        console.error("Address set default error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Address set default error",
        });
    }
};


export const deleteAddressController = async (req, res) => {
    try {
        const userId = Number(req.params?.userId);
        const addressId = Number(req.params?.addressId);

        const { deletedId, reassignedDefaultTo } = await deleteAddressService({ userId, addressId });

        return res.status(200).json({
            success: true,
            data: { deletedId, reassignedDefaultTo },
        });
    } catch (err) {
        const status =
            err.status ||
            err.statusCode ||
            (err?.name === "SequelizeForeignKeyConstraintError" ? 409 : 500);

        console.error("Address delete error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Address delete error",
        });
    }
};