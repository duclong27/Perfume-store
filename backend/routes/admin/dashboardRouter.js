import { Router } from "express";
import { getSummaryLast7DaysService, getSalesTrendService, getPaymentMixService, getOrderFunnelService,getTopProductsService } from "../../service/admin/dashboardService.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tzPlugin from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(tzPlugin);

const r = Router();

r.get("/summary", async (req, res) => {
    try {
        const data = await getSummaryLast7DaysService();
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});




r.get("/sales-trend", async (req, res) => {
    try {
        const {
            range = "last_30d",
            groupBy = "day",
            tz = "Asia/Ho_Chi_Minh",
            from,
            to,
        } = req.query;

        const fmt = "YYYY-MM-DD";
        let f = from, t = to;

        // Nếu FE không truyền from/to → tự resolve theo range
        if (!from || !to) {
            const now = dayjs().tz(tz);
            if (range === "today") {
                f = now.format(fmt);
                t = now.format(fmt);
            } else if (range === "last_7d") {
                f = now.subtract(6, "day").format(fmt);
                t = now.format(fmt);
            } else if (range === "last_30d") {
                f = now.subtract(29, "day").format(fmt);
                t = now.format(fmt);
            } else if (range === "mtd") {
                f = now.startOf("month").format(fmt);
                t = now.format(fmt);
            } else if (range === "ytd") {
                f = now.startOf("year").format(fmt);
                t = now.format(fmt);
            } else {
                // fallback = last 30 days
                f = now.subtract(29, "day").format(fmt);
                t = now.format(fmt);
            }
        }

        const data = await getSalesTrendService({
            from: f,
            to: t,
            tz: "+07:00", // cố định cho VN
            groupBy,
        });

        res.json({ range, ...data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});



r.get("/payment-mix", async (req, res) => {
    try {
        const { range = "last_30d", tz = "Asia/Ho_Chi_Minh", from, to } = req.query;

        const fmt = "YYYY-MM-DD";
        let f = from, t = to;

        if (!from || !to) {
            const now = dayjs().tz(tz);
            if (range === "today") {
                f = now.format(fmt);
                t = now.format(fmt);
            } else if (range === "last_7d") {
                f = now.subtract(6, "day").format(fmt);
                t = now.format(fmt);
            } else if (range === "last_30d") {
                f = now.subtract(29, "day").format(fmt);
                t = now.format(fmt);
            } else if (range === "mtd") {
                f = now.startOf("month").format(fmt);
                t = now.format(fmt);
            } else if (range === "ytd") {
                f = now.startOf("year").format(fmt);
                t = now.format(fmt);
            } else {
                f = now.subtract(29, "day").format(fmt);
                t = now.format(fmt);
            }
        }

        const data = await getPaymentMixService({
            from: f,
            to: t,
            tz: "+07:00",
        });

        res.json({ range, ...data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});


r.get("/order-funnel", async (req, res) => {
    try {
        const { range = "last_30d", tz = "Asia/Ho_Chi_Minh", from, to } = req.query;

        const fmt = "YYYY-MM-DD";
        let f = from, t = to;

        if (!from || !to) {
            const now = dayjs().tz(tz);
            if (range === "today") {
                f = now.format(fmt);
                t = now.format(fmt);
            } else if (range === "last_7d") {
                f = now.subtract(6, "day").format(fmt);
                t = now.format(fmt);
            } else if (range === "last_30d") {
                f = now.subtract(29, "day").format(fmt);
                t = now.format(fmt);
            } else if (range === "mtd") {
                f = now.startOf("month").format(fmt);
                t = now.format(fmt);
            } else if (range === "ytd") {
                f = now.startOf("year").format(fmt);
                t = now.format(fmt);
            } else {
                f = now.subtract(29, "day").format(fmt);
                t = now.format(fmt);
            }
        }

        const data = await getOrderFunnelService({
            from: f,
            to: t,
            tz: "+07:00",
        });

        res.json({ range, ...data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});

r.get("/top-products", async (req, res) => {
    try {
        const {
            group = "variant",
            by = "quantity",
            range = "last_30d",
            limit = "10",
            tz = "Asia/Ho_Chi_Minh",
            from,
            to,
        } = req.query;

        const fmt = "YYYY-MM-DD";
        let f = from, t = to;

        if (!from || !to) {
            const now = dayjs().tz(tz);
            if (range === "today") {
                f = now.format(fmt); t = now.format(fmt);
            } else if (range === "last_7d") {
                f = now.subtract(6, "day").format(fmt); t = now.format(fmt);
            } else if (range === "last_30d") {
                f = now.subtract(29, "day").format(fmt); t = now.format(fmt);
            } else if (range === "mtd") {
                f = now.startOf("month").format(fmt); t = now.format(fmt);
            } else if (range === "ytd") {
                f = now.startOf("year").format(fmt); t = now.format(fmt);
            } else if (range === "custom" && from && to) {
                // giữ nguyên f,t từ query
            } else {
                // fallback
                f = now.subtract(29, "day").format(fmt); t = now.format(fmt);
            }
        }

        const data = await getTopProductsService({
            from: f,
            to: t,
            tz: "+07:00",
            group: group === "product" ? "product" : "variant",
            by: by === "revenue" ? "revenue" : "quantity",
            limit: Number(limit) || 10,
        });

        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});


export default r;