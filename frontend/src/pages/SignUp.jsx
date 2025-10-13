
import React, { useMemo, useState } from "react";
import { Mail, Lock, Eye, EyeOff, Sparkles, SprayCan, ShieldCheck, Leaf, User2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignUpUI({
    brandName = "ARVENA",
    tagline = "Bring all the world to your bottle",
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { register, isWorking } = useAuth(); // register chỉ tạo account, không login

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const pwdHints = useMemo(() => {
        const hints = [];
        if ((password || "").length < 8) hints.push("≥ 8 characters");
        if (!/[A-Za-z]/.test(password)) hints.push("letters");
        if (!/\d/.test(password)) hints.push("numbers");
        return hints;
    }, [password]);

    function validate() {
        const next = {};
        const nm = String(name || "").trim();
        const em = String(email || "").trim().toLowerCase();

        if (!nm) next.name = "Name is required.";
        else if (nm.length > 100) next.name = "Name must be ≤ 100 characters.";

        if (!em) next.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(em)) next.email = "Invalid email format.";

        if (!password) next.password = "Password is required.";
        else if (password.length < 8) next.password = "Password must be at least 8 characters.";

        if (!confirm) next.confirm = "Please confirm your password.";
        else if (confirm !== password) next.confirm = "Passwords do not match.";

        setFieldErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (isWorking) return;

        setError("");
        setSuccess("");
        setFieldErrors({});

        if (!validate()) return;

        try {
            // Đăng ký: chỉ tạo tài khoản, KHÔNG auto-login
            const res = await register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            console.log("[SIGNUP] success:", res);
            setSuccess(res?.message || "Register successfully! Please sign in.");

            // Clear form
            setName("");
            setEmail("");
            setPassword("");
            setConfirm("");

            // Điều hướng sang trang đăng nhập (giữ from nếu có)
            const backState = location.state?.from ? { state: { from: location.state.from } } : undefined;
            setTimeout(() => {
                navigate("/loginPage", backState);
            }, 400);
        } catch (err) {
            // Bắt lỗi từ axios (được throw lên từ AuthContext)
            let msg = "Register failed";
            const resp = err?.response;
            if (!resp) {
                msg = "Network error: cannot reach server. Check API URL/CORS/backend.";
            } else if (typeof resp?.data === "string") {
                msg = resp.data;
            } else if (typeof resp?.data?.message === "string") {
                msg = resp.data.message;
            } else if (typeof resp?.data?.error === "string") {
                msg = resp.data.error;
            } else if (resp?.status === 409) {
                msg = "Email already registered.";
            } else {
                msg = `HTTP ${resp?.status || ""}`.trim();
            }
            setError(String(msg));
            console.error("[SIGNUP ERROR]", err);
        }
    }

    // UI
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6">
            <div className="relative w-full max-w-2xl md:grid-cols-2 gap-6">
                {/* LEFT: Form */}
                <div className="rounded-3xl text-2xl bg-white shadow-2xl border border-gray-200 p-8 relative overflow-hidden">
                    {/* Decorative gradient blobs */}
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
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <User2 className="h-5 w-5" />
                                </span>
                                <input
                                    id="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full rounded-xl bg-gray-50 border ${fieldErrors.name ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"} px-11 py-3.5 placeholder-gray-400 text-gray-900`}
                                />
                            </div>
                            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                        </div>

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
                                    className={`w-full rounded-xl bg-gray-50 border ${fieldErrors.email ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"} px-11 py-3.5 placeholder-gray-400 text-gray-900`}
                                />
                            </div>
                            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
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
                                    autoComplete="new-password"
                                    required
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full rounded-xl bg-gray-50 border ${fieldErrors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"} px-11 py-3.5 pr-12 placeholder-gray-400 text-gray-900`}
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
                            {(pwdHints.length > 0 || fieldErrors.password) && (
                                <p className="mt-1 text-sm text-gray-500">
                                    {fieldErrors.password ? <span className="text-red-600">{fieldErrors.password}</span> : <>Hint: include {pwdHints.join(", ")}.</>}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm" className="sr-only">Confirm Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <Lock className="h-5 w-5" />
                                </span>
                                <input
                                    id="confirm"
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    placeholder="Confirm Password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className={`w-full rounded-xl bg-gray-50 border ${fieldErrors.confirm ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"} px-11 py-3.5 pr-12 placeholder-gray-400 text-gray-900`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 text-gray-600"
                                >
                                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {fieldErrors.confirm && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isWorking}
                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors py-3.5 font-medium text-white shadow-lg disabled:opacity-70"
                        >
                            {isWorking ? "Signing up…" : "Create account"}
                        </button>

                        {/* Switch to login */}
                        <Link
                            to="/loginPage"
                            className="w-full block text-center rounded-xl bg-gray-900 hover:bg-black transition-colors py-3.5 font-medium text-white shadow-lg"
                        >
                            Already have an account? Sign in
                        </Link>

                        {/* Error / Success slot */}
                        {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
                        {success && <p role="status" className="text-emerald-600 text-sm text-center">{success}</p>}

                        {/* Trust badges */}
                        <div className="grid grid-cols-3 gap-3 pt-2 text-xl text-gray-600">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>Secure signup</span>
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
