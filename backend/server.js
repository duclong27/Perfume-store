// import express from "express";
// import cors from "cors";
// import path from "path";

// import "dotenv/config";
// import { sequelize } from "./config/sequelize.js";
// import categoryRouter from "./routes/admin/categoryRouter.js";
// import productRouter from "./routes/admin/productRouter.js";

// import userRouter from "./routes/admin/userRouter.js";

// import adminRouter from "./routes/admin/orderRouter.js";
// import productVariantRouter from "./routes/admin/variantProductRouter.js";
// import cartItemRouter from "./routes/internal/cartItemRouter.js";
// import cartRouter from "./routes/internal/cartRouter.js";
// import newUserRouter from "./routes/customer/authRouter.js";
// import customerRouter from "./routes/internal/userInternal.js";
// import checkoutRouter from "./routes/internal/checkoutInternalRouter.js";
// import addressRouter from "./routes/internal/addressRouter.js";
// import checkoutPlaceRouter from "./routes/internal/checkoutPlaceRouter.js";
// import vnpayReturnRouter from "./routes/internal/vnpayReturnRouter.js";
// import router from "./routes/internal/orderRouter.js";
// import accountRouter from "./routes/admin/accountRouter.js";
// import r from "./routes/admin/dashboardRouter.js";


// const app = express();
// const PORT = process.env.PORT || 4000;


// app.set("trust proxy", 1);

// app.use(express.json());


// // 🚀 MỞ TOANG CORS CHO DEV
// app.use(cors()); 

// app.get("/", (req, res) => res.send("API Working"));
// // app.use("/api/internal/products" , productInternalRouter);



// app.use(
//   "/images",
//   express.static(path.join(process.cwd(), "public", "images"), {
//     setHeaders: (res, filePath) => {
//       if (filePath.endsWith(".avif")) {
//         res.setHeader("Content-Type", "image/avif");
//       }
//       // Dev: ngăn cache dính HTML cũ
//       res.setHeader("Cache-Control", "no-store");
//       // Rất quan trọng: tách cache theo Accept
//       res.setHeader("Vary", "Accept");
//     },
//   })
// );
// app.use("/internal/order",router)
// app.use("/api/productVariant", productVariantRouter);
// app.use("/api/category", categoryRouter);

// app.use("/api/user", userRouter);

// app.use("/api/product", productRouter);
// app.use("/api/customer", newUserRouter);
// app.use("/api/order", adminRouter);
// app.use("/api/account", accountRouter);
// app.use("/api/dashboard", r);

// app.use("/internal/cart", cartItemRouter);
// app.use("/internal/cart", cartRouter);
// app.use("/internal/customer", customerRouter);
// app.use("/internal/checkout", checkoutRouter);
// app.use("/internal/address", addressRouter);
// app.use("/internal/checkout",checkoutPlaceRouter);
// app.use("/internal/vnpay",vnpayReturnRouter);


// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ DB connected");
//     app.listen(PORT, () => console.log(`🚀 Server chạy ở cổng ${PORT}`));
//   } catch (err) {
//     console.error("❌ Không thể kết nối DB:", err);
//     process.exit(1);
//   }
// })();

// export default app;


// server.js
import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";

import { sequelize } from "./config/sequelize.js";

import categoryRouter from "./routes/admin/categoryRouter.js";
import productRouter from "./routes/admin/productRouter.js";
import userRouter from "./routes/admin/userRouter.js";
import adminRouter from "./routes/admin/orderRouter.js";
import productVariantRouter from "./routes/admin/variantProductRouter.js";
import cartItemRouter from "./routes/internal/cartItemRouter.js";
import cartRouter from "./routes/internal/cartRouter.js";
import newUserRouter from "./routes/customer/authRouter.js";
import customerRouter from "./routes/internal/userInternal.js";
import checkoutRouter from "./routes/internal/checkoutInternalRouter.js";
import addressRouter from "./routes/internal/addressRouter.js";
import checkoutPlaceRouter from "./routes/internal/checkoutPlaceRouter.js";
import vnpayReturnRouter from "./routes/internal/vnpayReturnRouter.js";
import router from "./routes/internal/orderRouter.js";
import accountRouter from "./routes/admin/accountRouter.js";
import dashboardRouter from "./routes/admin/dashboardRouter.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

