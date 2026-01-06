// // src/pages/AdminAccounts.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { api } from "../App";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";


// const Label = ({ htmlFor, children, className = "" }) => (
//     <label htmlFor={htmlFor} className={"mb-2 block text-xl font-medium text-white " + className}>
//         {children}
//     </label>
// );
// const Input = ({ className = "", ...props }) => (
//     <input
//         className={
//             "h-14 w-full rounded-2xl border border-white/20 bg-white/10 px-5 text-2xl text-white placeholder-white/50 outline-none focus:border-indigo-300 " +
//             className
//         }
//         {...props}
//     />
// );
// const Select = ({ className = "", children, ...props }) => (
//     <select
//         className={
//             "h-14 w-full rounded-2xl border border-white/20 bg-indigo-900/60 px-5 text-2xl text-white outline-none focus:border-indigo-300 " +
//             className
//         }
//         {...props}
//     >
//         {children}
//     </select>
// );
// const Button = ({ children, className = "", ...props }) => (
//     <button
//         className={
//             "inline-flex items-center justify-center rounded-2xl px-6 py-4 text-2xl font-medium text-white transition focus:outline-none focus:ring-2 " +
//             className
//         }
//         {...props}
//     >
//         {children}
//     </button>
// );

// /* --------------------------------------------------------------------------
//    Constants & helpers
// -------------------------------------------------------------------------- */
// const ROLES = ["admin", "staff", "customer"];

// const roleTone = (r) => {
//     switch (r) {
//         case "admin":
//             return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
//         case "staff":
//             return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
//         case "customer":
//             return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
//         default:
//             return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
//     }
// };

// const prettyRole = (r) => {
//     const s = String(r || "").trim();
//     return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
// };

// const enableTone = (b) => (b ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700");

// const normalize = (s = "") =>
//     s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// // const roleFromAny = (x) => {
// //     if (typeof x === "string") return x.trim().toLowerCase();
// //     if (x && typeof x === "object") {
// //         const v = x.roleName ?? x.name ?? x.role ?? x.code ?? "";
// //         return String(v).trim().toLowerCase();
// //     }
// //     return "";
// // };



// function roleFromAny(x) {
//     if (!x) return "";
//     if (typeof x === "string") return x.trim().toLowerCase();

//     if (typeof x === "object") {

//         const candidates = [
//             x.roleName, x.rolename, x.name, x.role, x.code, x.key, x.slug, x.type,

//             x?.Role?.name, x?.role?.name, x?.Role?.code, x?.role?.code,
//         ].filter(Boolean);

//         for (const c of candidates) {
//             const v = String(c).trim().toLowerCase();
//             if (v) return v;
//         }
//     }
//     return "";
// }


// function firstRoleFromUser(u = {}) {
//     const sources = [
//         u.roles,        // ["admin"] hoặc [{roleName:"admin"}]
//         u.userRoles,    // join camelCase
//         u.user_roles,   // join snake_case
//         u.roleNames,    // ["admin", ...]
//         u.role,         // "admin"
//         u.role_name,    // "admin"
//         u.Role,         // { name: "admin" }
//     ].filter(Boolean);

//     const found = [];
//     for (const src of sources) {
//         if (Array.isArray(src)) {
//             for (const item of src) {
//                 const r = roleFromAny(item);
//                 if (r) { found.push(r); break; }
//             }
//         } else {
//             const r = roleFromAny(src);
//             if (r) { found.push(r); }
//         }
//         if (found.length) break; 
//     }

//     let role = found[0] || "";
//     if (role && Array.isArray(ROLES)) {
//         role = ROLES.includes(role) ? role : ""; 
//     }
//     return role;
// }

// export function normalizeUser(raw = {}) {
//     const rawRoles = Array.isArray(raw.roles) ? raw.roles : [];
//     const roles = rawRoles.map(roleFromAny).filter(Boolean);

//     return {
//         userId: raw.userId ?? raw.id,
//         name: raw.name ?? "",
//         email: raw.email ?? "",
//         isEnable: !!raw.isEnable,
//         createdAt: raw.createdAt ?? raw.created_at ?? null,
//         roles, 
//     };
// }

// /* --------------------------------------------------------------------------
//    Page: AdminAccounts
// -------------------------------------------------------------------------- */
// export default function AdminAccountPage() {
//     // data
//     const [loading, setLoading] = useState(true);
//     const [err, setErr] = useState("");
//     const [rowsAll, setRowsAll] = useState([]);
//     const navigate = useNavigate();

