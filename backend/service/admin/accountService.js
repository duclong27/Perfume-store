import User from "../../model/User.js"

import Role from "../../model/Role.js"

import { Op } from "sequelize";

import { sequelize } from "../../config/sequelize.js";

import bcrypt from "bcrypt";




/**
 * Lấy tất cả account (không phân trang)
 * Query: q (search name/email), role (admin|staff|customer), isEnable (true|false), sortBy, sortDir
 * Return: { rows, total }
 */
/**
 * List/Search accounts cho Admin
 * @param {Object} args
 * @param {number} args.page        - default 1
 * @param {number} args.limit       - default 20
 * @param {string} args.q           - search name/email
 * @param {string|string[]} args.role - filter theo role name (admin|staff|customer) hoặc mảng
 * @param {"asc"|"desc"} args.sortDir - default "desc"
 * @param {"name"|"email"|"createdAt"} args.sortBy - default "createdAt"
 * @param {boolean} args.isEnable   - optional filter
 */
// export async function getAllAccountService({
//     page = 1,
//     limit = 20,
//     q = "",
//     role,
//     sortBy = "createdAt",
//     sortDir = "desc",
//     isEnable,
// } = {}) {
//     // Whitelist sort
//     const SORT_MAP = { name: "name", email: "email", createdAt: "createdAt" };
//     const order = [[SORT_MAP[sortBy] || "createdAt", String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"]];

//     const whereUser = {};
//     const include = [
//         {
//             model: Role,
//             as: "roles",            // <— đổi nếu alias khác
//             through: { attributes: [] },
//             required: !!role,       // nếu có filter role thì bắt buộc join
//             where: role
//                 ? { name: Array.isArray(role) ? { [Op.in]: role } : role }
//                 : undefined,
//         },
//     ];

//     // Filter isEnable (nếu có cột này)
//     if (typeof isEnable === "boolean") whereUser.isEnable = isEnable;

//     // Case-insensitive search cho name/email
//     const qn = (q || "").trim();
//     if (qn) {
//         // Fallback theo dialect
//         const dialect = User.sequelize.getDialect?.() || "";
//         if (dialect === "postgres") {
//             whereUser[Op.or] = [
//                 { name: { [Op.iLike]: `%${qn}%` } },
//                 { email: { [Op.iLike]: `%${qn}%` } },
//             ];
//         } else {
//             // MySQL/MariaDB …: dùng LOWER(...)
//             whereUser[Op.or] = [
//                 where(fn("LOWER", col("User.name")), { [Op.like]: `%${qn.toLowerCase()}%` }),
//                 where(fn("LOWER", col("User.email")), { [Op.like]: `%${qn.toLowerCase()}%` }),
//             ];
//         }
//     }

//     const offset = (Number(page) - 1) * Number(limit);

//     const { rows, count } = await User.findAndCountAll({
//         where: whereUser,
//         include,
//         order,
//         limit: Number(limit),
//         offset,
//         distinct: true,   // quan trọng khi có belongsToMany
//         subQuery: false,  // tránh subquery order bug khi include
//         // attributes: { exclude: ["passwordHash"] }, // nếu có
//     });

//     // Chuẩn hoá output một chút cho UI (roles -> names)
//     const data = rows.map((u) => {
//         const json = u.toJSON();
//         return {
//             userId: json.userId,           // <— nếu PK khác, đổi ở đây
//             name: json.name,
//             email: json.email,
//             isEnable: json.isEnable ?? true,
//             createdAt: json.createdAt ?? null,
//             roles: Array.isArray(json.roles) ? json.roles.map((r) => r.name) : [],
//         };
//     });

//     return {
//         rows: data,
//         total: count,
//         page: Number(page),
//         limit: Number(limit),
//     };
// }


