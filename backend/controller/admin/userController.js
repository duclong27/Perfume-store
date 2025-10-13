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


const loginAdminOrStaffController = async (req, res, next) => {

    try {
        const { email = "", password = "" } = req.body || {};
        const { token, user } = await loginAdminOrStaffService({ email, password });
        return res.status(200).json({ success: true, token, user });
    } catch (err) {
        const status = err.status || 500;
        let message = "Server error during login";
        if (status === 401) message = "Invalid email or password";
        if (status === 403) message = err.message || "Forbidden";
        if (status === 404) message = "Invalid email or password";

        console.error("Login admin/staff error:", err);
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


export { registerUserController, loginUserController, loginAdminOrStaffController, getUserByIdController }