
import express from "express";
import cors from "cors";
import "dotenv/config";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import https from "https";
import { URL } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import productRouter from "./routes/productRouter.js";
import authRouter from "./routes/authRouter.js";
import cookieParser from "cookie-parser";
import cartItemRouter from "./routes/cartItemRouter.js";
import longRouter from "./routes/longRouter.js";
import customerRouter from "./routes/customerRouter.js";
import checkoutRouter from "./routes/checkoutRouter.js";
import addressRouter from "./routes/addressRouter.js";
import vnpayReturnRouter from "./routes/vnpayReturnRouter.js";
import successRouter from "./routes/successRouter.js";
import exceptRouter from "./routes/exceptRouter.js";

const app = express();


/* ============ ENV ============ */
const PORT = Number(process.env.PORT || 5000);
const ORIGIN_FE = process.env.ORIGIN_FE || "";
const ADMIN_ORIGIN = process.env.ADMIN_PUBLIC_ORIGIN || "http://localhost:4000";

/* ============ BASE MIDDLEWARES ============ */
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

if (ORIGIN_FE) {
    app.use(cors({ origin: ORIGIN_FE }));
} else {
    app.use(cors());
}

/* ============ ASSET PROXY (tự code) ============ */
const PROXY_LOG = (process.env.DEBUG_PROXY || "false").toLowerCase() === "true";


app.get("/images", (req, res) => {
    try {
        const targetUrl = new URL(req.originalUrl, ADMIN_ORIGIN);
        const client = targetUrl.protocol === "https:" ? https : http;

        console.log("[ASSET → ADMIN]", targetUrl.href);

        const proxyReq = client.get(targetUrl, {
            headers: {
                "user-agent": req.headers["user-agent"] || "shop-bff-proxy",
                accept: req.headers["accept"] || "*/*",
                range: req.headers["range"],
                "if-none-match": req.headers["if-none-match"],
                "if-modified-since": req.headers["if-modified-since"],
            },
        }, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });

        proxyReq.on("error", err => {
            console.error("[ASSET PROXY ERROR]", err.message);
            res.status(502).send("Bad Gateway (asset proxy)");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

/* ============ API ROUTES ============ */

app.use("/api/v1", productRouter);
app.use("/api/v1", authRouter);

app.use("/internal/v1", cartItemRouter);
app.use("/internal/v1", longRouter);
app.use("/internal/v1", customerRouter);
app.use("/internal/v1", checkoutRouter);
app.use("/internal/v1", addressRouter);
app.use("/internal/v1", vnpayReturnRouter);
app.use("/internal/v1", successRouter);
app.use("/internal/v1", exceptRouter);

/* ============ HEALTH ============ */
app.get("/health", (_req, res) => res.json({ ok: true }));



/* ============ ERROR HANDLER ============ */
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: { message: err?.message || "Internal Server Error" } });
});

/* ============ START ============ */
app.listen(PORT, () => {
    console.log(`shop-bff running at http://localhost:${PORT}`);
    console.log(`Admin origin (assets): ${ADMIN_ORIGIN}`);
});
