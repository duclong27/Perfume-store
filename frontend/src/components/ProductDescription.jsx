import { useEffect, useState } from "react";

/**
 * ProductDescriptionReviewsLite (EN)
 * - Fetches exactly as you requested (api.get(`/api/v1/getProductById/${productId}`))
 * - Only fetches and shows the product description
 * - Reviews, Policy… are static (no API calls)
 * - Non‑breaking drop‑in: just import and render this component
 */
export default function ProductDescriptionReviewsLite({ productId, api, assets }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [description, setDescription] = useState("");

    // ---- Fetch identical to your sample (keep cancelled flag) ----
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr("");
                const { data } = await api.get(`/api/v1/getProductById/${productId}`);
                const raw = data?.item ?? data?.data ?? data;
                const normalized = normalizeProductForDesc(raw || {});
                if (cancelled) return;
                setDescription(normalized.description ?? "");
            } catch (e) {
                if (!cancelled) setErr(e?.response?.data?.message || e.message || "Fetch failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [productId, api]);

    const [activeTab, setActiveTab] = useState("desc"); // "desc" | "reviews"

    return (
        <section className="mt-80">
            {/* Header Tabs */}
            <div className="flex items-center gap-3 border-b border-gray-200">
                <TabButton active={activeTab === "desc"} onClick={() => setActiveTab("desc")}>Description</TabButton>
                <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")}>Reviews</TabButton>
                <div className="flex-1" />
            </div>

            {/* Panels */}
            {activeTab === "desc" ? (
                <div className="relative group mt-6">
                    {/* Layered aurora border + glow */}
                    <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-fuchsia-400 via-amber-300 to-sky-400 opacity-30 blur-xl transition duration-700 group-hover:opacity-70" />
                    <div className="absolute -inset-[2px] rounded-[28px] bg-[conic-gradient(at_10%_10%,_#a78bfa,_#f59e0b,_#38bdf8,_#a78bfa)] animate-[spin_12s_linear_infinite] opacity-20 [mask-image:linear-gradient(white,transparent)]" />

                    {/* Card frame */}
                    <div className="relative rounded-[26px] p-[2px] bg-gradient-to-tr from-white/60 via-white/20 to-white/60 shadow-[0_12px_60px_-20px_rgba(2,8,23,0.25)]">
                        <div className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/60 p-7 md:p-10">
                            {/* Corner ornaments */}
                            <div className="pointer-events-none absolute -top-1 -left-1 w-10 h-10 rounded-br-3xl bg-gradient-to-br from-fuchsia-200/60 to-transparent" />
                            <div className="pointer-events-none absolute -bottom-1 -right-1 w-10 h-10 rounded-tl-3xl bg-gradient-to-tl from-sky-200/60 to-transparent" />

                            {/* Title row */}
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-sky-500 text-white shadow-lg shadow-fuchsia-200/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" /></svg>
                                </span>
                                <div>
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600">Product Description</h2>
                                    <p className="text-sm text-neutral-500">Details & highlights</p>
                                </div>
                            </div>

                            {/* Accent divider */}
                            <div className="mt-4 h-[2px] w-40 bg-gradient-to-r from-fuchsia-400 via-amber-400 to-sky-400 rounded-full" />

                            {loading && <p className="mt-6 text-2xl text-neutral-500">Loading description…</p>}
                            {!!err && <p className="mt-6 text-2xl text-red-600">{err}</p>}

                            {!loading && !err && (
                                <div className="mt-6 text-2xl  leading-8 text-neutral-800">
                                    <p className="whitespace-pre-line  selection:bg-amber-100/80 selection:text-neutral-900">
                                        {description || "No description available for this product."}
                                    </p>
                                </div>
                            )}

                            {/* Elegant highlight chips when long */}
                            {description && description.length > 220 && (
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-2xl">
                                    {splitToHighlights(description).map((line, idx) => (
                                        <div
                                            key={idx}
                                            className="group/chip relative text-2xl rounded-2xl p-[1.5px] bg-gradient-to-br from-fuchsia-300 via-amber-300 to-sky-300 transition-transform hover:translate-y-[-1px]"
                                        >
                                            <div className="rounded-2xl  bg-white/95 backdrop-blur-md p-4 flex items-start gap-3">
                                                <span className="flex-none mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-500 text-white text-2xl font-bold shadow">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-neutral-800 text-2xl ">{line}</p>
                                            </div>
                                            <span className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover/chip:opacity-60 transition-opacity bg-[radial-gradient(60%_60%_at_30%_20%,rgba(244,114,182,0.25),transparent_60%)]  " />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Soft footer badges */}
                            <div className="mt-8 flex flex-wrap gap-2">
                                {["Official warranty", "7-day returns", "24/7 support"].map((t) => (
                                    <span key={t} className="px-3 py-1 rounded-full text-2xl bg-gradient-to-tr from-neutral-100 to-white border border-neutral-200 text-neutral-600 text-2xl shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative group mt-6">
                    {/* Aurora glow for Reviews */}
                    <div className="absolute -inset-1 rounded-[28px] bg-[conic-gradient(at_10%_10%,_#22d3ee,_#a78bfa,_#f472b6,_#22d3ee)] opacity-25 blur-xl transition duration-700 group-hover:opacity-60" />

                    <div className="relative rounded-[26px] p-[2px] bg-gradient-to-tr from-white/60 via-white/20 to-white/60 shadow-[0_12px_60px_-20px_rgba(2,8,23,0.25)]">
                        <div className="rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/60 p-7 md:p-10">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <StarRow value={5} assets={assets} />
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-neutral-900">4.9 / 5</h3>
                                    </div>
                                    <span className="text-neutral-500 text-2xl">· 3 reviews</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> Verified purchase highlights
                                </div>
                            </div>

                            {/* Distribution (static) */}
                            <div className="mt-6 grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((n, i) => (
                                        <div key={n} className="flex items-center gap-3">
                                            <span className="w-8 text-sm text-neutral-600">{n}★</span>
                                            <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                                                <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pink-400" style={{ width: `${[84, 12, 3, 1, 0][i]}%` }} />
                                            </div>
                                            <span className="w-10 text-right text-sm text-neutral-500">{[84, 12, 3, 1, 0][i]}%</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Callout */}
                                <div className="rounded-2xl p-5 bg-gradient-to-tr from-sky-50 via-fuchsia-50 to-pink-50 border border-neutral-100">
                                    <h4 className="font-semibold text-neutral-900 text-2xl">Why customers love this</h4>
                                    <ul className="mt-3 space-y-2 text-neutral-700 text-sm">
                                        <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-sky-400" /> Long-lasting scent and premium packaging.</li>
                                        <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400" /> Fast nationwide shipping with careful protection.</li>
                                        <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-pink-400" /> Great value for money and authentic product.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Reviews list (static) */}
                            <div className="mt-8 space-y-5">
                                {[{
                                    user: "Lan Nguyen",
                                    rating: 5,
                                    date: "2024-06-01",
                                    comment: "Lovely, soft fragrance that lasts all day. Packaging was beautiful and eco-friendly.",
                                }, {
                                    user: "Minh Nam",
                                    rating: 5,
                                    date: "2024-05-20",
                                    comment: "Arrived super fast. Matches the description perfectly. Will buy again.",
                                }, {
                                    user: "Ha Tran",
                                    rating: 5,
                                    date: "2024-05-11",
                                    comment: "Great value and authentic product. Highly recommend!",
                                }].map((r, i) => (
                                    <div key={i} className=" text-2xl relative overflow-hidden rounded-2xl border border-neutral-100 bg-white/95 p-5 hover:shadow-md transition">
                                        <div className="absolute -z-10 -inset-[1px] rounded-2xl bg-[radial-gradient(70%_70%_at_20%_10%,rgba(168,85,247,0.12),transparent_60%)]" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-400 to-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">
                                                    {r.user.split(" ").map(s => s[0]).join("")}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-neutral-900">{r.user}</div>
                                                    <div className="text-xs text-neutral-500">{formatDate(r.date)}</div>
                                                </div>
                                            </div>
                                            <div className="ml-4"><StarRow value={r.rating} assets={assets} /></div>
                                        </div>
                                        <p className="mt-3 text-neutral-800 leading-7">{r.comment}</p>

                                        <div className="mt-3 flex items-center gap-3 text-sm text-neutral-600">
                                            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 hover:bg-neutral-50">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.22 2.5C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                                Helpful
                                            </button>
                                            <span>·</span>
                                            <button type="button" className="underline decoration-dotted hover:text-neutral-900">Report</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer action (static) */}
                            <div className="mt-8 flex items-center justify-between">
                                <div className="text-sm text-neutral-500">Showing 3 of 3 reviews</div>
                                <button type="button" className="px-4 py-2 rounded-xl bg-gradient-to-tr from-sky-400 to-fuchsia-500 text-white font-semibold shadow hover:opacity-95 active:opacity-90">Write a review</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Static: Policy / short FAQ (validated) */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-2xl">
                {[
                    {
                        title: "7-day returns",
                        text: "Support returns within 7 days for manufacturer defects.",
                    },
                    {
                        title: "Nationwide fast shipping",
                        text: "Trusted carriers with real-time tracking updates.",
                    },
                    {
                        title: "24/7 support",
                        text: "Our support team is ready anytime.",
                    },
                ].map((b, i) => (
                    <div key={i} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/60">
                        <h4 className="font-semibold">{b.title}</h4>
                        <p className="text-gray-600 mt-2">{b.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* -------------------- Static helpers -------------------- */
function normalizeProductForDesc(p = {}) {
    return {
        description: p.description ?? null,
    };
}

function splitToHighlights(text) {
    const candidates = text
        .replace(/\n+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    const take = Math.min(6, Math.max(4, Math.ceil(candidates.length / 3)));
    return candidates.slice(0, take);
}

function formatDate(d) {
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return String(d ?? "");
    }
}

function StarRow({ value = 0, assets }) {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                assets?.star_icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={assets.star_icon} alt="star" className="w-[22px] h-[22px]" />
                ) : (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-[22px] h-[22px] ${i < v ? "fill-yellow-400" : "fill-gray-300"}`}>
                        <path d="M12 .587l3.668 7.431 8.207 1.193-5.938 5.79 1.403 8.17L12 18.897l-7.34 3.874 1.403-8.17L.125 9.211l8.207-1.193L12 .587z" />
                    </svg>
                )
            ))}
        </div>
    );
}

function TabButton({ active, children, ...rest }) {
    return (
        <button
            {...rest}
            className={`px-5 py-3 text-lg font-semibold transition-all rounded-t-xl
      ${active ? "text-black bg-white border border-b-white border-gray-200 shadow-sm" : "text-gray-500 hover:text-black"}`}
            aria-selected={active}
            role="tab"
        >
            {children}
        </button>
    );
}
