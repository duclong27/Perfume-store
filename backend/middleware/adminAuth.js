import jwt from 'jsonwebtoken'
import { User, Role } from "../model/index.js";


export async function adminOnly(req, res, next) {
    try {
        const auth = req.headers.authorization || "";
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (!m) return res.status(401).json({ success: false, message: "NO_TOKEN" });
        const token = m[1];

        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
            clockTolerance: 5,
        });

        const admin = await User.findByPk(payload.userId, {
            include: [{ model: Role, as: "roles", through: { attributes: [] } }],
        });
        if (!admin) return res.status(401).json({ success: false, message: "ADMIN_NOT_FOUND" });

        const roleNames = (admin.roles || []).map(r => r.roleName);
        if (!roleNames.includes("admin")) {
            return res.status(403).json({ success: false, message: "FORBIDDEN" });
        }

        // cho controller/service dùng nếu cần
        req.admin = { adminId: admin.userId, roleNames, raw: payload };
        next();
    } catch (err) {
        console.error("[adminOnly] verify failed:", err?.name, err?.message);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}