export async function getAllAccountService({
    page = 1,
    limit = 20,
    q = "",
    role,
    sortBy = "createdAt",
    sortDir = "desc",
    isEnable,
} = {}) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const ps = Number(limit) > 0 ? Math.min(Number(limit), 100) : 20;
    const offset = (p - 1) * ps;

    const SORT_MAP = { name: "name", email: "email", createdAt: "createdAt" };
    const order = [
        [SORT_MAP[sortBy] || "createdAt", String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"],
        ["userId", "DESC"],
    ];

    const whereUser = {};
    if (typeof isEnable === "boolean") whereUser.isEnable = isEnable;

    const qn = String(q || "").trim();
    if (qn) {
        const qLower = `%${qn.toLowerCase()}%`;
        whereUser[Op.or] = [
            where(fn("LOWER", col("User.name")), { [Op.like]: qLower }),
            where(fn("LOWER", col("User.email")), { [Op.like]: qLower }),
        ];
    }

    const roleFilter = Array.isArray(role)
        ? role.map((r) => String(r).trim().toLowerCase()).filter(Boolean)
        : (role ? [String(role).trim().toLowerCase()] : []);

    const include = [{
        model: Role,
        as: "roles",                       // alias của bạn
        attributes: ["roleName"],          // 👈 dùng roleName
        through: { attributes: [] },
        required: roleFilter.length > 0,
        // 👇 lọc case-insensitive theo roles.role_name
        where: roleFilter.length
            ? where(fn("LOWER", col("roles.role_name")), { [Op.in]: roleFilter })
            : undefined,
    }];

    const { rows, count } = await User.findAndCountAll({
        where: whereUser,
        attributes: ["userId", "name", "email", "isEnable", "createdAt"],
        include,
        order,
        limit: ps,
        offset,
        distinct: true,
        subQuery: false,
    });

    const data = rows.map((u) => {
        const json = u.toJSON();
        const roles = Array.isArray(json.roles)
            ? json.roles
                .map((r) => String(r?.roleName ?? "").trim().toLowerCase()) // 👈 lấy từ roleName
                .filter(Boolean)
            : [];
        return {
            userId: json.userId,
            name: json.name || "",
            email: json.email || "",
            isEnable: !!json.isEnable,
            createdAt: json.createdAt ?? null,
            roles, // ["admin" | "staff" | "customer"] lowercase → FE hiển thị badge ngay
        };
    });

    return {
        rows: data,
        total: count,
        page: p,
        limit: ps,
    };
}


/**
 * Cập nhật access cho 1 account:
 * - isEnable (boolean)
 * - roleNames (string[]) -> setRoles (overwrite user_roles)
 *
 * Body ví dụ:
 * { "isEnable": true, "roleNames": ["staff"] }
 */
export async function updateAccountService(userId, payload = {}) {
    if (!userId) {
        const e = new Error("USER_ID_REQUIRED");
        e.statusCode = 400;
        throw e;
    }

    const hasEnable = Object.prototype.hasOwnProperty.call(payload, "isEnable");
    const hasRoleList = Object.prototype.hasOwnProperty.call(payload, "roleNames");

    if (!hasEnable && !hasRoleList) {
        const e = new Error("NO_FIELDS_TO_UPDATE");
        e.statusCode = 400;
        throw e;
    }

    if (hasEnable && typeof payload.isEnable !== "boolean") {
        const e = new Error("INVALID_isEnable");
        e.statusCode = 400;
        throw e;
    }

    // Whitelist cố định: admin/staff/customer
    const ALLOWED = new Set(["admin", "staff", "customer"]);

    let roleNamesNorm = [];
    if (hasRoleList) {
        if (!Array.isArray(payload.roleNames)) {
            const e = new Error("INVALID_roleNames_MUST_BE_ARRAY");
            e.statusCode = 400;
            throw e;
        }
        roleNamesNorm = Array.from(
            new Set(
                payload.roleNames
                    .map((r) => String(r || "").trim().toLowerCase())
                    .filter(Boolean)
            )
        );
        const invalid = roleNamesNorm.filter((n) => !ALLOWED.has(n));
        if (invalid.length) {
            const e = new Error(`INVALID_ROLE_NAMES: ${invalid.join(", ")}`);
            e.statusCode = 400;
            throw e;
        }
    }

    return await sequelize.transaction(async (t) => {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user) {
            const e = new Error("USER_NOT_FOUND");
            e.statusCode = 404;
            throw e;
        }

        // 1) Update isEnable nếu có
        if (hasEnable) {
            user.isEnable = payload.isEnable;
            await user.save({ transaction: t });
        }

        // 2) Overwrite roles nếu có roleNames
        if (hasRoleList) {
            let rolesToSet = [];
            if (roleNamesNorm.length > 0) {
                // Case-insensitive theo dialect
                const dialect = Role.sequelize.getDialect?.() || "";
                let whereRole;
                if (dialect === "postgres") {
                    whereRole = { roleName: { [Op.iLike]: { [Op.any]: roleNamesNorm } } }; // iLike ANY (array)
                    // Sequelize không luôn map ANY đẹp; cách an toàn:
                    whereRole = { roleName: { [Op.in]: roleNamesNorm } };
                } else {
                    // MySQL/MariaDB: đơn giản dùng IN (yêu cầu dữ liệu roleName lưu lowercase nhất quán)
                    whereRole = { roleName: { [Op.in]: roleNamesNorm } };
                }

                const rows = await Role.findAll({ where: whereRole, transaction: t });

                // Đảm bảo mọi roleName đều tồn tại trong DB
                const found = new Set(rows.map((r) => String(r.roleName).toLowerCase()));
                const missing = roleNamesNorm.filter((n) => !found.has(n));
                if (missing.length) {
                    const e = new Error(`ROLE_NAMES_NOT_FOUND_IN_DB: ${missing.join(", ")}`);
                    e.statusCode = 400;
                    throw e;
                }
                rolesToSet = rows;
            }

            await user.setRoles(rolesToSet, { transaction: t });
        }

        // Trả bản cập nhật kèm roles
        const fresh = await User.findByPk(userId, {
            include: [{ model: Role, as: "roles", through: { attributes: [] } }],
            transaction: t,
        });

        const j = fresh.toJSON();
        return {
            userId: j.userId,
            name: j.name,
            email: j.email,
            isEnable: j.isEnable ?? true,
            createdAt: j.createdAt ?? null,
            roles: Array.isArray(j.roles) ? j.roles.map((r) => r.roleName) : [],
        };
    });
}