//     // filter/sort
//     const [q, setQ] = useState("");
//     const [roleFilter, setRoleFilter] = useState("");
//     const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | email
//     const [sortDir, setSortDir] = useState("desc"); // asc | desc

//     // per-row edits & pending
//     const [edits, setEdits] = useState({}); // { [userId]: { isEnable?: boolean, role?: string } }
//     const [pending, setPending] = useState({}); // { [userId]: true }

//     const getDraft = (u) => {
//         if (!u || typeof u !== "object") {
//             console.warn("[getDraft] invalid user:", u);
//             return { isEnable: false, role: "" };
//         }

//         const e = edits[u.userId];


//         let fromEdits = (typeof e?.role === "string" && e.role !== "") ? e.role.trim().toLowerCase() : "";


//         let fromUser =
//             (Array.isArray(u.roles) && u.roles.length ? String(u.roles[0]).trim().toLowerCase() : "") ||
//             firstRoleFromUser(u);


//         if (fromEdits && Array.isArray(ROLES) && !ROLES.includes(fromEdits)) fromEdits = "";
//         if (fromUser && Array.isArray(ROLES) && !ROLES.includes(fromUser)) fromUser = "";

//         const role = fromEdits || fromUser || "";
//         const isEnable = (typeof e?.isEnable === "boolean") ? e.isEnable : !!u.isEnable;


//         console.log("[getDraft] resolve", {
//             userId: u.userId,
//             raw: {
//                 roles: u.roles, userRoles: u.userRoles, user_roles: u.user_roles,
//                 roleNames: u.roleNames, role: u.role, role_name: u.role_name, Role: u.Role
//             },
//             fromEdits, fromUser, finalRole: role || "(empty)", isEnable,
//         });

//         return { isEnable, role };
//     };



//     const setDraftField = (userId, field, value) => {
//         setEdits((prev) => {
//             const cur = prev[userId] ?? {};
//             return { ...prev, [userId]: { ...cur, [field]: value } };
//         });
//     };

//     const isRowPending = (id) => !!pending[id];




//     // fetch
//     useEffect(() => {
//         let cancelled = false;
//         (async () => {
//             try {
//                 setLoading(true);
//                 setErr("");
//                 const { data } = await api.get("/api/account/getAllAccounts", {
//                     params: { page: 1, limit: 1000, sortBy: "createdAt", sortDir: "desc" },
//                 });
//                 const payload = data?.data ?? data ?? {};
//                 const rowsRaw = Array.isArray(payload?.rows)
//                     ? payload.rows
//                     : Array.isArray(payload)
//                         ? payload
//                         : [];

//                 const mapped = rowsRaw.map(normalizeUser);


//                 const mappedFixed = mapped.map(u => ({
//                     ...u,
//                     roles: (u.roles || []).map(r => {
//                         if (typeof r === "string") return r.trim().toLowerCase();
//                         const v = r?.roleName ?? r?.name ?? r?.role ?? "";
//                         return String(v).trim().toLowerCase();
//                     }),
//                 }));

//                 if (!cancelled) setRowsAll(mappedFixed);
//             } catch (e) {
//                 if (!cancelled)
//                     setErr(e?.response?.data?.message || e.message || "Không tải được danh sách account.");
//             } finally {
//                 if (!cancelled) setLoading(false);
//             }
//         })();
//         return () => {
//             cancelled = true;
//         };
//     }, []);



//     // filter
//     const filtered = useMemo(() => {
//         let arr = rowsAll;
//         const nq = normalize(q);
//         if (nq) {
//             arr = arr.filter((u) => {
//                 const name = normalize(u.name);
//                 const email = normalize(u.email);
//                 const uid = String(u.userId || "").toLowerCase();
//                 return name.includes(nq) || email.includes(nq) || uid.includes(nq);
//             });
//         }
//         if (roleFilter) {

//             const rf = roleFilter.trim().toLowerCase();
//             arr = arr.filter((u) => (u.roles || []).some(x => String(x).trim().toLowerCase() === rf));
//         }
//         return arr;
//     }, [rowsAll, q, roleFilter]);

