


// src/components/LoginUI.jsx
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Sparkles, SprayCan, ShieldCheck, Leaf } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ⟵ dùng AuthContext (Cách A)

function extractErrorMessage(err) {
    try {
        const resp = err?.response;
        if (!resp) return "Network error. Please try again.";
        if (typeof resp?.data === "string") return resp.data;
        if (typeof resp?.data?.message === "string") return resp.data.message;
        if (typeof resp?.data?.error === "string") return resp.data.error;
        if (resp?.status === 401) return "Invalid email or password";
        if (resp?.status === 403) return "Forbidden";
        return `HTTP ${resp?.status || ""}`.trim();
    } catch {
        return "Login failed";
    }
}

export default function LoginUI({
    initialEmail = "",
    initialPassword = "",
    initialRemember = false,
    loading: loadingProp = false,    // vẫn giữ để tương thích nếu parent muốn override
    error: errorProp = "",
    heroImageUrl = "",
    brandName = "ARVENA",
    tagline = "Bring all the world to your perfume bottle",
    onSubmit,                        // vẫn giữ để không vỡ API, nhưng mặc định dùng AuthContext
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isWorking } = useAuth();        // ⟵ lấy login + loading từ context

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState(initialPassword);
    const [remember, setRemember] = useState(initialRemember);
    const [showPwd, setShowPwd] = useState(false);

    // state nội bộ để điều khiển loading + error mà KHÔNG đổi UI
    const [loadingState, setLoadingState] = useState(false);
    const [errorState, setErrorState] = useState("");

    // hợp nhất với prop để JSX GIỮ NGUYÊN (JSX đang dùng biến 'loading' và 'error')
    const loading = loadingProp || isWorking || loadingState; // ưu tiên context
    const error = errorProp || errorState;

    async function handleSubmit(e) {
        e.preventDefault();

        // Nếu parent muốn can thiệp toàn bộ, cho phép override
        if (onSubmit) return onSubmit({ email: email.trim(), password: password.trim(), remember });

        if (loading) return;
        setErrorState("");
        setLoadingState(true);

        try {
            // Cách A: giao hết cho AuthContext
            await login({
                email: email.trim().toLowerCase(),
                password: password.trim(),
                remember,
            });

            // Đăng nhập OK → điều hướng (ưu tiên quay lại trang trước nếu có)
            const back = location.state?.from || "/http://localhost:5173";
            navigate(back, { replace: true });
            // console.log("[LOGIN] success");
        } catch (err) {
            const msg = extractErrorMessage(err);
            setErrorState(String(msg)); // luôn là string để render an toàn
            console.error("[LOGIN ERROR]", err);
        } finally {
            setLoadingState(false);
        }
    }

    // ==== UI GIỮ NGUYÊN 100% ====
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6">
            <div className="relative w-full max-w-2xl  md:grid-cols-2 gap-6">
                {/* LEFT: Form */}
                <div className="rounded-3xl text-2xl bg-white shadow-2xl border border-gray-200 p-8  relative overflow-hidden">
                    {/* Decorative perfume mist */}
                    <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-100 to-pink-100 blur-3xl opacity-70" />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-rose-100 to-amber-100 blur-3xl opacity-60" />

                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
                            <SprayCan className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight">{brandName}</h1>
                            <p className="text-sm text-gray-500 -mt-0.5">{tagline}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="sr-only">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <Mail className="h-5 w-5" />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl bg-gray-50 border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-11 py-3.5 placeholder-gray-400 text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <Lock className="h-5 w-5" />
                                </span>
                                <input
                                    id="password"
                                    type={showPwd ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl bg-gray-50 border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-11 py-3.5 pr-12 placeholder-gray-400 text-gray-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    aria-label={showPwd ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 text-gray-600"
                                >
                                    {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700 text-xl">Remember me</span>
                            </label>
                            <a href="#" className="text-indigo-600 text-xl hover:text-indigo-700 underline underline-offset-4">
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors py-3.5 font-medium text-white shadow-lg disabled:opacity-70"
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>

                        {/* Switch to signup */}
                        <Link
                            to="/signUpPage"  // ⟵ giữ nguyên đường dẫn bạn đang dùng
                            className="w-full block text-center rounded-xl bg-gray-900 hover:bg-black transition-colors py-3.5 font-medium text-white shadow-lg"
                        >
                            Don't have a account yet ? Sign up
                        </Link>

                        {/* Error */}
                        {error && (
                            <p role="alert" className="text-red-600 text-sm text-center">{error}</p>
                        )}

                        {/* Trust badges / perfume hints */}
                        <div className="grid grid-cols-3 gap-3 pt-2 text-xl text-gray-600">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>Secure login</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                <span>Clean UI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Leaf className="h-4 w-4 text-amber-600" />
                                <span>Fragrance brand</span>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Ambient glow */}
                <div className="pointer-events-none absolute -z-10 inset-0">
                    <div className="absolute left-1/4 top-0 h-40 w-40 bg-indigo-200/30 blur-3xl rounded-full" />
                    <div className="absolute right-0 bottom-0 h-48 w-48 bg-rose-200/30 blur-3xl rounded-full" />
                </div>
            </div>
        </div>
    );
}
