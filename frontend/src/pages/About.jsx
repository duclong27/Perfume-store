import React from "react";
import { motion } from "framer-motion";
import {
    Leaf,
    Droplets,
    Diamond,
    Sparkles,
    Quote,
    Star,
    MapPin,
    Mail,
    Instagram,
    Facebook,
    Twitter,
    Award,
    Clock,
    Recycle,
    Heart,
    Factory,
    Feather
} from "lucide-react";
import {
    Card, CardHeader, CardContent, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { assets } from "../assets/assets";


// ————————————————————————————————————————————————
// Quick brand config – chỉnh ở đây là thay toàn trang
// ————————————————————————————————————————————————
const brand = {
  name: "Maison Lueur", // change this to your shop name
  tagline: "The essence of fragrance. Touching emotions.",
  founder: "Long Nguyen", // change founder name
  accent: "from-rose-200 via-pink-200 to-amber-100", // main gradient
  darkAccent: "from-rose-500 via-pink-500 to-amber-400", // darker gradient for hover
  noteTop: ["Bergamot", "Pear", "Blood Orange"],
  noteHeart: ["Jasmine Sambac", "Damask Rose", "White Tea"],
  noteBase: ["Sandalwood", "Musk", "Amber"]
};

const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, ease: "easeOut" },
};

const Section = ({ className = "", children }) => (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
);

const Pill = ({ children }) => (
    <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/70 px-4 py-1.5 text-sm backdrop-blur">
        {children}
    </span>
);

const ScentBadge = ({ text }) => (
    <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm font-medium tracking-wide">
        {text}
    </Badge>
);

// Scent Pyramid SVG
const ScentPyramid = () => (
    <svg viewBox="0 0 220 180" className="w-full max-w-xs">
        <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(253,242,248)" />
                <stop offset="100%" stopColor="rgb(255,251,235)" />
            </linearGradient>
        </defs>
        <polygon points="110,10 210,170 10,170" fill="url(#grad)" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
        {/* tầng */}
        <line x1="30" y1="80" x2="190" y2="80" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
        <line x1="50" y1="125" x2="170" y2="125" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
        {/* nút */}
        <circle cx="110" cy="40" r="4" fill="black" fillOpacity="0.15" />
        <circle cx="110" cy="100" r="4" fill="black" fillOpacity="0.15" />
        <circle cx="110" cy="150" r="4" fill="black" fillOpacity="0.15" />
    </svg>
);