//     // sort (giữ nguyên)
//     const rows = useMemo(() => {
//         const arr = [...filtered];
//         arr.sort((a, b) => {
//             let va = a[sortBy];
//             let vb = b[sortBy];
//             if (sortBy === "createdAt") {
//                 va = va ? new Date(va).getTime() : 0;
//                 vb = vb ? new Date(vb).getTime() : 0;
//             }
//             if (sortBy === "name" || sortBy === "email") {
//                 va = (va || "").toString().toLowerCase();
//                 vb = (vb || "").toString().toLowerCase();
//             }
//             if (va < vb) return sortDir === "asc" ? -1 : 1;
//             if (va > vb) return sortDir === "asc" ? 1 : -1;
//             return 0;
//         });
//         return arr;
//     }, [filtered, sortBy, sortDir]);



//     // getToken
//     function getToken() {
//         const s = sessionStorage.getItem("token");
//         if (s) return s.replace(/^"(.*)"$/, "$1");
//         const l = localStorage.getItem("token");
//         if (l) return l.replace(/^"(.*)"$/, "$1");
//         return null;
//     }



//     // save
//     async function handleSaveRow(u) {
//         const draft = getDraft(u);
//         const patch = {};
//         if (typeof draft.isEnable === "boolean" && draft.isEnable !== u.isEnable) {
//             patch.isEnable = draft.isEnable;
//         }
//         const currentRole = u.roles[0] || "";
//         if ((draft.role || "") !== currentRole) {
//             patch.roleNames = draft.role ? [draft.role] : [];
//         }
//         if (!patch.hasOwnProperty("isEnable") && !patch.hasOwnProperty("roleNames")) return;


//         const token = getToken();
//         if (!token) {
//             toast.error("NO_TOKEN · Vui lòng đăng nhập lại");
//             return;
//         }


//         const oldRow = { ...u };
//         setPending((p) => ({ ...p, [u.userId]: true }));
//         setRowsAll((prev) =>
//             prev.map((x) =>
//                 x.userId === u.userId
//                     ? {
//                         ...x,
//                         isEnable: patch.hasOwnProperty("isEnable") ? patch.isEnable : x.isEnable,
//                         roles: patch.hasOwnProperty("roleNames") ? [...(patch.roleNames || [])] : [...(x.roles || [])],
//                         __pending: true,
//                     }
//                     : x
//             )
//         );

//         try {

//             const { data } = await api.patch(
//                 `/api/account/updateAccount/${u.userId}`,
//                 patch,
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             const updated = data?.data;
//             const normalized = updated ? normalizeUser(updated) : { ...oldRow, ...patch, roles: patch.roleNames ?? oldRow.roles };

//             setRowsAll((prev) =>
//                 prev.map((x) => (x.userId === u.userId ? { ...normalized, __pending: false } : x))
//             );
//             setEdits((prev) => ({
//                 ...prev,
//                 [u.userId]: { isEnable: normalized.isEnable, role: normalized.roles[0] || "" },
//             }));
//             toast.success("Updated successfully 🎉");
//         } catch (e) {
//             setRowsAll((prev) =>
//                 prev.map((x) => (x.userId === u.userId ? { ...oldRow, __pending: false } : x))
//             );
//             const msg = e?.response?.data?.message || e.message || "Cập nhật thất bại";
//             toast.error(msg);
//         } finally {
//             setPending((p) => ({ ...p, [u.userId]: false }));
//         }
//     }



//     /* -------------------------------- UI -------------------------------- */
//     if (loading) {
//         return (
//             // <div className="rounded-3xl min-h-screen w-400 bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6">
//             //     <div className="rounded-3xl border w-400 border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur text-white ">

//             <div className="min-h-screen  overflow-x-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 w-350 ">

//                 <div className="mx-auto    px-3 sm:px-4 lg:px-6 py-[clamp(16px,3vw,28px)] w-350">
//                     <div className="text-3xl font-semibold"> Accounts</div>
//                     <div className="mt-6 grid gap-4">
//                         {Array.from({ length: 8 }).map((_, i) => (
//                             <div key={i} className="h-20 rounded-2xl bg-white/10 animate-pulse" />
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         // <div className="rounded-3xl min-h-screen w-350 bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-6 mt-6">
//         //     <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">

//          <div className="rounded-3xl min-h-screen  mt-6 mx-auto bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 p-[clamp(16px,3vw,28px)] w-280">

//             <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur ">
//                 {/* Header */}
//                 <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
//                     <div>
//                         <h1 className="text-3xl font-semibold text-white"> Accounts</h1>
//                         <p className="text-white/70 text-xl">{rowsAll.length.toLocaleString("vi-VN")} users loaded</p>
//                     </div>


