// src/pages/AddAccountPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../App";
import { toast } from "react-toastify";


/* Atoms tái sử dụng */
const Label = ({ htmlFor, children, className = "" }) => (
    <label htmlFor={htmlFor} className={"mb-2 block text-xl font-medium text-white " + className}>
        {children}
    </label>
);
const Input = ({ className = "", ...props }) => (
    <input
        className={
            "h-14 w-full rounded-2xl border border-white/20 bg-white/10 px-5 text-2xl text-white placeholder-white/50 outline-none focus:border-indigo-300 " +
            className
        }
        {...props}
    />
);
const Select = ({ className = "", children, ...props }) => (
    <select
        className={
            "h-14 w-full rounded-2xl border border-white/20 bg-indigo-900/60 px-5 text-2xl text-white outline-none focus:border-indigo-300 " +
            className
        }
        {...props}
    >
        {children}
    </select>
);
const Button = ({ children, className = "", ...props }) => (
    <button
        className={
            "inline-flex items-center justify-center rounded-2xl px-6 py-4 text-2xl font-medium text-white transition focus:outline-none focus:ring-2 " +
            className
        }
        {...props}
    >
        {children}
    </button>
);

// /* Helpers */

function getToken() {
    const s = sessionStorage.getItem("token");
    if (s) return s.replace(/^"(.*)"$/, "$1");
    const l = localStorage.getItem("token");
    if (l) return l.replace(/^"(.*)"$/, "$1");
    return null;
}







export default function AddAccountPage() {
    const { state } = useLocation();
    const [pending, setPending] = useState(false);
    const [err, setErr] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // ← NEW
    const [role, setRole] = useState("");
    const [isEnable, setIsEnable] = useState(true);

    useEffect(() => {
        const pre = state || {
            name: "",
            email: "",
            password: "",
            isEnable: true,
            roleNames: [],
        };
        setName(pre.name || "");
        setEmail(pre.email || "");
        setPassword(pre.password || "");
        setConfirmPassword(pre.password || ""); // ← nếu có password truyền sẵn thì copy luôn
        setIsEnable(typeof pre.isEnable === "boolean" ? pre.isEnable : true);
        setRole(Array.isArray(pre.roleNames) && pre.roleNames[0] ? pre.roleNames[0] : "");
    }, [state]);

    const isPwTooShort = !!password && password.length < 6;
    const isPwMismatch = password !== confirmPassword;

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");

        if (!name.trim()) return setErr("Name is required");
        if (!email.trim()) return setErr("Email is required");
        if (!password) return setErr("Password is required");
        if (isPwTooShort) return setErr("Password must be at least 6 characters");
        if (isPwMismatch) return setErr("Confirm password does not match");

        const token = getToken();
        if (!token) {
            toast.error("NO_TOKEN · Please login again");
            return;
        }

        const payload = {
            name: name.trim(),
            email: email.trim(),
            password,
            isEnable: !!isEnable,
            roleNames: role ? [role] : [],
        };

        try {
            setPending(true);
            await api.post("/api/account/addAccount", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Account created successfully 🎉");
            // Tuỳ chọn: reset form để nhập tiếp
            // setName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setRole(""); setIsEnable(true);
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || "Account created unsuccessfully";
            setErr(msg);
            toast.error(msg);
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="rounded-3xl min-h-screen w-[90%] bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-semibold text-white">Admin · Add Account</h1>
                </div>

                {err && (
                    <div className="mt-4 rounded-2xl bg-rose-500/15 p-4 text-2xl text-rose-200 ring-1 ring-rose-400/20">
                        {err}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-1">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                    </div>

                    <div className="md:col-span-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                    </div>

                    <div className="md:col-span-1">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (err) setErr(""); }}
                            placeholder="••••••••"
                        />
                        {isPwTooShort && <p className="mt-1 text-sm text-rose-200">Ít nhất 6 ký tự.</p>}
                    </div>

                    {/* NEW: Confirm password */}
                    <div className="md:col-span-1">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); if (err) setErr(""); }}
                            placeholder="••••••••"
                        />
                        {confirmPassword && isPwMismatch && (
                            <p className="mt-1 text-sm text-rose-200">Confirm password không khớp.</p>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <Label htmlFor="role">Role</Label>
                        <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="" className="bg-indigo-900">— Select role —</option>
                            {["admin", "staff", "customer"].map((r) => (
                                <option key={r} value={r} className="bg-indigo-900">{r}</option>
                            ))}
                        </Select>
                        <div className="mt-2 text-white/70 text-base">Lưu sẽ <b>overwrite</b> roles theo lựa chọn.</div>
                    </div>

                    <div className="md:col-span-1">
                        <Label className="!mb-3">isEnable</Label>
                        <div className="flex items-center gap-4">
                            <span className={"px-3 py-1 rounded-full " + (isEnable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                {isEnable ? "Enabled" : "Disabled"}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsEnable((v) => !v)}
                                className={
                                    "relative inline-flex h-10 w-20 items-center rounded-full transition " +
                                    (isEnable ? "bg-emerald-500/70" : "bg-rose-500/70")
                                }
                            >
                                <span className={"inline-block h-8 w-8 transform rounded-full bg-white transition " + (isEnable ? "translate-x-10" : "translate-x-2")} />
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-2 flex gap-3">
                        <Button
                            type="submit"
                            disabled={pending || isPwTooShort || isPwMismatch}
                            className="bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pending ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Saving…
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                        <Button
                            type="button"
                            onClick={() => { setName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setRole(""); setIsEnable(true); }}
                            className="bg-white/10 hover:bg-white/20 text-white"
                            disabled={pending}
                        >
                            Clear Form
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}