// src/pages/AdminAccounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

/* --------------------------------------------------------------------------
   UI atoms (giống Orders)
-------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   Constants & helpers
-------------------------------------------------------------------------- */
const ROLES = ["admin", "staff", "customer"];

const roleTone = (r) => {
    switch (r) {
        case "admin":
            return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
        case "staff":
            return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
        case "customer":
            return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
        default:
            return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
    }
};

const prettyRole = (r) => {
    const s = String(r || "").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
};

const enableTone = (b) => (b ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700");

const normalize = (s = "") =>
    s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// const roleFromAny = (x) => {
//     if (typeof x === "string") return x.trim().toLowerCase();
//     if (x && typeof x === "object") {
//         const v = x.roleName ?? x.name ?? x.role ?? x.code ?? "";
//         return String(v).trim().toLowerCase();
//     }
//     return "";
// };



function roleFromAny(x) {
    if (!x) return "";
    if (typeof x === "string") return x.trim().toLowerCase();

    if (typeof x === "object") {
        // thử các key phổ biến
        const candidates = [
            x.roleName, x.rolename, x.name, x.role, x.code, x.key, x.slug, x.type,
            // trường hợp join Sequelize: { Role: { name: "admin" } } hoặc { role: { name: "admin" } }
            x?.Role?.name, x?.role?.name, x?.Role?.code, x?.role?.code,
        ].filter(Boolean);

        for (const c of candidates) {
            const v = String(c).trim().toLowerCase();
            if (v) return v;
        }
    }
    return "";
}

// helper: gom role đầu tiên từ tất cả field có thể có trên object user
function firstRoleFromUser(u = {}) {
    const sources = [
        u.roles,        // ["admin"] hoặc [{roleName:"admin"}]
        u.userRoles,    // join camelCase
        u.user_roles,   // join snake_case
        u.roleNames,    // ["admin", ...]
        u.role,         // "admin"
        u.role_name,    // "admin"
        u.Role,         // { name: "admin" }
    ].filter(Boolean);

    const found = [];
    for (const src of sources) {
        if (Array.isArray(src)) {
            for (const item of src) {
                const r = roleFromAny(item);
                if (r) { found.push(r); break; }
            }
        } else {
            const r = roleFromAny(src);
            if (r) { found.push(r); }
        }
        if (found.length) break; // lấy cái đầu tiên
    }

    let role = found[0] || "";
    if (role && Array.isArray(ROLES)) {
        role = ROLES.includes(role) ? role : ""; // lọc ngoài whitelist
    }
    return role;
}

export function normalizeUser(raw = {}) {
    const rawRoles = Array.isArray(raw.roles) ? raw.roles : [];
    const roles = rawRoles.map(roleFromAny).filter(Boolean);

    return {
        userId: raw.userId ?? raw.id,
        name: raw.name ?? "",
        email: raw.email ?? "",
        isEnable: !!raw.isEnable,
        createdAt: raw.createdAt ?? raw.created_at ?? null,
        roles, // ← đảm bảo ["staff"] dạng string lowercase
    };
}

/* --------------------------------------------------------------------------
   Page: AdminAccounts
-------------------------------------------------------------------------- */
export default function AdminAccountPage() {
    // data
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [rowsAll, setRowsAll] = useState([]);
    const navigate = useNavigate();

    // filter/sort
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | email
    const [sortDir, setSortDir] = useState("desc"); // asc | desc

    // per-row edits & pending
    const [edits, setEdits] = useState({}); // { [userId]: { isEnable?: boolean, role?: string } }
    const [pending, setPending] = useState({}); // { [userId]: true }

    const getDraft = (u) => {
        if (!u || typeof u !== "object") {
            console.warn("[getDraft] invalid user:", u);
            return { isEnable: false, role: "" };
        }

        const e = edits[u.userId];

        // 1) Ưu tiên role đang chỉnh (edits)
        let fromEdits = (typeof e?.role === "string" && e.role !== "") ? e.role.trim().toLowerCase() : "";

        // 2) Nếu chưa có, lấy từ u.roles[0] (đã normalize) hoặc dò từ bảng liên kết/field khác
        let fromUser =
            (Array.isArray(u.roles) && u.roles.length ? String(u.roles[0]).trim().toLowerCase() : "") ||
            firstRoleFromUser(u);

        // 3) (tuỳ chọn) ép vào whitelist
        if (fromEdits && Array.isArray(ROLES) && !ROLES.includes(fromEdits)) fromEdits = "";
        if (fromUser && Array.isArray(ROLES) && !ROLES.includes(fromUser)) fromUser = "";

        const role = fromEdits || fromUser || "";
        const isEnable = (typeof e?.isEnable === "boolean") ? e.isEnable : !!u.isEnable;

        // LOG nhìn nguồn lấy role
        console.log("[getDraft] resolve", {
            userId: u.userId,
            raw: {
                roles: u.roles, userRoles: u.userRoles, user_roles: u.user_roles,
                roleNames: u.roleNames, role: u.role, role_name: u.role_name, Role: u.Role
            },
            fromEdits, fromUser, finalRole: role || "(empty)", isEnable,
        });

        return { isEnable, role };
    };



    const setDraftField = (userId, field, value) => {
        setEdits((prev) => {
            const cur = prev[userId] ?? {};
            return { ...prev, [userId]: { ...cur, [field]: value } };
        });
    };

    const isRowPending = (id) => !!pending[id];




    // fetch
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr("");
                const { data } = await api.get("/api/account/getAllAccounts", {
                    params: { page: 1, limit: 1000, sortBy: "createdAt", sortDir: "desc" },
                });
                const payload = data?.data ?? data ?? {};
                const rowsRaw = Array.isArray(payload?.rows)
                    ? payload.rows
                    : Array.isArray(payload)
                        ? payload
                        : [];

                const mapped = rowsRaw.map(normalizeUser);

                // ✅ FIX: ép roles → string lowercase để khớp option của <select>
                const mappedFixed = mapped.map(u => ({
                    ...u,
                    roles: (u.roles || []).map(r => {
                        if (typeof r === "string") return r.trim().toLowerCase();
                        const v = r?.roleName ?? r?.name ?? r?.role ?? "";
                        return String(v).trim().toLowerCase();
                    }),
                }));

                if (!cancelled) setRowsAll(mappedFixed);
            } catch (e) {
                if (!cancelled)
                    setErr(e?.response?.data?.message || e.message || "Không tải được danh sách account.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // filter
    const filtered = useMemo(() => {
        let arr = rowsAll;
        const nq = normalize(q);
        if (nq) {
            arr = arr.filter((u) => {
                const name = normalize(u.name);
                const email = normalize(u.email);
                const uid = String(u.userId || "").toLowerCase();
                return name.includes(nq) || email.includes(nq) || uid.includes(nq);
            });
        }
        if (roleFilter) {
            // ✅ FIX: so sánh cùng lowercase
            const rf = roleFilter.trim().toLowerCase();
            arr = arr.filter((u) => (u.roles || []).some(x => String(x).trim().toLowerCase() === rf));
        }
        return arr;
    }, [rowsAll, q, roleFilter]);

    // sort (giữ nguyên)
    const rows = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            let va = a[sortBy];
            let vb = b[sortBy];
            if (sortBy === "createdAt") {
                va = va ? new Date(va).getTime() : 0;
                vb = vb ? new Date(vb).getTime() : 0;
            }
            if (sortBy === "name" || sortBy === "email") {
                va = (va || "").toString().toLowerCase();
                vb = (vb || "").toString().toLowerCase();
            }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortBy, sortDir]);



    // getToken
    function getToken() {
        const s = sessionStorage.getItem("token");
        if (s) return s.replace(/^"(.*)"$/, "$1");
        const l = localStorage.getItem("token");
        if (l) return l.replace(/^"(.*)"$/, "$1");
        return null;
    }



    // save
    async function handleSaveRow(u) {
        const draft = getDraft(u);
        const patch = {};
        if (typeof draft.isEnable === "boolean" && draft.isEnable !== u.isEnable) {
            patch.isEnable = draft.isEnable;
        }
        const currentRole = u.roles[0] || "";
        if ((draft.role || "") !== currentRole) {
            patch.roleNames = draft.role ? [draft.role] : [];
        }
        if (!patch.hasOwnProperty("isEnable") && !patch.hasOwnProperty("roleNames")) return;

        // LẤY TOKEN NGAY TRƯỚC KHI GỌI API
        const token = getToken();
        if (!token) {
            toast.error("NO_TOKEN · Vui lòng đăng nhập lại");
            return;
        }

        // optimistic UI (giữ nguyên như bạn đã có) ...
        const oldRow = { ...u };
        setPending((p) => ({ ...p, [u.userId]: true }));
        setRowsAll((prev) =>
            prev.map((x) =>
                x.userId === u.userId
                    ? {
                        ...x,
                        isEnable: patch.hasOwnProperty("isEnable") ? patch.isEnable : x.isEnable,
                        roles: patch.hasOwnProperty("roleNames") ? [...(patch.roleNames || [])] : [...(x.roles || [])],
                        __pending: true,
                    }
                    : x
            )
        );

        try {
            // GẮN BEARER VÀO CHÍNH LỜI GỌI PATCH NÀY
            const { data } = await api.patch(
                `/api/account/updateAccount/${u.userId}`,
                patch,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updated = data?.data;
            const normalized = updated ? normalizeUser(updated) : { ...oldRow, ...patch, roles: patch.roleNames ?? oldRow.roles };

            setRowsAll((prev) =>
                prev.map((x) => (x.userId === u.userId ? { ...normalized, __pending: false } : x))
            );
            setEdits((prev) => ({
                ...prev,
                [u.userId]: { isEnable: normalized.isEnable, role: normalized.roles[0] || "" },
            }));
            toast.success("Updated successfully 🎉");
        } catch (e) {
            setRowsAll((prev) =>
                prev.map((x) => (x.userId === u.userId ? { ...oldRow, __pending: false } : x))
            );
            const msg = e?.response?.data?.message || e.message || "Cập nhật thất bại";
            toast.error(msg);
        } finally {
            setPending((p) => ({ ...p, [u.userId]: false }));
        }
    }



    /* -------------------------------- UI -------------------------------- */
    if (loading) {
        return (
            <div className="rounded-3xl min-h-screen w-[90%] bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur text-white">
                    <div className="text-3xl font-semibold">Admin · Accounts</div>
                    <div className="mt-6 grid gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl min-h-screen w-[90%] bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-white">Admin · Accounts</h1>
                        <p className="text-white/70 text-xl">{rowsAll.length.toLocaleString("vi-VN")} users loaded</p>
                    </div>


                    {/* Add */}


                    <div className="flex items-center gap-3">
                        {/* 👇 Nút Add Account: navigate kèm state để prefill */}
                        <Button
                            onClick={() =>
                                navigate("/admin/addAccount", {
                                    state: {
                                        name: "VanPhuongThuy",
                                        email: "thuyadmin1@gmail.com",
                                        password: "thuyadmin1",
                                        isEnable: true,
                                        roleNames: ["staff"],
                                    },
                                })
                            }
                            className="bg-indigo-500/90 hover:bg-indigo-500"
                        >
                            Add Account
                        </Button>
                        <Button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 text-white">
                            Refresh
                        </Button>
                    </div>


                    {/* End Add */}




                </div>

                {/* Error banner */}
                {err && (
                    <div className="mt-4 rounded-2xl bg-rose-500/15 p-4 text-2xl text-rose-200 ring-1 ring-rose-400/20">
                        {err}
                    </div>
                )}

                {/* Filters */}
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="q">Search</Label>
                        <Input
                            id="q"
                            placeholder="Name / Email / ID"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="role">Role</Label>
                        <Select id="role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="" className="bg-indigo-900">— All —</option>
                            {ROLES.map((r) => (
                                <option key={r} value={r} className="bg-indigo-900">
                                    {r}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label className="!mb-0">Sort by</Label>
                        <div className="flex gap-3 mt-2">
                            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-60">
                                <option value="createdAt" className="bg-indigo-900">Created At</option>
                                <option value="name" className="bg-indigo-900">Name</option>
                                <option value="email" className="bg-indigo-900">Email</option>
                            </Select>
                            <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="w-40">
                                <option value="asc" className="bg-indigo-900">Asc</option>
                                <option value="desc" className="bg-indigo-900">Desc</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                    <div className="bg-white/10 px-5 py-4 text-2xl font-semibold text-white flex items-center justify-between">
                        <span>Accounts</span>
                        <span className="text-white/70 text-xl">Showing {rows.length.toLocaleString("vi-VN")} items</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-white/90">
                            <thead className="bg-white/5 text-xl">
                                <tr>
                                    <th className="px-5 py-3">#</th>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Roles</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Created At</th>
                                    <th className="px-5 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {rows.length ? (
                                    rows.map((u, idx) => {
                                        const draft = getDraft(u);
                                        const hasChange =
                                            draft.isEnable !== u.isEnable ||
                                            (draft.role || "") !== (u.roles[0] || "");

                                        const canSave = hasChange && !isRowPending(u.userId);

                                        return (
                                            <tr
                                                key={u.userId}
                                                className={"hover:bg-white/5 " + (isRowPending(u.userId) ? "opacity-60 pointer-events-none" : "")}
                                            >
                                                <td className="px-5 py-4 text-xl">{idx + 1}</td>
                                                <td className="px-5 py-4 text-xl">
                                                    <div className="font-semibold text-white">{u.name || "—"}</div>
                                                    <div className="text-white/60 text-base">ID: {u.userId}</div>
                                                </td>
                                                <td className="px-5 py-4 text-xl">{u.email}</td>
                                                <td className="px-5 py-4 text-xl">



                                                    

                                                    {/* Dropdown single-role for simplicity */}
                                                    <select
                                                        value={(draft.role || "").trim().toLowerCase()}
                                                        onChange={(e) => setDraftField(u.userId, "role", e.target.value)}
                                                        className="h-10 rounded-xl border border-white/20 bg-indigo-900/60 px-3 text-xl text-white outline-none focus:border-indigo-300"
                                                        title="Chọn role (overwrite roles)"
                                                    >
                                                        <option value="" className="bg-indigo-900">— None —</option>
                                                        {ROLES.map((r) => (
                                                            <option key={r} value={r} className="bg-indigo-900">{r}</option>
                                                        ))}
                                                    </select>

                                                </td>
                                                <td className="px-5 py-4 text-xl">
                                                    <div className="flex items-center gap-3">
                                                        {/* <span className={`px-3 py-1 rounded-full ${enableTone(u.isEnable)}`}>
                                                            {u.isEnable ? "Enabled" : "Disabled"}
                                                        </span> */}
                                                        {/* Toggle */}
                                                        <button
                                                            onClick={() => setDraftField(u.userId, "isEnable", !draft.isEnable)}
                                                            className={
                                                                "relative inline-flex h-10 w-20 items-center rounded-full transition " +
                                                                (draft.isEnable ? "bg-emerald-500/70" : "bg-rose-500/70")
                                                            }
                                                            title="Toggle isEnable"
                                                        >
                                                            <span
                                                                className={
                                                                    "inline-block h-8 w-8 transform rounded-full bg-white transition " +
                                                                    (draft.isEnable ? "translate-x-10" : "translate-x-2")
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-xl">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : ""}
                                                </td>
                                                <td className="px-5 py-4 text-xl">
                                                    <Button
                                                        onClick={() => handleSaveRow(u)}
                                                        disabled={!canSave}
                                                        className="bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Lưu thay đổi"
                                                    >
                                                        {isRowPending(u.userId) ? (
                                                            <span className="inline-flex items-center gap-2">
                                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                                Saving…
                                                            </span>
                                                        ) : (
                                                            "Save"
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-8 text-center text-xl text-white/70">
                                            No suitable account
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 text-xl text-white/60">
                    <p>
                        Chỉnh <b>role</b> bằng dropdown (overwrite toàn bộ), bật/tắt <b>isEnable</b> bằng toggle, bấm{" "}
                        <b>Save</b> ở mỗi dòng để cập nhật nhanh.
                    </p>
                </div>
            </div>
        </div>
    );
}