//                     {/* Add */}


//                     <div className="flex items-center gap-3">

//                         <Button
//                             onClick={() =>
//                                 navigate("/admin/addAccount", {
//                                     state: {
//                                         name: "VanPhuongThuy",
//                                         email: "thuyadmin1@gmail.com",
//                                         password: "thuyadmin1",
//                                         isEnable: true,
//                                         roleNames: ["staff"],
//                                     },
//                                 })
//                             }
//                             className="bg-indigo-500/90 hover:bg-indigo-500"
//                         >
//                             Add Account
//                         </Button>
//                         <Button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 text-white">
//                             Refresh
//                         </Button>
//                     </div>


//                     {/* End Add */}




//                 </div>

//                 {/* Error banner */}
//                 {err && (
//                     <div className="mt-4 rounded-2xl bg-rose-500/15 p-4 text-2xl text-rose-200 ring-1 ring-rose-400/20">
//                         {err}
//                     </div>
//                 )}

//                 {/* Filters */}
//                 <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//                     <div>
//                         <Label htmlFor="q">Search</Label>
//                         <Input
//                             id="q"
//                             placeholder="Name / Email / ID"
//                             value={q}
//                             onChange={(e) => setQ(e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <Label htmlFor="role">Role</Label>
//                         <Select id="role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
//                             <option value="" className="bg-indigo-900">— All —</option>
//                             {ROLES.map((r) => (
//                                 <option key={r} value={r} className="bg-indigo-900">
//                                     {r}
//                                 </option>
//                             ))}
//                         </Select>
//                     </div>
//                     <div>
//                         <Label className="!mb-0">Sort by</Label>
//                         <div className="flex gap-3 mt-2">
//                             <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-60">
//                                 <option value="createdAt" className="bg-indigo-900">Created At</option>
//                                 <option value="name" className="bg-indigo-900">Name</option>
//                                 <option value="email" className="bg-indigo-900">Email</option>
//                             </Select>
//                             <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="w-40">
//                                 <option value="asc" className="bg-indigo-900">Asc</option>
//                                 <option value="desc" className="bg-indigo-900">Desc</option>
//                             </Select>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Table */}
//                 <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
//                     <div className="bg-white/10 px-5 py-4 text-2xl font-semibold text-white flex items-center justify-between">
//                         <span>Accounts</span>
//                         <span className="text-white/70 text-xl">Showing {rows.length.toLocaleString("vi-VN")} items</span>
//                     </div>
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full text-left text-white/90">
//                             <thead className="bg-white/5 text-xl">
//                                 <tr>
//                                     <th className="px-5 py-3">#</th>
//                                     <th className="px-5 py-3">User</th>
//                                     <th className="px-5 py-3">Email</th>
//                                     <th className="px-5 py-3">Roles</th>
//                                     <th className="px-5 py-3">Status</th>
//                                     <th className="px-5 py-3">Created At</th>
//                                     <th className="px-5 py-3">Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-white/10">
//                                 {rows.length ? (
//                                     rows.map((u, idx) => {
//                                         const draft = getDraft(u);
//                                         const hasChange =
//                                             draft.isEnable !== u.isEnable ||
//                                             (draft.role || "") !== (u.roles[0] || "");

//                                         const canSave = hasChange && !isRowPending(u.userId);

//                                         return (
//                                             <tr
//                                                 key={u.userId}
//                                                 className={"hover:bg-white/5 " + (isRowPending(u.userId) ? "opacity-60 pointer-events-none" : "")}
//                                             >
//                                                 <td className="px-5 py-4 text-xl">{idx + 1}</td>
//                                                 <td className="px-5 py-4 text-xl">
//                                                     <div className="font-semibold text-white">{u.name || "—"}</div>
//                                                     <div className="text-white/60 text-base">ID: {u.userId}</div>
//                                                 </td>
//                                                 <td className="px-5 py-4 text-xl">{u.email}</td>
//                                                 <td className="px-5 py-4 text-xl">





//                                                     {/* Dropdown single-role for simplicity */}
//                                                     <select
//                                                         value={(draft.role || "").trim().toLowerCase()}
//                                                         onChange={(e) => setDraftField(u.userId, "role", e.target.value)}
//                                                         className="h-10 rounded-xl border border-white/20 bg-indigo-900/60 px-3 text-xl text-white outline-none focus:border-indigo-300"
//                                                         title="Chọn role (overwrite roles)"
//                                                     >
//                                                         <option value="" className="bg-indigo-900">— None —</option>
//                                                         {ROLES.map((r) => (
//                                                             <option key={r} value={r} className="bg-indigo-900">{r}</option>
//                                                         ))}
//                                                     </select>

