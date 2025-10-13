import { useState } from "react";
import { motion } from "framer-motion";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [status, setStatus] = useState({ type: "idle", msg: "" });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function validate() {
        if (!form.name.trim()) return "Please enter your name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email.";
        if (form.message.trim().length < 10) return "Message should be at least 10 characters.";
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const err = validate();
        if (err) return setStatus({ type: "error", msg: err });
        try {
            setStatus({ type: "loading", msg: "Sending…" });
            // TODO: Replace with your API call
            await new Promise((r) => setTimeout(r, 900));
            setStatus({ type: "success", msg: "Thanks! We received your message and will get back soon." });
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (e) {
            setStatus({ type: "error", msg: e?.message || "Something went wrong." });
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(60%_60%_at_20%_10%,#c7d2fe_0%,transparent_60%),radial-gradient(60%_60%_at_80%_0%,#fbcfe8_0%,transparent_60%),linear-gradient(180deg,#ffffff, #f8fafc)]">
            {/* Glow orbs */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />

            {/* Page container with default text-2xl */}
            <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 text-2xl">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-base shadow-sm backdrop-blur">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> We're here to help
                    </span>
                    <h1 className="mt-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600 bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-6xl">
                        Contact Us
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-neutral-600 text-xl md:text-2xl">
                        Questions about products, orders, or partnerships? Send us a message—our team replies fast.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Card: Contact Info */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-1">
                        <div className="relative rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_12px_60px_-24px_rgba(2,8,23,0.25)] backdrop-blur-xl">
                            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />
                            <h2 className="text-3xl font-extrabold">Get in touch</h2>
                            <p className="mt-2 text-neutral-600 text-xl">Reach us via any channel below.</p>
                            <div className="mt-6 space-y-4 text-xl">
                                <Item icon={PhoneIcon} label="Phone" value="(+84) 0987 654 321" />
                                <Item icon={MailIcon} label="Email" value="hello@yourbrand.com" />
                                <Item icon={MapPinIcon} label="Address" value="123 Blossom St, District 1, HCMC" />
                                <Item icon={ClockIcon} label="Hours" value="Mon–Sat: 9:00–20:00 (UTC+7)" />
                            </div>
                            <div className="mt-6 flex items-center gap-3 text-xl">
                                <Social icon={TwitterIcon} label="Twitter" />
                                <Social icon={InstagramIcon} label="Instagram" />
                                <Social icon={FacebookIcon} label="Facebook" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Card: Form */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
                        className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="relative rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0_12px_60px_-24px_rgba(2,8,23,0.25)] backdrop-blur-xl">
                            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Your name" htmlFor="name">
                                    <input id="name" name="name" value={form.name} onChange={handleChange} required
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none ring-0 focus:border-neutral-400" placeholder="Jane Doe" />
                                </Field>
                                <Field label="Email" htmlFor="email">
                                    <input id="email" name="email" value={form.email} onChange={handleChange} type="email" required
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none ring-0 focus:border-neutral-400" placeholder="jane@example.com" />
                                </Field>
                                <Field label="Phone (optional)" htmlFor="phone">
                                    <input id="phone" name="phone" value={form.phone} onChange={handleChange}
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none ring-0 focus:border-neutral-400" placeholder="(+84) 090 000 0000" />
                                </Field>
                                <Field label="Subject" htmlFor="subject">
                                    <input id="subject" name="subject" value={form.subject} onChange={handleChange}
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none ring-0 focus:border-neutral-400" placeholder="Order #1234, product inquiry…" />
                                </Field>
                                <Field label="Message" htmlFor="message" className="md:col-span-2">
                                    <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={6} required
                                        className="w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none ring-0 focus:border-neutral-400" placeholder="Tell us how we can help…" />
                                </Field>
                            </div>

                            {/* Status */}
                            {status.type !== "idle" && (
                                <div className={`mt-3 text-xl ${status.type === "error" ? "text-red-600" : status.type === "success" ? "text-emerald-600" : "text-neutral-500"}`}>
                                    {status.msg}
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-neutral-500 text-xl">We typically respond within a few hours.</p>
                                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-sky-500 to-fuchsia-500 px-6 py-3 text-white shadow transition hover:opacity-95 active:opacity-90">
                                    <SendIcon /> Send message
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Map / Storefront */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-10">
                    <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-2 shadow-[0_12px_60px_-24px_rgba(2,8,23,0.25)] backdrop-blur-xl">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded-2xl bg-neutral-100/70 p-2">
                                {/* Replace src with your Google Maps iframe or image */}
                                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-tr from-neutral-200 to-neutral-100">
                                    <div className="flex h-full items-center justify-center text-center text-neutral-500">
                                        Map preview placeholder
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/90 p-6">
                                <h3 className="text-3xl font-extrabold">Visit our store</h3>
                                <p className="mt-2 text-neutral-600 text-xl">Come try scents in person and get styling tips from our specialists.</p>
                                <ul className="mt-4 space-y-2 text-xl text-neutral-800">
                                    <li>• Free fragrance consultation</li>
                                    <li>• Gift wrapping available</li>
                                    <li>• Wheelchair accessible</li>
                                </ul>
                                <a href="#directions" className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-xl text-neutral-900 hover:bg-neutral-50">
                                    <ArrowRightIcon /> Get directions
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
                    className="mx-auto mt-14 max-w-4xl">
                    <h3 className="text-center text-4xl font-black">Frequently Asked Questions</h3>
                    <div className="mt-6 divide-y divide-neutral-200 rounded-3xl border border-neutral-200 bg-white/70">
                        {faq.map((f, i) => (
                            <details key={i} className="group p-6" open={i === 0}>
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                                    <span className="font-semibold text-neutral-900">{f.q}</span>
                                    <span className="rounded-full border border-neutral-300 px-3 py-1 text-base text-neutral-600 group-open:rotate-180">▾</span>
                                </summary>
                                <p className="mt-3 text-neutral-700 text-xl">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function Field({ label, htmlFor, children, className = "" }) {
    return (
        <label htmlFor={htmlFor} className={`block ${className}`}>
            <span className="mb-2 block text-base font-semibold text-neutral-800">{label}</span>
            {children}
        </label>
    );
}

function Item({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-fuchsia-500 text-white">
                <Icon />
            </span>
            <div>
                <div className="text-base font-semibold text-neutral-900">{label}</div>
                <div className="text-xl text-neutral-700">{value}</div>
            </div>
        </div>
    );
}

function Social({ icon: Icon, label }) {
    return (
        <a href="#" aria-label={label} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-base text-neutral-700 hover:bg-neutral-50">
            <Icon /> {label}
        </a>
    );
}

/* ---------------- Icons (inline SVG, no deps) ---------------- */
function PhoneIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.5a1 1 0 01-1 1C10.4 22 2 13.6 2 3.5a1 1 0 011-1H6.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.2 2.2z" /></svg>); }
function MailIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.4 4.25l-6.1 4.07a1 1 0 01-1.1 0L5.3 8.25a1 1 0 111.1-1.66L12 10l5.6-3.41a1 1 0 011.1 1.66z" /></svg>); }
function MapPinIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>); }
function ClockIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2zm1 11h-4a1 1 0 010-2h3V7a1 1 0 012 0z" /></svg>); }
function SendIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" /></svg>); }
function ArrowRightIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M13 5l7 7-7 7M5 12h14" /></svg>); }
function TwitterIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M22 5.8a8.3 8.3 0 01-2.36.65 4.13 4.13 0 001.81-2.27 8.26 8.26 0 01-2.61 1 4.13 4.13 0 00-7.16 2.82c0 .32.04.63.1.93A11.7 11.7 0 013 4.67a4.13 4.13 0 001.28 5.51 4.08 4.08 0 01-1.87-.52v.05a4.13 4.13 0 003.31 4.05c-.46.12-.95.18-1.45.07a4.13 4.13 0 003.85 2.86A8.3 8.3 0 012 19.54a11.72 11.72 0 006.29 1.84c7.55 0 11.68-6.26 11.68-11.69 0-.18-.01-.36-.02-.54A8.35 8.35 0 0022 5.8z" /></svg>); }
function InstagramIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5A5.5 5.5 0 1112 18.5 5.5 5.5 0 0112 7.5zm6.25-.75a1.25 1.25 0 11-1.25 1.25 1.25 1.25 0 011.25-1.25z" /></svg>); }
function FacebookIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M13.5 9H15V6.5h-1.5a3 3 0 00-3 3V12H8v2.5h2.5V22H13V14.5H15L15.5 12H13v-1.5a1.5 1.5 0 011.5-1.5z" /></svg>); }

const faq = [
    { q: "How fast do you ship?", a: "Orders placed before 3PM (UTC+7) ship the same day. Local deliveries arrive in 1–2 days." },
    { q: "Can I return a perfume?", a: "Unopened items can be returned within 7 days. If damaged on arrival, contact us immediately." },
    { q: "Do you offer gift wrapping?", a: "Yes! Add a note at checkout or ask our staff in store." },
    { q: "Where are you located?", a: "123 Blossom St, District 1, Ho Chi Minh City. Parking available nearby." },
];