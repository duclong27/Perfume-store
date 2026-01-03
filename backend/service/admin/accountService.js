


import User from "../../model/User.js";
import Role from "../../model/Role.js";
import { Op, fn, col, where } from "sequelize";
import { sequelize } from "../../config/sequelize.js";
import bcrypt from "bcrypt";

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
        : role
            ? [String(role).trim().toLowerCase()]
            : [];

    const include = [
        {
            model: Role,
            as: "roles",
            attributes: ["roleName"],
            through: { attributes: [] },
            required: roleFilter.length > 0,
            where: roleFilter.length
                ? where(fn("LOWER", col("roles.role_name")), { [Op.in]: roleFilter })
                : undefined,
        },
    ];

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
                .map((r) => String(r?.roleName ?? "").trim().toLowerCase())
                .filter(Boolean)
            : [];
        return {
            userId: json.userId,
            name: json.name || "",
            email: json.email || "",
            isEnable: !!json.isEnable,
            createdAt: json.createdAt ?? null,
            roles,
        };
    });

    return {
        rows: data,
        total: count,
        page: p,
        limit: ps,
    };
}

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

        if (hasEnable) {
            user.isEnable = payload.isEnable;
            await user.save({ transaction: t });
        }

        if (hasRoleList) {
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
                    e.statusCode = 400;
                    throw e;
                }
                rolesToSet = rows;
            }

            await user.setRoles(rolesToSet, { transaction: t });
        }

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

    if (typeof name !== "string" || !name.trim()) {
        const e = new Error("INVALID_NAME");
        e.statusCode = 400;
        throw e;
    }
    if (typeof email !== "string" || !email.trim()) {
        const e = new Error("INVALID_EMAIL");
        e.statusCode = 400;
        throw e;
    }
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email.trim())) {
        const e = new Error("INVALID_EMAIL_FORMAT");
        e.statusCode = 400;
        throw e;
    }
    if (typeof isEnable !== "boolean") {
        const e = new Error("INVALID_isEnable");
        e.statusCode = 400;
        throw e;
    }
    if (!Array.isArray(roleNames)) {
        const e = new Error("INVALID_roleNames_MUST_BE_ARRAY");
        e.statusCode = 400;
        throw e;
    }
    if (typeof password !== "string" || password.length < 6) {
        const e = new Error("INVALID_PASSWORD_MIN_LENGTH_6");
        e.statusCode = 400;
        throw e;
    }

    const roleNamesNorm = Array.from(
        new Set(roleNames.map((r) => String(r || "").trim().toLowerCase()).filter(Boolean))
    );
    const invalid = roleNamesNorm.filter((n) => !ALLOWED.has(n));
    if (invalid.length) {
        const e = new Error(`INVALID_ROLE_NAMES: ${invalid.join(", ")}`);
        e.statusCode = 400;
        throw e;
    }

    return await sequelize.transaction(async (t) => {
        const existed = await User.findOne({ where: { email: email.trim() }, transaction: t });
        if (existed) {
            const e = new Error("EMAIL_ALREADY_EXISTS");
            e.statusCode = 409;
            throw e;
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
                e.statusCode = 400;
                throw e;
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
