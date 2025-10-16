// src/pages/AdminAccounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../App";
import { toast } from "react-toastify";

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
const enableTone = (b) => (b ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700");

const normalize = (s = "") =>
  s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const normalizeUser = (u) => ({
  userId: u.userId,
  name: u.name || "",
  email: u.email || "",
  isEnable: typeof u.isEnable === "boolean" ? u.isEnable : true,
  createdAt: u.createdAt ?? null,
  roles: Array.isArray(u.roles) ? u.roles : [], // array of roleName
});

/* --------------------------------------------------------------------------
   Page: AdminAccounts
-------------------------------------------------------------------------- */
export default function AdminAccounts() {
  // data
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rowsAll, setRowsAll] = useState([]);

  // filter/sort
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | email
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  // per-row edits & pending
  const [edits, setEdits] = useState({}); // { [userId]: { isEnable?: boolean, role?: string } }
  const [pending, setPending] = useState({}); // { [userId]: true }

  const getDraft = (u) =>
    edits[u.userId] ?? {
      isEnable: u.isEnable,
      role: u.roles[0] || "", // UI dùng single role để đơn giản; BE vẫn nhận mảng
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
        const { data } = await api.get("/admin/users", {
          params: { page: 1, limit: 1000, sortBy: "createdAt", sortDir: "desc" },
        });
        const payload = data?.data ?? data ?? {};
        const rowsRaw = Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(payload)
            ? payload
            : [];
        const mapped = rowsRaw.map(normalizeUser);
        if (!cancelled) setRowsAll(mapped);
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
      arr = arr.filter((u) => (u.roles || []).map((x) => String(x)).includes(roleFilter));
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

  // save
  async function handleSaveRow(u) {
    const draft = getDraft(u);
    const patch = {};
    if (typeof draft.isEnable === "boolean" && draft.isEnable !== u.isEnable) {
      patch.isEnable = draft.isEnable;
    }
    const currentRole = u.roles[0] || "";
    if ((draft.role || "") !== currentRole) {
      patch.roleNames = draft.role ? [draft.role] : []; // rỗng để clear role
    }
    if (!patch.hasOwnProperty("isEnable") && !patch.hasOwnProperty("roleNames")) return;

    // optimistic
    const oldRow = { ...u };
    setPending((p) => ({ ...p, [u.userId]: true }));
    setRowsAll((prev) =>
      prev.map((x) =>
        x.userId === u.userId
          ? {
            ...x,
            isEnable: patch.hasOwnProperty("isEnable") ? patch.isEnable : x.isEnable,
            roles:
              patch.hasOwnProperty("roleNames") ? [...(patch.roleNames || [])] : [...(x.roles || [])],
            __pending: true,
          }
          : x
      )
    );

    try {
      const { data } = await api.patch(`/admin/users/${u.userId}/access`, patch);
      const updated = (data && data.data) ? data.data : null;
      const normalized = updated
        ? normalizeUser(updated)
        : {
          ...oldRow,
          ...patch,
          roles: patch.roleNames ?? oldRow.roles,
        };

      setRowsAll((prev) =>
        prev.map((x) => (x.userId === u.userId ? { ...normalized, __pending: false } : x))
      );
      // sync draft
      setEdits((prev) => ({
        ...prev,
        [u.userId]: { isEnable: normalized.isEnable, role: normalized.roles[0] || "" },
      }));
      toast.success("Cập nhật account thành công 🎉");
    } catch (e) {
      // rollback
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
          <div className="flex items-center gap-3">
            <Button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 text-white">
              Refresh
            </Button>
          </div>
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
                  <th className="px-5 py-3">isEnable</th>
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
                          {/* Current roles badges */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(u.roles.length ? u.roles : ["—"]).map((r, i) => (
                              <span key={r + i} className={`px-3 py-1 rounded-full ${roleTone(r)}`}>{r}</span>
                            ))}
                          </div>
                          {/* Dropdown single-role for simplicity */}
                          <select
                            value={draft.role || ""}
                            onChange={(e) => setDraftField(u.userId, "role", e.target.value)}
                            className="h-10 rounded-xl border border-white/20 bg-indigo-900/60 px-3 text-xl text-white outline-none focus:border-indigo-300"
                            title="Chọn role (overwrite roles)"
                          >
                            <option value="" className="bg-indigo-900">— None —</option>
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="bg-indigo-900">
                                {r}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 text-base text-white/60">
                            Lưu ý: lưu sẽ <b>overwrite</b> roles theo chọn này.
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xl">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full ${enableTone(u.isEnable)}`}>
                              {u.isEnable ? "Enabled" : "Disabled"}
                            </span>
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
                      Không có account phù hợp
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