//                                                 </td>
//                                                 <td className="px-5 py-4 text-xl">
//                                                     <div className="flex items-center gap-3">
//                                                         {/* <span className={`px-3 py-1 rounded-full ${enableTone(u.isEnable)}`}>
//                                                             {u.isEnable ? "Enabled" : "Disabled"}
//                                                         </span> */}
//                                                         {/* Toggle */}
//                                                         <button
//                                                             onClick={() => setDraftField(u.userId, "isEnable", !draft.isEnable)}
//                                                             className={
//                                                                 "relative inline-flex h-10 w-20 items-center rounded-full transition " +
//                                                                 (draft.isEnable ? "bg-emerald-500/70" : "bg-rose-500/70")
//                                                             }
//                                                             title="Toggle isEnable"
//                                                         >
//                                                             <span
//                                                                 className={
//                                                                     "inline-block h-8 w-8 transform rounded-full bg-white transition " +
//                                                                     (draft.isEnable ? "translate-x-10" : "translate-x-2")
//                                                                 }
//                                                             />
//                                                         </button>
//                                                     </div>
//                                                 </td>
//                                                 <td className="px-5 py-4 text-xl">
//                                                     {u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : ""}
//                                                 </td>
//                                                 <td className="px-5 py-4 text-xl">
//                                                     <Button
//                                                         onClick={() => handleSaveRow(u)}
//                                                         disabled={!canSave}
//                                                         className="bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                                                         title="Lưu thay đổi"
//                                                     >
//                                                         {isRowPending(u.userId) ? (
//                                                             <span className="inline-flex items-center gap-2">
//                                                                 <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
//                                                                 Saving…
//                                                             </span>
//                                                         ) : (
//                                                             "Save"
//                                                         )}
//                                                     </Button>
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })
//                                 ) : (
//                                     <tr>
//                                         <td colSpan={7} className="px-5 py-8 text-center text-xl text-white/70">
//                                             No suitable account
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>


//             </div>
//         </div>
//     );
// }



// src/pages/AdminAccounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, Loader2, Plus } from "lucide-react";

/* --------------------------------------------------------------------------
   Tone helpers (match Orders style)
-------------------------------------------------------------------------- */
const roleTone = (r) => {
    switch (String(r || "").toLowerCase()) {
        case "admin":
            return "bg-rose-500/20 text-rose-300 border-rose-500/30";
        case "staff":
            return "bg-sky-500/20 text-sky-300 border-sky-500/30";
        case "customer":
            return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
        default:
            return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
};

const enableTone = (b) =>
    b ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30";

const normalize = (s = "") =>
    s
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

/* --------------------------------------------------------------------------
   Constants & role parsing
-------------------------------------------------------------------------- */
const ROLES = ["admin", "staff", "customer"];

function roleFromAny(x) {
    if (!x) return "";
    if (typeof x === "string") return x.trim().toLowerCase();

    if (typeof x === "object") {
        const candidates = [
            x.roleName,
            x.rolename,
            x.name,
            x.role,
            x.code,
            x.key,
            x.slug,
            x.type,
            x?.Role?.name,
            x?.role?.name,
            x?.Role?.code,
            x?.role?.code,
        ].filter(Boolean);

        for (const c of candidates) {
            const v = String(c).trim().toLowerCase();
            if (v) return v;
        }
    }
    return "";
}

function firstRoleFromUser(u = {}) {
    const sources = [u.roles, u.userRoles, u.user_roles, u.roleNames, u.role, u.role_name, u.Role].filter(Boolean);

    for (const src of sources) {
        if (Array.isArray(src)) {
            for (const item of src) {
                const r = roleFromAny(item);
                if (r) return ROLES.includes(r) ? r : "";
            }
        } else {
            const r = roleFromAny(src);
            if (r) return ROLES.includes(r) ? r : "";
        }
    }
    return "";
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
        roles,
    };
}

