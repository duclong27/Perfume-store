import bcrypt from "bcrypt";
import validator from "validator";
import User from "../../model/User.js";
import Role from "../../model/Role.js";
import { AppError } from "../../utils/AppError.js";
import { createToken } from "../../utils/token.js";




export async function registerUserService({ name, email, password }) {

    if (!name) {
        throw new AppError("Name must be typed", 400);;
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



export async function loginUserService({ email, password }) {
    // validate basic
    const normEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!validator.isEmail(normEmail)) {
        throw new AppError("Incorrect email format", 400);
    }
    if (typeof password !== "string" || password.length === 0) {
        throw new AppError("Password is required", 400);
    }

    // find user
    const user = await User.findOne({ where: { email: normEmail } });
    if (!user) {
        throw new AppError("User not found", 404);
    }

    // (optional) chặn tài khoản bị disable
    if (user.isEnable === false) {
        throw new AppError("Account is disabled", 403);
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash); // chú ý field
    if (!isMatch) {
        throw new AppError("Invalid credentials", 401);
    }

    // issue token
    const token = createToken(user.userId);
    return { token };

}




export async function loginAdminOrStaffService({ email, password }) {
    const normEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!validator.isEmail(normEmail)) throw new AppError("Incorrect email format", 400);
    if (typeof password !== "string" || password.length === 0) throw new AppError("Password is required", 400);

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


    if (!user) throw new AppError("Invalid email or password", 401);
    if (user.isEnable === false) throw new AppError("Account is disabled", 403);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid email or password", 401);


    const roles = (user.roles || [])
        .map(r => (r.roleName || "").toString().trim().toLowerCase());

    const canAdmin = roles.includes("staff") || roles.includes("admin");
    if (!canAdmin) throw new AppError("Forbidden: staff or admin only", 403);


    const token = createToken(user.userId);

    return {
        token,
        user: { id: user.userId, email: user.email, roles }
    };
}

export async function getUserByIdService({ userId } = {}) {
    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Invalid userId", 400);
    }

    const user = await User.findByPk(id, {
        include: [
            {
                model: Role,
                as: "roles",
                attributes: ["roleId", "role_name"],
                through: { attributes: [] },
            },
        ],
        attributes: ["userId", "name", "email", "isEnable", "createdAt"],
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return { user };
}

