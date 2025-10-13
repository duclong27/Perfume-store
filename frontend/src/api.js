import axios from "axios";

const TOKEN_KEY = "SHOP_TOKEN";

function readToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
    } catch { return null; }
}
function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch { }
}

export const api = axios.create({
    baseURL: (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, ""),
    withCredentials: false,
});

api.interceptors.request.use((cfg) => {
    const t = readToken();
    if (t) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${t}`;
    }
    // Debug đúng route preview để bạn tự nhìn thấy header thật sự:
    if (cfg.url?.includes("/internal/v1/preview")) {
        console.log("[API][preview] Authorization =", cfg.headers.Authorization?.slice(0, 24));
    }
    return cfg;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) clearToken();
        return Promise.reject(err);
    }
);
