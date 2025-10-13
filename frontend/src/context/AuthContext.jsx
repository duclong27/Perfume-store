// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../App.jsx";

// -------------------- Storage helpers --------------------
const TOKEN_KEY = "SHOP_TOKEN";
const DEBUG_AUTH = true; // bật/tắt log nhanh

function log(...args) {
    if (!DEBUG_AUTH) return;
    // Dùng groupCollapsed cho gọn console
    if (typeof args[0] === "string") {
        console.groupCollapsed(`[AUTH] ${args[0]}`);
        args.slice(1).forEach((a) => console.log(a));
        console.groupEnd();
    } else {
        console.log("[AUTH]", ...args);
    }
}

function saveToken(token, remember) {
    try {
        if (remember) localStorage.setItem(TOKEN_KEY, token);
        else sessionStorage.setItem(TOKEN_KEY, token);
        log("saveToken()", { remember, tokenPreview: String(token).slice(0, 12) + "..." });
    } catch (e) {
        console.warn("[AUTH] saveToken error:", e);
    }
}

function getToken() {
    try {
        const t = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
        log("getToken()", { exists: !!t, storage: localStorage.getItem(TOKEN_KEY) ? "local" : (sessionStorage.getItem(TOKEN_KEY) ? "session" : "none") });
        return t;
    } catch {
        return null;
    }
}

function clearToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        log("clearToken()");
    } catch { }

}




// -------------------- Context --------------------
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);    // loading phiên ban đầu
    const [isWorking, setIsWorking] = useState(false);   // loading cho hành động (login/register)

    // --- Attach token & auto-logout on 401 via interceptors ---
    useEffect(() => {
        const reqId = api.interceptors.request.use((config) => {
            const t = getToken();
            if (t) {
                config.headers.Authorization = `Bearer ${t}`;
                log("Request attach token", { method: config.method, url: config.url });
                // log cho preview 
                if (String(config.url || '').includes('/internal/v1/preview')) {
                    console.log('[AUTH] attach for /internal/v1/preview →', !!t);
                }
                ///    
            } else {
                log("Request no token", { method: config.method, url: config.url });
            }
            return config;
        });

        const resId = api.interceptors.response.use(
            (res) => {
                log("Response OK", { url: res.config?.url, status: res.status });
                return res;
            },
            (err) => {
                const status = err?.response?.status;
                const url = err?.config?.url;
                const data = err?.response?.data;
                log("Response ERROR", { url, status, data });
                if (status === 401) {
                    // Token hết hạn/không hợp lệ -> clear & logout tại chỗ
                    clearToken();
                    setUser(null);
                    log("Auto-logout due to 401");
                }
                return Promise.reject(err);
            }
        );

        log("Interceptors mounted");
        return () => {
            api.interceptors.request.eject(reqId);
            api.interceptors.response.eject(resId);
            log("Interceptors unmounted");
        };
    }, []);

    // --- Khôi phục phiên khi reload ---
    useEffect(() => {
        const token = getToken();
        if (!token) {
            log("No token on boot → skip /me");
            setIsLoading(false);
            return;
        }
        log("Boot restore → GET /internal/v1/me");
        api
            .get("/internal/v1/me")
            .then((res) => {
                const userObj = res.data?.data ?? res.data;
                setUser(userObj);
                log("Boot /me success", userObj);
            })
            .catch((e) => {
                clearToken();
                setUser(null);
                log("Boot /me failed → clear token", {
                    status: e?.response?.status,
                    data: e?.response?.data,
                });
            })
            .finally(() => setIsLoading(false));
    }, []);


    async function login({ email, password, remember }) {
        setIsWorking(true);
        log("LOGIN start", { email, remember });
        try {
            const res = await api.post("/api/v1/loginCustomer", { email, password });
            log("LOGIN raw response", res.data);

            const payload = res.data?.data ?? res.data; // tương thích cả 2 kiểu
            const { token, user: u } = payload || {};
            log("LOGIN parsed payload", { hasToken: !!token, hasUser: !!u });

            if (!token) throw new Error("Missing token in response");

            // 1) Lưu token theo remember
            saveToken(token, !!remember);

            // 2) Gắn ngay Authorization cho axios instance (để các call tiếp theo như /me dùng được)
            try {
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            } catch (e) {
                // không fatal, chỉ log
                log("LOGIN set default Authorization failed", e?.message || e);
            }

            // 3) Set user
            if (u) {
                setUser(u);
                log("LOGIN setUser from response.user", u);
                console.log("[Auth] setUser from login payload →", { userId: u?.userId, name: u?.name });
            } else {
                log("LOGIN fetch /internal/v1/me (no user in login payload)");
                const me = await api.get("/internal/v1/me"); // đã có header ở bước (2)
                const userObj = me.data?.data ?? me.data;
                setUser(userObj);
                log("LOGIN /me success", userObj);
                console.log("[Auth] setUser from /me →", { userId: userObj?.userId, name: userObj?.name });
            }
            return payload;
        } catch (err) {
            log("LOGIN failed", {
                status: err?.response?.status,
                data: err?.response?.data,
                message: err?.message,
            });
            throw err;
        } finally {
            setIsWorking(false);
            log("LOGIN end");
        }
    }




    async function register({ name, email, password /*, remember (bỏ qua) */ }) {
        setIsWorking(true);
        log("REGISTER start (create-only)", { name, email });
        try {
            // chỉ gọi API tạo account
            const res = await api.post("/api/v1/registerCustomer", { name, email, password });
            log("REGISTER raw response", res.data);

            const payload = res.data?.data ?? res.data;

            // ❗ Không set token, không setUser, không gọi /me
            // FE sẽ hiển thị thông báo & điều hướng qua trang login

            log("REGISTER success (no login)");
            return {
                ok: true,
                payload,
                message: payload?.message || "Register successfully. Please sign in.",
            };
        } catch (err) {
            log("REGISTER failed", {
                status: err?.response?.status,
                data: err?.response?.data,
                message: err?.message,
            });
            throw err;
        } finally {
            setIsWorking(false);
            log("REGISTER end");
        }
    }



    function logout() {
        clearToken();
        delete api.defaults.headers.common["Authorization"]; // tránh gọi /cart với header cũ
        setUser(null);
    }


    async function loadMe() {
        log("loadMe → GET /internal/v1/me");
        const res = await api.get("/internal/v1/me");
        const userObj = res.data?.data ?? res.data;
        setUser(userObj);
        log("loadMe success", userObj);
        return userObj;
    }

    const value = useMemo(
        () => ({
            user,
            isLoading,    // loading khởi động phiên
            isWorking,    // loading cho login/register
            login,
            register,
            logout,
            loadMe,
            setUser,      // mở cho trường hợp muốn cập nhật tên/ảnh sau khi user edit profile
        }),
        [user, isLoading, isWorking]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -------------------- Hook tiện lợi --------------------
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within <AuthProvider>");
    }
    return ctx;
}



