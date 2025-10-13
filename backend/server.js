import express from "express";
import cors from "cors";
import path from "path";

import "dotenv/config";
import { sequelize } from "./config/sequelize.js";
import connectCloudinary from "./config/cloudinary.js";

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
import r from "./routes/admin/dashboardRouter.js";


const app = express();
const PORT = process.env.PORT || 4000;


app.set("trust proxy", 1);

app.use(express.json());


// 🚀 MỞ TOANG CORS CHO DEV
app.use(cors()); 
// hoặc rõ ràng hơn:
// app.use(cors({ origin: "*", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));

// routes
app.get("/", (req, res) => res.send("API Working"));
// app.use("/api/internal/products" , productInternalRouter);



app.use(
  "/images",
  express.static(path.join(process.cwd(), "public", "images"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".avif")) {
        res.setHeader("Content-Type", "image/avif");
      }
      // Dev: ngăn cache dính HTML cũ
      res.setHeader("Cache-Control", "no-store");
      // Rất quan trọng: tách cache theo Accept
      res.setHeader("Vary", "Accept");
    },
  })
);
app.use("/internal/order",router)
app.use("/api/productVariant", productVariantRouter);
app.use("/api/category", categoryRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/customer", newUserRouter);
app.use("/api/order", adminRouter);
app.use("/api/account", accountRouter);
app.use("/api/dashboard", r);

app.use("/internal/cart", cartItemRouter);
app.use("/internal/cart", cartRouter);
app.use("/internal/customer", customerRouter);
app.use("/internal/checkout", checkoutRouter);
app.use("/internal/address", addressRouter);
app.use("/internal/checkout",checkoutPlaceRouter);
app.use("/internal/vnpay",vnpayReturnRouter);


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