/* --------------------------------------------------------------------------
   Page: AdminAccounts
-------------------------------------------------------------------------- */
export default function AdminAccountPage() {
    const navigate = useNavigate();

    // data
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [rowsAll, setRowsAll] = useState([]);

    // filters/sort
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDir, setSortDir] = useState("desc");

    // per-row edits & pending
    const [edits, setEdits] = useState({});
    const [pending, setPending] = useState({});

    const isRowPending = (id) => !!pending[id];

    const getDraft = (u) => {
        const e = edits[u.userId];

        let fromEdits = typeof e?.role === "string" && e.role !== "" ? e.role.trim().toLowerCase() : "";
        let fromUser = (Array.isArray(u.roles) && u.roles.length ? String(u.roles[0]).trim().toLowerCase() : "") || firstRoleFromUser(u);

        if (fromEdits && !ROLES.includes(fromEdits)) fromEdits = "";
        if (fromUser && !ROLES.includes(fromUser)) fromUser = "";

        const role = fromEdits || fromUser || "";
        const isEnable = typeof e?.isEnable === "boolean" ? e.isEnable : !!u.isEnable;

        return { isEnable, role };
    };

    const setDraftField = (userId, field, value) => {
        setEdits((prev) => {
            const cur = prev[userId] ?? {};
            return { ...prev, [userId]: { ...cur, [field]: value } };
        });
    };

    function getToken() {
        const s = sessionStorage.getItem("token");
        if (s) return s.replace(/^"(.*)"$/, "$1");
        const l = localStorage.getItem("token");
        if (l) return l.replace(/^"(.*)"$/, "$1");
        return null;
    }

    // fetch accounts
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
                const rowsRaw = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload) ? payload : [];

                const mapped = rowsRaw.map(normalizeUser);
                const mappedFixed = mapped.map((u) => ({
                    ...u,
                    roles: (u.roles || []).map((r) => String(r).trim().toLowerCase()),
                }));

                if (!cancelled) setRowsAll(mappedFixed);
            } catch (e) {
                if (!cancelled) setErr(e?.response?.data?.message || e.message || "Không tải được danh sách account.");
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
            const rf = roleFilter.trim().toLowerCase();
            arr = arr.filter((u) => (u.roles || []).some((x) => String(x).trim().toLowerCase() === rf));
        }

        return arr;
    }, [rowsAll, q, roleFilter]);

    // sort
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

    async function handleSaveRow(u) {
        const draft = getDraft(u);
        const patch = {};

        if (typeof draft.isEnable === "boolean" && draft.isEnable !== u.isEnable) {
            patch.isEnable = draft.isEnable;
        }

        const currentRole = (u.roles && u.roles[0]) || "";
        if ((draft.role || "") !== currentRole) {
            patch.roleNames = draft.role ? [draft.role] : [];
        }

        if (!patch.hasOwnProperty("isEnable") && !patch.hasOwnProperty("roleNames")) {
            toast.error("No changes to save.");
            return;
        }

        const token = getToken();
        if (!token) {
            toast.error("NO_TOKEN · Vui lòng đăng nhập lại");
            return;
        }

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
            const { data } = await api.patch(`/api/account/updateAccount/${u.userId}`, patch, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const updated = data?.data;
            const normalized = updated ? normalizeUser(updated) : { ...oldRow, ...patch, roles: patch.roleNames ?? oldRow.roles };

            setRowsAll((prev) => prev.map((x) => (x.userId === u.userId ? { ...normalized, __pending: false } : x)));
            setEdits((prev) => ({
                ...prev,
                [u.userId]: { isEnable: normalized.isEnable, role: normalized.roles[0] || "" },
            }));

            toast.success("Updated successfully 🎉");
        } catch (e) {
            setRowsAll((prev) => prev.map((x) => (x.userId === u.userId ? { ...oldRow, __pending: false } : x)));
            toast.error(e?.response?.data?.message || e.message || "Cập nhật thất bại");
        } finally {
            setPending((p) => ({ ...p, [u.userId]: false }));
        }
    }

    /* -------------------------------- UI -------------------------------- */
    if (loading) {
        return (
            <div className="rounded-3xl w-full min-h-screen border border-white/15 bg-white/5 backdrop-blur-lg p-[clamp(16px,2vw,32px)] text-white mt-6">
                <div className="flex items-center gap-2 text-[clamp(18px,2vw,24px)]">
                    <Loader2 className="h-[clamp(20px,2vw,24px)] w-[clamp(20px,2vw,24px)] animate-spin" />
                    Loading accounts...
                </div>

                <div className="mt-6 grid gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl w-full min-h-screen border border-white/15 bg-white/5 backdrop-blur-lg p-[clamp(16px,2vw,32px)] text-white mt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-[clamp(20px,2vw,28px)] gap-4">
                <div>
                    <h2 className="text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-tight">Accounts Management</h2>
                    <p className="text-white/70 text-[clamp(13px,1.6vw,16px)] mt-1">
                        {rowsAll.length.toLocaleString("vi-VN")} users loaded • {rows.length.toLocaleString("vi-VN")} showing
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-[clamp(12px,1.6vw,16px)] py-[clamp(8px,1.2vw,12px)] flex-1 md:flex-initial">
                        <Search className="w-[clamp(16px,1.8vw,20px)] h-[clamp(16px,1.8vw,20px)] text-white/70 flex-shrink-0" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search name / email / id..."
                            className="bg-transparent outline-none text-white placeholder-slate-400 w-full text-[clamp(13px,1.6vw,16px)]"
                        />
                    </div>

                    {/* Add */}
                    <button
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
                        className="flex items-center gap-2 px-[clamp(14px,2vw,24px)] py-[clamp(8px,1.2vw,12px)] rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition text-[clamp(13px,1.6vw,16px)] whitespace-nowrap"
                    >
                        <Plus className="h-[clamp(16px,1.8vw,20px)] w-[clamp(16px,1.8vw,20px)]" />
                        <span className="hidden sm:inline">Add</span>
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-[clamp(14px,2vw,24px)] py-[clamp(8px,1.2vw,12px)] rounded-xl bg-white/10 hover:bg-white/20 transition text-[clamp(13px,1.6vw,16px)] whitespace-nowrap"
                    >
                        <RefreshCw className="h-[clamp(16px,1.8vw,20px)] w-[clamp(16px,1.8vw,20px)]" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {err && (
                <div className="mb-[clamp(16px,2vw,24px)] rounded-2xl bg-rose-500/15 p-[clamp(12px,1.6vw,16px)] text-rose-200 ring-1 ring-rose-400/20 text-[clamp(13px,1.6vw,16px)]">
                    {err}
                </div>
            )}

            {/* Filters */}
            <div className="mb-[clamp(16px,2vw,24px)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(12px,1.6vw,16px)]">
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-xl border border-white/20 bg-white/10 px-[clamp(12px,1.6vw,16px)] py-[clamp(8px,1.2vw,12px)] text-white outline-none text-[clamp(13px,1.6vw,16px)]"
                >
                    <option value="">All Roles</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border border-white/20 bg-white/10 px-[clamp(12px,1.6vw,16px)] py-[clamp(8px,1.2vw,12px)] text-white outline-none text-[clamp(13px,1.6vw,16px)]"
                >
                    <option value="createdAt">Sort: Created</option>
                    <option value="name">Sort: Name</option>
                    <option value="email">Sort: Email</option>
                </select>

                <select
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value)}
                    className="rounded-xl border border-white/20 bg-white/10 px-[clamp(12px,1.6vw,16px)] py-[clamp(8px,1.2vw,12px)] text-white outline-none text-[clamp(13px,1.6vw,16px)]"
                >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden rounded-2xl border border-white/10">
                {/* Header */}
                <div
                    className="hidden lg:grid grid-cols-[72px_1.2fr_1.4fr_2.2fr_2.2fr_160px] gap-0
             bg-white/5 text-slate-300 text-[clamp(12px,1.6vw,16px)] font-semibold
             px-[clamp(12px,2vw,24px)] py-[clamp(12px,1.6vw,16px)]"
                >
                    <div>#</div>
                    <div>User</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div className="text-center">Action</div>
                </div>


                {/* Rows */}
                <div className="divide-y divide-white/10">
                    {rows.length === 0 ? (
                        <div className="px-[clamp(12px,2vw,24px)] py-[clamp(24px,3vw,32px)] text-center text-slate-400 text-[clamp(13px,1.6vw,16px)]">
                            No accounts found
                        </div>
                    ) : (
                        rows.map((u, idx) => {
                            const draft = getDraft(u);
                            const currentRole = (u.roles && u.roles[0]) || "";
                            const hasChanges = draft.isEnable !== u.isEnable || (draft.role || "") !== (currentRole || "");
                            const canSave = hasChanges && !isRowPending(u.userId);

                            return (
                                <div
                                    key={u.userId}
                                    className={`grid grid-cols-1 lg:grid-cols-8 gap-[clamp(8px,1.2vw,12px)] px-[clamp(12px,2vw,24px)] py-[clamp(12px,1.6vw,16px)] hover:bg-white/5 ${isRowPending(u.userId) ? "opacity-60 pointer-events-none" : ""
                                        }`}
                                >
                                    {/* # */}
                                    <div className="rounded-lg border border-white/15 bg-white/10 px-[clamp(10px,1.4vw,14px)] py-[clamp(8px,1.2vw,12px)] text-[clamp(13px,1.6vw,16px)]">
                                        {idx + 1}
                                    </div>

                                    {/* User */}
                                    <div className="lg:col-span-2 rounded-lg border border-white/15 bg-white/10 px-[clamp(10px,1.4vw,14px)] py-[clamp(8px,1.2vw,12px)]">
                                        <div className="font-semibold text-white truncate text-[clamp(13px,1.6vw,16px)]" title={u.name}>
                                            {u.name || "—"}
                                        </div>
                                        <div className="text-white/60 text-[clamp(11px,1.4vw,14px)] truncate">ID: {u.userId}</div>
                                    </div>

                                    {/* Email */}
                                    <div className="lg:col-span-2 rounded-lg border border-white/15 bg-white/10 px-[clamp(10px,1.4vw,14px)] py-[clamp(8px,1.2vw,12px)]">
                                        <div className="text-white truncate text-[clamp(13px,1.6vw,16px)]" title={u.email}>
                                            {u.email || "—"}
                                        </div>
                                        <div className="text-white/60 text-[clamp(11px,1.4vw,14px)] truncate">
                                            {u.createdAt ? `Created: ${new Date(u.createdAt).toLocaleString("vi-VN")}` : "—"}
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[clamp(8px,1.2vw,12px)]">
                                        <div
                                            className={`rounded-lg border px-[clamp(10px,1.4vw,14px)] py-[clamp(6px,1vw,8px)] text-center text-[clamp(11px,1.4vw,13px)] font-semibold truncate ${roleTone(
                                                currentRole
                                            )}`}
                                            title={`Current: ${currentRole || "—"}`}
                                        >
                                            {currentRole || "—"}
                                        </div>

                                        <select
                                            value={(draft.role || "").trim().toLowerCase()}
                                            onChange={(e) => setDraftField(u.userId, "role", e.target.value)}
                                            className="flex-1 h-[clamp(32px,4vw,40px)] rounded-lg border border-white/20 bg-indigo-900/60 px-[clamp(8px,1.2vw,12px)] text-[clamp(12px,1.6vw,15px)] text-white outline-none focus:border-indigo-300"
                                            title="Chọn role (overwrite roles)"
                                        >
                                            <option value="">— None —</option>
                                            {ROLES.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[clamp(8px,1.2vw,12px)]">
                                        <div
                                            className={`rounded-lg border px-[clamp(10px,1.4vw,14px)] py-[clamp(6px,1vw,8px)] text-center text-[clamp(11px,1.4vw,13px)] font-semibold truncate ${enableTone(
                                                draft.isEnable
                                            )}`}
                                        >
                                            {draft.isEnable ? "enabled" : "disabled"}
                                        </div>

                                        <button
                                            onClick={() => setDraftField(u.userId, "isEnable", !draft.isEnable)}
                                            className={"relative inline-flex h-[clamp(32px,4vw,40px)] w-24 items-center rounded-full transition " + (draft.isEnable ? "bg-emerald-500/70" : "bg-rose-500/70")}
                                            title="Toggle isEnable"
                                        >
                                            <span
                                                className={
                                                    "inline-block h-[clamp(22px,2.6vw,28px)] w-[clamp(22px,2.6vw,28px)] transform rounded-full bg-white transition " +
                                                    (draft.isEnable ? "translate-x-14" : "translate-x-2")
                                                }
                                            />
                                        </button>
                                    </div>

                                    {/* Action */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => handleSaveRow(u)}
                                            disabled={!canSave || isRowPending(u.userId)}
                                            className="w-full sm:w-auto px-[clamp(16px,2.4vw,32px)] py-[clamp(8px,1.2vw,12px)] rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[clamp(13px,1.6vw,16px)]"
                                        >
                                            {isRowPending(u.userId) ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="h-[clamp(14px,1.6vw,16px)] w-[clamp(14px,1.6vw,16px)] animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Saving
                                                </span>
                                            ) : (
                                                "Save"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
