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

console.log("✅ BOOT FILE = server.js");
console.log("✅ NODE_ENV =", process.env.NODE_ENV, "| PORT =", process.env.PORT);

app.set("trust proxy", 1);

const allowOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "https://perfume-store-lac.vercel.app",
  "https://perfume-store-vsw5.vercel.app",
];

// ✅ CORS nên đặt trước để xử lý OPTIONS/preflight rõ ràng
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/tool
      if (allowOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin), false);
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Body parser
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ LOG CHUẨN: chỉ 1 lần (bỏ cái log trùng của bạn)
app.use((req, res, next) => {
  const ct = req.headers["content-type"];
  const cl = req.headers["content-length"];

  console.log("[REQ]", {
    method: req.method,
    url: req.originalUrl,
    contentType: ct,
    contentLength: cl,
    hasBody: !!cl && cl !== "0",
    origin: req.headers.origin,
  });

  // ✅ chỉ log sâu cho login route
  if (req.method === "POST" && req.originalUrl === "/api/user/loginAdminOrStaff") {
    const b = req.body || {};

    const emailRaw = b.email;
    const passRaw = b.password;

    const email = typeof emailRaw === "string" ? emailRaw.trim() : "";
    const password = typeof passRaw === "string" ? passRaw : "";

    console.log("[LOGIN.BODY.CHECK]", {
      bodyType: typeof req.body,
      bodyKeys: Object.keys(b),

      emailType: typeof emailRaw,
      emailLen: email.length,
      emailPreview: email ? `${email.slice(0, 2)}***@***` : undefined,

      passwordType: typeof passRaw,
      passwordLen: password.length,
      passwordMasked: password ? "***" : undefined,
    });

    // Nếu bạn muốn nhìn rõ email để chắc chắn (OK), nhưng vẫn che pass:
    console.log("[LOGIN.BODY.SAFE]", { email, password: password ? "***" : undefined });
  }

  next();
});


// ✅ Debug riêng cho login (giữ lại)
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

app.get("/", (req, res) => res.send("API Working"));

app.use(
  "/images",
  express.static(path.join(process.cwd(), "public", "images"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".avif")) res.setHeader("Content-Type", "image/avif");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Vary", "Accept");
    },
  })
);


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


app.use((err, req, res, next) => {

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON:", err.message);
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }


  if (String(err?.message || "").startsWith("CORS blocked:")) {
    console.error("❌", err.message);
    return res.status(403).json({ success: false, message: err.message });
  }

  return next(err);
});


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

