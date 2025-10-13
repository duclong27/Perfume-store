import jwt from "jsonwebtoken";

export function authCustomer(req, res, next) {
    try {
        console.log("===== authCustomer start =====");

        // 1) Lấy token từ header/cookie
        const authHeader = req.get("authorization") || req.get("Authorization") || "";
        console.log("[Header] raw:", authHeader);

        const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
        console.log("[Header] bearer token:", bearer);

        const cookieToken = req.cookies?.token;
        console.log("[Cookie] token:", cookieToken);

        const token = (bearer || cookieToken || "").trim();
        console.log("[Final] token:", token ? token.slice(0, 30) + "..." : null);

        if (!token) {
            console.log("❌ No token found");
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // 2) Verify token
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
                clockTolerance: 15,
            });
            console.log("[Verify] payload:", payload);
        } catch (err) {
            console.error("❌ JWT verify error:", err.name, err.message);
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        // 3) Đọc uid, roles, isEnable
        const uid = payload?.uid ?? payload?.sub ?? payload?.id ?? payload?.userId;
        const roles = Array.isArray(payload?.roles) ? payload.roles.map(String) : [];
        const isEnable = payload?.isEnable !== false;

        console.log("[Payload] uid:", uid);
        console.log("[Payload] roles:", roles);
        console.log("[Payload] isEnable:", isEnable);

        if (!uid) {
            console.log("❌ Token không có userId/uid/sub/id");
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        if (!isEnable) {
            console.log("❌ Account bị disable");
            return res.status(403).json({ success: false, message: "Account is disabled" });
        }

        // 4) Check role customer
        const lc = roles.map(r => r.trim().toLowerCase());
        const isCustomer = lc.includes("customer");
        const hasStaffOrAdmin = lc.includes("staff") || lc.includes("admin");

        console.log("[Role check] lc:", lc);
        console.log("[Role check] isCustomer:", isCustomer);
        console.log("[Role check] hasStaffOrAdmin:", hasStaffOrAdmin);

        if (!isCustomer || hasStaffOrAdmin) {
            console.log("❌ Không hợp lệ: phải là customer-only");
            return res.status(403).json({ success: false, message: "Forbidden: customer only" });
        }

        // 5) Gắn vào req
        req.auth = { userId: uid, roles: lc };
        console.log("✅ Auth success:", req.auth);
        console.log("===== authCustomer end =====");

        next();
    } catch (err) {
        console.error("❌ authCustomer unexpected error:", err);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}
