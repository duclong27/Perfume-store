import { registerUserService, loginUserService, loginAdminOrStaffService, getUserByIdService } from "../../service/admin/userService.js"




const registerUserController = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const { token } = await registerUserService({ name, email, password });
        return res.status(201).json({ success: true, token });
    }
    catch (err) {
        const status = err.status || 500;
        console.error("Register error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Server error during register",
        });
    }
}



const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const { token } = await loginUserService({ email, password });
        return res.status(201).json({ success: true, token });
    }
    catch (err) {
        const status = err.status || 500;
        console.error("Login error:", err);
        return res.status(status).json({
            success: false,
            message: err.message || "Server error during register",
        });
    }
}


// const loginAdminOrStaffController = async (req, res, next) => {

//     try {
//         const { email = "", password = "" } = req.body || {};
//         const { token, user } = await loginAdminOrStaffService({ email, password });
//         return res.status(200).json({ success: true, token, user });
//     } catch (err) {
//         const status = err.status || 500;
//         let message = "Server error during login";
//         if (status === 401) message = "Invalid email or password";
//         if (status === 403) message = err.message || "Forbidden";
//         if (status === 404) message = "Invalid email or password";

//         console.error("Login admin/staff error:", err);
//         return res.status(status).json({ success: false, message });

//     }
// };


const loginAdminOrStaffController = async (req, res, next) => {
    // ✅ LOG 0: log ngay khi controller được hit (biết chắc request đã vào controller)
    console.log("[LOGIN] HIT", {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        contentType: req.headers["content-type"],
        origin: req.headers.origin,
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
    });

    // ✅ LOG 1: log body đã sanitize (che password)
    const raw = req.body || {};
    console.log("[LOGIN] BODY(safe)", {
        email: raw.email,
        password: raw.password ? "***" : undefined, // ✅ che
        // log thêm các field lạ nếu FE gửi sai key
        extraKeys: Object.keys(raw).filter((k) => !["email", "password"].includes(k)),
    });

    try {
        const { email = "", password = "" } = req.body || {};

        // ✅ LOG 2: log validate input “nhẹ”
        console.log("[LOGIN] PARSED", {
            emailType: typeof email,
            passwordType: typeof password,
            emailLen: typeof email === "string" ? email.trim().length : null,
            passwordLen: typeof password === "string" ? password.length : null,
        });

        const { token, user } = await loginAdminOrStaffService({ email, password });

        // ✅ LOG 3: log success (không log token full)
        console.log("[LOGIN] OK", {
            userId: user?.id || user?._id || user?.userId,
            email: user?.email,
            tokenPreview: token ? `${String(token).slice(0, 16)}...` : null,
        });

        return res.status(200).json({ success: true, token, user });
    } catch (err) {
        const status = err.status || err.statusCode || 500;

        // ✅ LOG 4: log error chi tiết (đặc biệt hữu ích khi 400)
        console.error("[LOGIN] ERROR", {
            status,
            name: err?.name,
            message: err?.message,
            // nếu bạn dùng validation lib (zod/joi/express-validator) thì thường có field này
            details: err?.errors || err?.details || err?.issues,
            stack: err?.stack,
        });

        let message = "Server error during login";
        if (status === 400) message = err.message || "Bad request"; // ✅ thêm case 400
        if (status === 401) message = "Invalid email or password";
        if (status === 403) message = err.message || "Forbidden";
        if (status === 404) message = "Invalid email or password";

        return res.status(status).json({ success: false, message });
    }
};







const getUserByIdController = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        const { user } = await getUserByIdService({ userId });

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        const status = err.status || err.statusCode || 500;

        if (process.env.NODE_ENV !== "test") {
            console.error("User getById error:", err);
        }

        return res.status(status).json({
            success: false,
            message: err.message || "User getById error",
        });
    }
};


export const demoAdminLoginController = async (req, res) => {
    try {
        if (process.env.DEMO_MODE !== "true") {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        const email = process.env.DEMO_ADMIN_EMAIL || "";
        const password = process.env.DEMO_ADMIN_PASSWORD || "";

        if (!email || !password) {
            return res.status(500).json({ success: false, message: "Demo env missing" });
        }

        const { token, user } = await loginAdminOrStaffService({ email, password });
        return res.status(200).json({ success: true, token, user });
    } catch (err) {
        const status = err.status || 500;
        let message = "Server error during demo login";
        if (status === 401) message = "Demo account invalid";
        if (status === 403) message = err.message || "Forbidden";
        console.error("Demo admin login error:", err);
        return res.status(status).json({ success: false, message });
    }
};



export { registerUserController, loginUserController, loginAdminOrStaffController, getUserByIdController }