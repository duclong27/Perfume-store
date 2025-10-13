

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../App";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Dashboard() {
  // ---------------- Hooks ----------------
  const [range, setRange] = useState("last_30d");
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [mix, setMix] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [top, setTop] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---------------- Helpers --------------
  const fmtVND = (v) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(v || 0));
  const fmtPctText = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;

  // ---------------- Data fetching --------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const p1 = api.get("/api/dashboard/summary", { params: { range: "last_7d" } });
        const p2 = api.get("/api/dashboard/sales-trend", { params: { range, groupBy: "day" } });
        const p3 = api.get("/api/dashboard/payment-mix", { params: { range } });
        const p4 = api.get("/api/dashboard/order-funnel", { params: { range } });
        const p5 = api.get("/api/dashboard/top-products", {
          params: { range, group: "variant", by: "quantity", limit: 10 },
        });

        const [r1, r2, r3, r4, r5] = await Promise.all([p1, p2, p3, p4, p5]);
        if (cancelled) return;

        setSummary(r1.data || null);
        setTrend(r2.data || null);
        setMix(r3.data || null);
        setFunnel(r4.data || null);
        setTop(r5.data || null);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message || "Fetch dashboard failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [range]);

  // ---------------- Derived data ---------
  const trendData = useMemo(() => {
    const pts = trend?.points || [];
    return pts.map((p) => ({
      date: p.date,
      revenue: Number(p.revenue || 0),
      orders: Number(p.orders || 0),
    }));
  }, [trend]);

  const mixData = useMemo(() => {
    if (!mix) return [];
    return [
      { name: "COD", key: "cod", value: Number(mix.cod || 0) },
      { name: "Bank Transfer", key: "bank_transfer", value: Number(mix.bank_transfer || 0) },
      { name: "VNPay", key: "vnpay", value: Number(mix.vnpay || 0) },
    ];
  }, [mix]);

  const funnelData = useMemo(() => {
    if (!funnel) return [];
    return [
      { name: "Pending", value: Number(funnel.pending || 0) },
      { name: "Confirmed", value: Number(funnel.confirmed || 0) },
      { name: "Shipped", value: Number(funnel.shipped || 0) },
      { name: "Completed", value: Number(funnel.completed || 0) },
      { name: "Cancelled", value: Number(funnel.cancelled || 0) },
    ];
  }, [funnel]);

  const topRows = top?.rows || [];

  // ---------------- UI -------------------
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-white/10 border border-white/20 text-slate-200 text-sm rounded-xl px-3 py-2 outline-none"
            >
              <option value="last_7d">Last 7 days</option>
              <option value="last_30d">Last 30 days</option>
              <option value="mtd">MTD</option>
              <option value="ytd">YTD</option>
              <option value="today">Today</option>
            </select>
          </div>
        </header>

        {/* Loading / Error */}
        {loading && <div className="text-slate-300">Đang tải Dashboard…</div>}
        {!loading && err && <div className="text-red-400">Lỗi: {err}</div>}

        {/* Content */}
        {!loading && !err && summary && (
          <>
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <Card title="Revenue (7d)" value={fmtVND(summary.revenue)} />
              <Card title="Orders (7d)" value={summary.orders} />
              <Card title="AOV" value={fmtVND(summary.aov)} />
              <Card title="Cancel Rate" value={fmtPctText(summary.cancelRate)} />
              <Card title="New Customers" value={summary.newCustomers} />
              <Card title="Returning Rate" value={fmtPctText(summary.returningRate)} />
            </section>

            {/* Charts Row */}
            <section className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
              {/* Sales Trend (LineChart) */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#111229] via-[#141a3a] to-[#1b2256] p-6 backdrop-blur-md shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-100 font-semibold">Sales Trend ({trend?.groupBy})</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <linearGradient id="ordGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#67e8f9" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                      <XAxis dataKey="date" tick={{ fill: "#e5e7eb", fontSize: 12 }} axisLine={{ stroke: "#ffffff22" }} tickLine={{ stroke: "#ffffff22" }} />
                      <YAxis tick={{ fill: "#e5e7eb", fontSize: 12 }} axisLine={{ stroke: "#ffffff22" }} tickLine={{ stroke: "#ffffff22" }} />
                      <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid #ffffff22", borderRadius: 12, color: "#e5e7eb" }} formatter={(val, name) => (name === "revenue" ? fmtVND(val) : val)} labelStyle={{ color: "#94a3b8" }} />
                      <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                      <Line type="monotone" dataKey="revenue" stroke="url(#revGrad)" dot={false} strokeWidth={3} />
                      <Line type="monotone" dataKey="orders" stroke="url(#ordGrad)" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Mix (PieChart) */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#111229] via-[#141a3a] to-[#1b2256] p-6 backdrop-blur-md shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-100 font-semibold">Payment Mix</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid #ffffff22", borderRadius: 12, color: "#e5e7eb" }} formatter={(val, name) => [fmtPctText(val), name]} />
                      <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                      <Pie data={mixData} dataKey="value" nameKey="name" outerRadius={95} label={(e) => `${e.name} ${fmtPctText(e.value)}`}>
                        {mixData.map((_, i) => (
                          <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i % 3]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Funnel (BarChart) */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#111229] via-[#141a3a] to-[#1b2256] p-6 backdrop-blur-md shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-100 font-semibold">Order Funnel</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                      <XAxis dataKey="name" tick={{ fill: "#e5e7eb", fontSize: 12 }} axisLine={{ stroke: "#ffffff22" }} tickLine={{ stroke: "#ffffff22" }} />
                      <YAxis tick={{ fill: "#e5e7eb", fontSize: 12 }} axisLine={{ stroke: "#ffffff22" }} tickLine={{ stroke: "#ffffff22" }} />
                      <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid #ffffff22", borderRadius: 12, color: "#e5e7eb" }} />
                      <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                      <Bar dataKey="value" barSize={22} fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Top Variants Table */}
            <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#111229] via-[#141a3a] to-[#1b2256] p-6 backdrop-blur-md shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-100 font-semibold">Top Variants (by quantity)</h3>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-slate-200 border-b border-white/10">
                      <th className="text-left py-2 px-3">Variant</th>
                      <th className="text-left py-2 px-3">SKU</th>
                      <th className="text-right py-2 px-3">Sold</th>
                      <th className="text-right py-2 px-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topRows || []).map((r, idx) => (
                      <tr key={`${r.variantId ?? r.productId}_${r.sku || ''}`} className={`${idx % 2 ? 'bg-white/[0.04]' : ''} hover:bg-white/[0.07] transition-colors`}>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/30 border border-white/10 grid place-items-center text-xs text-slate-200">
                              {(r.name || r.sku || 'V').slice(0, 1)}
                            </div>
                            <div className="text-slate-100">
                              <div className="font-medium">{r.name || '-'}</div>
                              <div className="text-xs text-slate-400">{r.brand || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-200">{r.sku || '-'}</td>
                        <td className="py-2 px-3 text-right text-slate-100">{r.soldQty}</td>
                        <td className="py-2 px-3 text-right text-slate-100">{fmtVND(r.revenue)}</td>
                      </tr>
                    ))}
                    {topRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">Không có dữ liệu.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// Simple KPI card
function Card({ title, value }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 p-5 backdrop-blur-md">
      <p className="text-sm text-slate-300">{title}</p>
      <h2 className="text-2xl font-bold text-white">{value}</h2>
    </div>
  );
}
//22.4