export default function AboutPage() {
    return (
        <div className="relative min-h-screen scroll-smooth bg-gradient-to-b from-white via-rose-50/40 to-amber-50/40 text-zinc-800">
            {/* HERO */}
            <div className="text-2xl relative overflow-hidden">
                <div
                    className={`text-2xl absolute inset-0 -z-10 bg-gradient-to-br ${brand.accent} opacity-60 blur-3xl`}
                />
                <Section className="pt-20 pb-16 lg:pt-28 lg:pb-24 text-2xl">
                    <motion.div {...fadeUp} className="text-center text-2xl">
                        <Pill>
                            <Sparkles className="text-2xl h-4 w-4" />
                            <span className="text-4xl">About {brand.name}</span>
                        </Pill>
                        <h1 className="mt-6 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl">
                            Where fragrance tells your story
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-2xl leading-relaxed text-zinc-600">
                            {brand.tagline} – We believe perfume is not just an accessory, but an
                            emotional signature that accompanies you every day.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <Button
                                className={`rounded-full bg-gradient-to-r ${brand.darkAccent} text-white text-2xl shadow-lg hover:shadow-xl`}
                            >
                                Explore Collection
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-full text-2xl border-zinc-300 bg-white/60 backdrop-blur hover:bg-white"
                            >
                                Get Consultation
                            </Button>
                        </div>
                    </motion.div>

                    {/* USP */}
                    <motion.div
                        {...fadeUp}
                        className="text-2xl mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {[
                            {
                                icon: <Feather className="text-2xl h-5 w-5" />,
                                title: "Exquisite Craftsmanship",
                                desc: "Small-batch blending with atelier standards – each bottle is a meticulous masterpiece.",
                            },
                            {
                                icon: <Leaf className="text-2xl h-5 w-5" />,
                                title: "Pure Ingredients",
                                desc: "Ethically sourced, fully traceable, and never tested on animals.",
                            },
                            {
                                icon: <Droplets className="h-5 w-5" />,
                                title: "Impressive Longevity",
                                desc: "Optimized oil concentration for lasting yet refined sillage.",
                            },
                        ].map((item, i) => (
                            <Card
                                key={i}
                                className="border-none bg-white/70 shadow-sm backdrop-blur transition hover:shadow-md"
                            >
                                <CardHeader className="flex flex-row items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700">
                                        {item.icon}
                                    </div>
                                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-2xl text-zinc-600">
                                    {item.desc}
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                </Section>
            </div>



            {/* FOUNDER STORY */}
            <Section className="py-12 lg:py-16">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    <motion.div {...fadeUp} className="relative order-2 lg:order-1">
                        <img
                            src={assets.duclong}
                            alt="Founder portrait"
                            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-xl"
                        />
                        <div className="absolute -left-6 -top-6 -z-10 h-40 w-40 rounded-3xl bg-gradient-to-br from-rose-200 to-amber-100 blur-2xl" />
                    </motion.div>


                    <motion.div {...fadeUp} className="order-1 space-y-6 lg:order-2">
                        <Pill>
                            <Diamond className="text-2xl h-4 w-4" />
                            <span className="text-3xl">Our Story</span>
                        </Pill>
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            From memories, we create scents.
                        </h2>
                        <p className="text-zinc-600 text-2xl">
                            {brand.name} was born from journeys and the passion for capturing emotions through scent. Each formula was developed over months – testing, refining, then testing again – until reaching the perfect emotional resonance.
                        </p>
                        <p className="text-2xl text-zinc-600">
                            The founder, <span className="font-medium">{brand.founder}</span>, believes in the power of fragrance to tell stories: about a sunny morning, a garden after rain, about tender memories hard to name.
                        </p>
                        <div className="text-2xl flex items-center gap-4 pt-2">
                            <img src={assets.duclong} alt="signature" className="h-10 w-auto opacity-80" />
                            <span className="text-2xl text-zinc-500">{brand.founder} – Founder & Perfumer</span>
                        </div>
                    </motion.div>
                </div>
            </Section>

            <Separator className="mx-auto my-6 max-w-7xl bg-zinc-200" />

            {/* CRAFT & SCENT PYRAMID */}
            <Section className="py-12 lg:py-16">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    <motion.div {...fadeUp} className="order-2 lg:order-1">
                        <h3 className="text-2xl font-semibold">Fragrance Architecture</h3>
                        <p className="mt-3 text-xl text-zinc-600">
                            A balanced composition between top, heart, and base notes – evolving harmoniously from your skin.
                        </p>
                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="mb-2 text-xl font-medium tracking-wider text-zinc-500">TOP NOTES</div>
                                <div className="flex flex-wrap gap-2">
                                    {brand.noteTop.map((n) => (
                                        <ScentBadge key={n} text={n} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xl font-medium tracking-wider text-zinc-500">HEART NOTES</div>
                                <div className="flex flex-wrap gap-2">
                                    {brand.noteHeart.map((n) => (
                                        <ScentBadge key={n} text={n} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xl font-medium tracking-wider text-zinc-500">BASE NOTES</div>
                                <div className="flex flex-wrap gap-2">
                                    {brand.noteBase.map((n) => (
                                        <ScentBadge key={n} text={n} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    <motion.div {...fadeUp} className="order-1 grid place-items-center lg:order-2">
                        <ScentPyramid />
                    </motion.div>
                </div>
            </Section>

            {/* TIMELINE */}
            <Section className="py-8 lg:py-12">
                <Pill>
                    <Clock className="h-4 w-4" />
                    <span className="text-xl">The Journey of {brand.name}</span>
                </Pill>
                <div className="mt-8 grid gap-6 lg:grid-cols-4">
                    {[
                        { year: "2018", text: "Started with a small atelier, first 3 formulas." },
                        { year: "2020", text: "Launched 'Aube' collection – sold out in 2 weeks." },
                        { year: "2022", text: "Opened fragrance experience studio in Saigon." },
                        { year: "2025", text: "Partnership with exclusive raw material distiller." },
                    ].map((m, i) => (
                        <Card key={i} className="border-none bg-white/70 shadow-sm backdrop-blur">
                            <CardHeader>
                                <CardTitle className="text-2xl">{m.year}</CardTitle>
                                <p className="text-xl text-zinc-600">{m.text}</p>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </Section>

            {/* SUSTAINABILITY & ETHICS */}
            <Section className="py-10 lg:py-14">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            icon: <Leaf className="h-6 w-6" />,
                            title: "Sustainable Sourcing",
                            desc: "Prioritizing regenerative farming suppliers and transparent value chains.",
                        },
                        { icon: <Recycle className="h-6 w-6" />, title: "Recycled Packaging", desc: "Recyclable glass, paper boxes from certified plantations." },
                        { icon: <Heart className="h-6 w-6" />, title: "Cruelty‑free", desc: "No animal testing. Committed to professional ethics." },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:shadow-md"
                        >
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                {item.icon}
                            </div>
                            <h4 className="text-2xl font-medium">{item.title}</h4>
                            <p className="mt-1 text-xl text-zinc-600">{item.desc}</p>
                            <div
                                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${brand.accent} opacity-40 blur-2xl transition group-hover:opacity-60`}
                            />
                        </div>
                    ))}
                </div>
            </Section>

            {/* TESTIMONIALS */}
            <Section className="py-10 lg:py-16">
                <div className="grid items-start gap-6 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Pill>
                            <Quote className="h-4 w-4" />
                            <span className="text-xl">What Customers Say</span>
                        </Pill>
                        <h3 className="text-2xl font-semibold">Whispers of Scent</h3>
                        <p className="text-xl text-zinc-600">We cherish every feedback to perfect the experience.</p>
                    </div>


                    <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                        {[
                            { name: "Quynh Anh", text: "The scent is smooth, opening fresh then deep – lasting over 8 hours." },
                            { name: "Minh Kha", text: "The fragrance feels luxurious and unique – everyone asks what I'm wearing." },
                            { name: "Lan Phuong", text: "Design and packaging are stylish. I've purchased again." },
                            { name: "Hoai Nam", text: "At the studio, I was carefully consulted – found my 'signature' scent." },
                        ].map((t, i) => (
                            <Card key={i} className="border-none bg-white/70 p-0 shadow-sm backdrop-blur">
                                <CardContent className="p-6">
                                    <div className="mb-3 flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-xl text-zinc-700">“{t.text}”</p>
                                    <div className="mt-3 text-xl text-zinc-500">— {t.name}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            {/* PRESS / PARTNERS */}
            <Section className="py-4 lg:py-8">
                <div className="rounded-3xl border border-zinc-200 bg-white/60 p-6 backdrop-blur">
                    <p className="text-center text-xl uppercase tracking-widest text-zinc-500">Featured In</p>
                    <div className="mt-4 grid grid-cols-2 items-center gap-6 sm:grid-cols-4">
                        {["ELLE", "Harper’s BAZAAR", "Vogue", "L’Officiel"].map((logo) => (
                            <div key={logo} className="text-center text-2xl font-semibold tracking-wide text-zinc-700 opacity-70">{logo}</div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* AWARDS */}
            <Section className="py-10 lg:py-16">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { title: "Indie Fragrance Awards", text: "Best New House – 2024" },
                        { title: "Beauty Innovators", text: "Packaging of the Year – 2023" },
                        { title: "Scent Community Choice", text: "Top 10 Artisan 2022" },
                    ].map((a) => (
                        <div
                            key={a.title}
                            className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-rose-50 p-6 shadow-sm"
                        >
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                                <Award className="h-5 w-5" />
                            </div>
                            <h4 className="font-medium">{a.title}</h4>
                            <p className="text-xl text-zinc-600">{a.text}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* CTA + CONTACT */}
            <Section className="pb-20 pt-2">
                <div className="grid items-center gap-6 rounded-3xl border border-zinc-200 bg-white/70 p-8 backdrop-blur lg:grid-cols-2">
                    <div>
                        <h3 className="text-2xl font-semibold">Experience fragrance your way</h3>
                        <p className="mt-2 text-xl text-zinc-600">Book a private session at the studio or receive a sample kit at home.</p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button className={`rounded-full bg-gradient-to-r ${brand.darkAccent} text-white`}>Book an Experience</Button>
                            <Button variant="outline" className="rounded-full border-zinc-300 bg-white">Get Sample Kit</Button>
                        </div>
                    </div>


                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white p-5">
                            <MapPin className="mb-2 h-5 w-5 text-amber-600" />
                            <div className="text-xl font-medium">Studio</div>
                            <div className="text-xl text-zinc-600">123 Pasteur, District 1, Ho Chi Minh City</div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-white p-5">
                            <Mail className="mb-2 h-5 w-5 text-rose-600" />
                            <div className="text-xl font-medium">Email</div>
                            <div className="text-xl text-zinc-600">hello@{brand.name.toLowerCase().replace(/\s+/g, "")}.com</div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-white p-5">
                            <div className="mb-2 flex items-center gap-2 text-rose-600">
                                <Instagram className="h-5 w-5" />
                                <Facebook className="h-5 w-5" />
                                <Twitter className="h-5 w-5" />
                            </div>
                            <div className="text-xl font-medium">Social Media</div>
                            <div className="text-xl text-zinc-600">@{brand.name.toLowerCase().replace(/\s+/g, "")}</div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* FOOTER MINI */}
            <footer className="pb-12">
                <Section>
                    <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white/60 p-6 text-xl backdrop-blur md:flex-row">
                        <div>© {new Date().getFullYear()} {brand.name}. All Rights Reserved.</div>
                        <div className="flex items-center gap-4 text-zinc-500">
                            <a href="#" className="hover:text-zinc-700">Privacy Policy</a>
                            <a href="#" className="hover:text-zinc-700">Terms</a>
                            <a href="#" className="hover:text-zinc-700">Support</a>
                        </div>
                    </div>
                </Section>
            </footer>


        </div>
    );
}