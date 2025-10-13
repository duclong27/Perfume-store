import { sequelize } from "../../config/sequelize.js";
import { AppError } from "../../utils/AppError.js";
import Address from "../../model/Address.js";
import User from "../../model/User.js";


export async function addAddressService({ userId, payload } = {}) {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);

    // ---- Extract + basic sanitize
    const recipientName = payload?.recipientName ?? null;
    const phoneNumber = payload?.phoneNumber ?? null;
    const addressLine = payload?.addressLine ?? "";
    const city = payload?.city ?? null;
    const state = payload?.state ?? null;
    const postalCode = payload?.postalCode ?? null;
    const country = payload?.country ?? null;
    const wantDefault = Boolean(payload?.isDefault);

    if (typeof addressLine !== "string" || addressLine.trim().length === 0) {
        throw new AppError("addressLine is required", 400);
    }

    const tx = await sequelize.transaction();
    try {
        // 1) (Tuỳ chọn) Verify user tồn tại để báo lỗi sớm & rõ
        const user = await User.findOne({
            where: { userId: uid },
            transaction: tx,
            lock: tx.LOCK.UPDATE, // khoá hàng user để tránh race set default đồng thời
        });
        if (!user) throw new AppError("User not found", 404);

        // 2) Kiểm tra đã có địa chỉ nào của user chưa
        const existingDefault = await Address.findOne({
            where: { userId: uid, isDefault: true },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });

        const existingAny = await Address.findOne({
            where: { userId: uid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });

        // 3) Quyết định có set default cho địa chỉ mới không
        //    - Nếu payload.isDefault = true -> set default
        //    - Nếu user CHƯA có địa chỉ nào -> auto default
        //    - Ngược lại -> không default
        const shouldBeDefault = wantDefault || !existingAny;

        // 4) Nếu địa chỉ mới sẽ là default → clear default cũ (nếu có)
        if (shouldBeDefault && existingDefault) {
            await Address.update(
                { isDefault: false },
                { where: { userId: uid, isDefault: true }, transaction: tx }
            );
        }

        // 5) Tạo địa chỉ
        const created = await Address.create(
            {
                userId: uid,
                recipientName,
                phoneNumber,
                addressLine: addressLine.trim(),
                city,
                state,
                postalCode,
                country,
                isDefault: shouldBeDefault,
            },
            { transaction: tx }
        );

        await tx.commit();

        // 6) Giữ hợp đồng trả về gọn gàng, tương tự phong cách addCartItemService
        return {
            address: created.get ? created.get({ plain: true }) : created,
        };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}



export async function getAddressesByUserIdService({ userId } = {}) {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);

    // Không nhất thiết phải có transaction cho read-only
    const addresses = await Address.findAll({
        where: { userId: uid },
        order: [
            ["isDefault", "DESC"],
            ["addressId", "DESC"],
        ],
    });

    // Trả plain cho đồng bộ style
    const plain = addresses.map(a => (a?.get ? a.get({ plain: true }) : a));
    return { addresses: plain };
}





/**
 * Cập nhật 1 địa chỉ (chỉ text fields)
 * KHÔNG cho sửa isDefault ở đây — dùng setDefaultAddressService riêng.
 * Giữ form: trả object { address }
 */