const ALLOWED = new Set(["admin", "staff", "customer"]);

export async function addAccountService(payload = {}) {
    const { name, email, isEnable = true, roleNames = [], password } = payload || {};

    // ---- Validate cơ bản ----
    if (typeof name !== "string" || !name.trim()) {
        const e = new Error("INVALID_NAME"); e.statusCode = 400; throw e;
    }
    if (typeof email !== "string" || !email.trim()) {
        const e = new Error("INVALID_EMAIL"); e.statusCode = 400; throw e;
    }
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email.trim())) {
        const e = new Error("INVALID_EMAIL_FORMAT"); e.statusCode = 400; throw e;
    }
    if (typeof isEnable !== "boolean") {
        const e = new Error("INVALID_isEnable"); e.statusCode = 400; throw e;
    }
    if (!Array.isArray(roleNames)) {
        const e = new Error("INVALID_roleNames_MUST_BE_ARRAY"); e.statusCode = 400; throw e;
    }
    if (typeof password !== "string" || password.length < 6) {
        const e = new Error("INVALID_PASSWORD_MIN_LENGTH_6"); e.statusCode = 400; throw e;
    }

    const roleNamesNorm = Array.from(
        new Set(roleNames.map((r) => String(r || "").trim().toLowerCase()).filter(Boolean))
    );
    const invalid = roleNamesNorm.filter((n) => !ALLOWED.has(n));
    if (invalid.length) {
        const e = new Error(`INVALID_ROLE_NAMES: ${invalid.join(", ")}`); e.statusCode = 400; throw e;
    }

    // ---- Tx: unique email + create user + set roles ----
    return await sequelize.transaction(async (t) => {
        const existed = await User.findOne({ where: { email: email.trim() }, transaction: t });
        if (existed) {
            const e = new Error("EMAIL_ALREADY_EXISTS"); e.statusCode = 409; throw e;
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await User.create(
            { name: name.trim(), email: email.trim(), isEnable, passwordHash },
            { transaction: t }
        );

        let rolesToSet = [];
        if (roleNamesNorm.length > 0) {
            const rows = await Role.findAll({
                where: { roleName: { [Op.in]: roleNamesNorm } },
                transaction: t,
            });
            const found = new Set(rows.map((r) => String(r.roleName).toLowerCase()));
            const missing = roleNamesNorm.filter((n) => !found.has(n));
            if (missing.length) {
                const e = new Error(`ROLE_NAMES_NOT_FOUND_IN_DB: ${missing.join(", ")}`);
                e.statusCode = 400; throw e;
            }
            rolesToSet = rows;
        }

        await user.setRoles(rolesToSet, { transaction: t });

        const fresh = await User.findByPk(user.userId, {
            include: [{ model: Role, as: "roles", through: { attributes: [] } }],
            transaction: t,
        });

        const j = fresh.toJSON();
        return {
            userId: j.userId,
            name: j.name,
            email: j.email,
            isEnable: j.isEnable ?? true,
            createdAt: j.createdAt ?? null,
            roles: Array.isArray(j.roles) ? j.roles.map((r) => r.roleName) : [],
        };
    });
}