/** ✅ FIX: “dấu vân tay” để biết Render có đang chạy đúng file server.js này không
 *  - Tác dụng: Nếu bạn không thấy log này trong Render Logs => Render đang chạy file khác.
 */
console.log("✅ BOOT FILE = server.js");
console.log("✅ NODE_ENV =", process.env.NODE_ENV, "| PORT =", process.env.PORT);

/** ✅ FIX: trust proxy (giữ như bạn) */
app.set("trust proxy", 1);

/** ✅ FIX: Body parser MUST be before routes
 *  - Tác dụng: req.body có dữ liệu cho controller (hết lỗi hasBody:false).
 */
app.use(express.json({ limit: "1mb" })); // ✅ FIX: thêm limit
app.use(express.urlencoded({ extended: true })); // ✅ FIX: an toàn cho form-encoded

/** ✅ FIX: CORS cấu hình rõ origin (khuyên dùng)
 *  - Tác dụng: tránh CORS “hên xui”, ổn định khi FE trên Vercel gọi sang Render.
 *  - Bạn có thể thêm domain Vercel khác nếu có.
 */
const allowOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://perfume-store-lac.vercel.app",
  "https://perfume-store-vsw5.vercel.app",
];

app.use(
  cors({
    origin(origin, cb) {
      // cho phép tool/Postman/no-origin
      if (!origin) return cb(null, true);
      if (allowOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin), false);
    },
    credentials: false,
  })
);

/** ✅ FIX: debug middleware sau body parser để xác nhận body có vào thật
 *  - Tác dụng: Khi login, Render Logs sẽ in ra bodyKeys => biết FE gửi đúng/sai.
 *  - Che password để an toàn.
 */
app.use((req, res, next) => {
  if (req.originalUrl === "/api/user/loginAdminOrStaff") {
    const b = req.body || {};
    console.log("[DEBUG] loginAdminOrStaff bodyKeys =", Object.keys(b));
    console.log("[DEBUG] loginAdminOrStaff bodySafe =", {
      email: b.email,
      password: b.password ? "***" : undefined,
      extraKeys: Object.keys(b).filter((k) => !["email", "password"].includes(k)),
    });
  }
  next();
});

/** ✅ Health check */
app.get("/", (req, res) => res.send("API Working"));

/** Static images (giữ như bạn) */
app.use(
  "/images",
  express.static(path.join(process.cwd(), "public", "images"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".avif")) {
        res.setHeader("Content-Type", "image/avif");
      }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Vary", "Accept");
    },
  })
);

/** Routes (giữ nguyên paths của bạn) */
app.use("/internal/order", router);

app.use("/api/productVariant", productVariantRouter);
app.use("/api/category", categoryRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/customer", newUserRouter);
app.use("/api/order", adminRouter);
app.use("/api/account", accountRouter);
app.use("/api/dashboard", dashboardRouter);

app.use("/internal/cart", cartItemRouter);
app.use("/internal/cart", cartRouter);
app.use("/internal/customer", customerRouter);
app.use("/internal/checkout", checkoutRouter);
app.use("/internal/address", addressRouter);
app.use("/internal/checkout", checkoutPlaceRouter);
app.use("/internal/vnpay", vnpayReturnRouter);

/** ✅ (Optional nhưng hay) error handler cho CORS/JSON parse error */
app.use((err, req, res, next) => {
  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON:", err.message);
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }

  // CORS blocked
  if (String(err?.message || "").startsWith("CORS blocked:")) {
    console.error("❌", err.message);
    return res.status(403).json({ success: false, message: err.message });
  }

  return next(err);
});

/** Start server after DB connect (giữ như bạn) */
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");
    app.listen(PORT, () => console.log(`🚀 Server chạy ở cổng ${PORT}`));
  } catch (err) {
    console.error("❌ Không thể kết nối DB:", err);
    process.exit(1);
  }
})();

export default app;

