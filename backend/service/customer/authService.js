
import bcrypt from "bcrypt";
import validator from "validator";
import User from "../../model/User.js";
import Role from "../../model/Role.js";
import { AppError } from "../../utils/AppError.js";
import { createToken } from "../../utils/token.js";





export async function registerUserService({ name, email, password }) {

    if (!name) {
        throw new AppError("Name must be tyed", 400);;
    }

    if (!email || !validator.isEmail(email)) {
        throw new AppError("Incorrect email format", 400);
    }

    if (!password || password.length < 8) {
        throw new AppError("Password must be at least 8 characters", 400);
    }


    const existed = await User.findOne({ where: { email } });
    if (existed) {
        throw new AppError("Email already registered", 409);
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name,
        email,
        passwordHash: hashedPassword

    });


    const token = createToken(user.userId);
    return { user, token };
}









export async function loginCustomerService({ email, password }) {
    // Basic validate
    const normEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!validator.isEmail(normEmail)) throw new AppError("Incorrect email format", 400);
    if (typeof password !== "string" || password.length === 0) throw new AppError("Password is required", 400);

    // Find user + roles
    const user = await User.findOne({
        where: { email: normEmail },
        attributes: ["userId", "email", "passwordHash", "isEnable"],
        include: [{
            model: Role,
            as: "roles",
            attributes: ["roleName"],
            through: { attributes: [] }
        }]
    });

    // Cùng thông điệp để tránh đoán tài khoản
    if (!user) throw new AppError("Invalid email or password", 401);
    if (user.isEnable === false) throw new AppError("Account is disabled", 403);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid email or password", 401);

    // Chuẩn hóa roles và yêu cầu phải có 'customer'
    const rolesRaw = Array.isArray(user.roles) ? user.roles : [];
    const roles = rolesRaw
        .map(r => (r?.roleName ?? "").toString().trim().toLowerCase())
        .filter(Boolean);

    if (!roles.includes("customer")) {
        throw new AppError("Forbidden: customer only", 403);
    }

    // Fallback an toàn nếu vì lý do nào đó roles trống
    const safeRoles = roles.length ? roles : ["customer"];

    // Issue token (mở rộng payload, giữ signature createToken(userId, extra))
    const token = createToken(user.userId, {
        roles: safeRoles,
        isEnable: user.isEnable !== false,
    });

    // Trả về theo spec cũ
    return {
        token,
        user: { id: user.userId, email: user.email, roles: safeRoles },
    };
}