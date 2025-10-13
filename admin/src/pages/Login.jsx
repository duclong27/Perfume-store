import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { api } from '../App'


export default function AdminLoginForm({ setToken }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/admin/dashboard";


    async function onSubmit(e) {
        console.log("[API] baseURL =", api.defaults.baseURL);
        e.preventDefault();
        console.log("[LOGIN] full URL =", api.defaults.baseURL + "/api/user/loginAdminOrStaff");
        if (loading) return;
        setError("");
        setLoading(true);

        try {
            console.groupCollapsed("%c[LOGIN] start", "color:#a78bfa");
            console.log("API_BASE:", api.defaults.baseURL);
            console.log("endpoint:", "/api/user/loginAdminOrStaff");
            console.groupEnd();

            const payload = {
                email: email.trim(),
                password: password.trim(),
                remember,
            };

            const { data } = await api.post("/api/user/loginAdminOrStaff", payload);

            if (!data?.token) {
                throw new Error("Không nhận được token từ server");
            }

            // ✅ Lưu token theo tùy chọn Remember
            if (remember) {
                localStorage.setItem("token", data.token);
                sessionStorage.removeItem("token");
            } else {
                sessionStorage.setItem("token", data.token);
                localStorage.removeItem("token");
            }

            setToken(data.token);
            navigate(from, { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (!err.response) {
                    // network / CORS / server unreachable
                    setError("Network error: không thể kết nối server. Kiểm tra API URL/CORS/backend.");
                    console.error("[AXIOS NETWORK ERROR]", err.message, err.code, err.toJSON?.());
                } else {
                    const msg = err.response.data?.message || `HTTP ${err.response.status}`;
                    setError(msg);
                }
            } else {
                setError(err?.message || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg flex items-center justify-center">
            <div className="relative w-full max-w-md">
                <div className="rounded-3xl max-w-md bg-white/10 backdrop-blur-xl shadow-2xl border border-white/10 p-8 text-white">
                    <h1 className="text-3xl font-semibold mb-6">Login</h1>

                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="sr-only">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl bg-white/15 border border-white/20 focus:border-white/40 focus:outline-none px-4 py-3 placeholder-white/60 text-white"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                type={showPwd ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl bg-white/15 border border-white/20 focus:border-white/40 focus:outline-none px-4 py-3 pr-11 placeholder-white/60 text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                aria-label={showPwd ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
                            >

                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    className="h-5 w-5 opacity-80">
                                    {showPwd ? (
                                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                    ) : (
                                        <>
                                            <path d="M3 3l18 18" />
                                            <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-3.42M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.42 18.42 0 0 1-5.28 5.38" />
                                            <path d="M6.24 6.24A18.76 18.76 0 0 0 2 12s3.5 6 10 6c1.46 0 2.83-.28 4.04-.78" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>

                        {/* Remember */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-white focus:ring-white/40"
                                />
                                <span className="text-white/80">Remember me</span>
                            </label>
                            <a href="#" className="text-white/70 hover:text-white underline underline-offset-4">
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-[#7A58FF] hover:bg-[#6B4BFF] transition-colors py-3 font-medium shadow-lg shadow-black/10 disabled:opacity-70"
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>

                        {/* Error */}
                        {error && (
                            <p role="alert" className="text-pink-200 text-sm text-center">{error}</p>
                        )}
                    </form>
                </div>

                <div className="absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent blur-2xl" />
            </div>
        </div>
    );
}