export async function updateAddressService({ userId, addressId, payload } = {}) {
    const uid = Number(userId);
    const aid = Number(addressId);

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (!Number.isInteger(aid) || aid <= 0) throw new AppError("Invalid addressId", 400);
    if (payload && Object.prototype.hasOwnProperty.call(payload, "isDefault")) {
        throw new AppError("Use setDefaultAddressService to change default", 400);
    }

    // Chỉ cho phép các field này
    const allowedKeys = new Set([
        "recipientName",
        "phoneNumber",
        "addressLine",
        "city",
        "state",
        "postalCode",
        "country",
    ]);

    const data = {};
    for (const k of Object.keys(payload || {})) {
        if (allowedKeys.has(k)) data[k] = payload[k];
    }
    if (Object.keys(data).length === 0) {
        throw new AppError("No updatable fields", 400);
    }
    if (Object.prototype.hasOwnProperty.call(data, "addressLine")) {
        if (typeof data.addressLine !== "string" || data.addressLine.trim().length === 0) {
            throw new AppError("addressLine must be a non-empty string", 400);
        }
        data.addressLine = data.addressLine.trim();
    }

    const tx = await sequelize.transaction();
    try {
        // (Tuỳ chọn) Verify user tồn tại để báo lỗi rõ ràng + khoá tránh race hiếm
        const user = await User.findOne({
            where: { userId: uid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!user) throw new AppError("User not found", 404);

        // Lấy đúng địa chỉ thuộc về user + LOCK
        const target = await Address.findOne({
            where: { userId: uid, addressId: aid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!target) throw new AppError("Address not found", 404);

        await target.update(data, { transaction: tx });
        await tx.commit();

        return { address: target.get ? target.get({ plain: true }) : target };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}



export async function setAddressDefaultService({ userId, addressId } = {}) {
    const uid = Number(userId);
    const aid = Number(addressId);

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (!Number.isInteger(aid) || aid <= 0) throw new AppError("Invalid addressId", 400);

    const tx = await sequelize.transaction();
    try {
        // (optional) verify user + lock để tránh race condition hiếm gặp
        const user = await User.findOne({
            where: { userId: uid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!user) throw new AppError("User not found", 404);

        // Lấy đúng địa chỉ thuộc user + lock
        const target = await Address.findOne({
            where: { userId: uid, addressId: aid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!target) throw new AppError("Address not found", 404);

        // Clear default cũ (nếu có)
        await Address.update(
            { isDefault: false },
            { where: { userId: uid, isDefault: true }, transaction: tx }
        );

        // Set default cho target
        await target.update({ isDefault: true }, { transaction: tx });

        await tx.commit();

        return {
            address: target.get ? target.get({ plain: true }) : target,
        };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}


/**
 * Xoá một địa chỉ của user.
 * - Cho phép xoá default.
 * - Nếu xoá default và user còn địa chỉ khác → tự gán default cho bản ghi mới nhất.
 * Trả: { deletedId, reassignedDefaultTo }  (id mới được set default hoặc null)
 */
export async function deleteAddressService({ userId, addressId } = {}) {
    const uid = Number(userId);
    const aid = Number(addressId);

    if (!Number.isInteger(uid) || uid <= 0) throw new AppError("Invalid userId", 400);
    if (!Number.isInteger(aid) || aid <= 0) throw new AppError("Invalid addressId", 400);

    const tx = await sequelize.transaction();
    try {
        // (optional) verify user + lock để tránh race hiếm
        const user = await User.findOne({
            where: { userId: uid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!user) throw new AppError("User not found", 404);

        // Lấy đúng địa chỉ thuộc user + lock
        const target = await Address.findOne({
            where: { userId: uid, addressId: aid },
            transaction: tx,
            lock: tx.LOCK.UPDATE,
        });
        if (!target) throw new AppError("Address not found", 404);

        const wasDefault = !!target.isDefault;

        // Xoá địa chỉ
        await target.destroy({ transaction: tx });

        let reassignedDefaultTo = null;

        if (wasDefault) {
            // Tìm một địa chỉ khác của user để set default (bản ghi mới nhất)
            const candidate = await Address.findOne({
                where: { userId: uid },
                order: [["addressId", "DESC"]],
                transaction: tx,
                lock: tx.LOCK.UPDATE,
            });

            if (candidate) {
                await candidate.update({ isDefault: true }, { transaction: tx });
                reassignedDefaultTo = Number(candidate.addressId);
            }
            // Nếu không còn địa chỉ nào → reassignedDefaultTo vẫn null (user tạm thời không có default)
        }

        await tx.commit();

        return { deletedId: aid, reassignedDefaultTo };
    } catch (err) {
        try { await tx.rollback(); } catch { }
        throw err;
    }
}
