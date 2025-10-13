
import { Op, fn, col, where } from "sequelize";

import { randomUUID } from "crypto";
import { AppError } from "../../utils/AppError.js";
import { Category, Product, ProductVariant } from "../../model/index.js";
import path from "path";
import { promises as fs } from "fs";

const ALLOWED_GENDERS = new Set(["Man", "Woman", "Unisex"]);
const GENDER_ALIASES = new Map([
  ["man", "Man"], ["male", "Man"], ["m", "Man"], ["nam", "Man"], ["men", "Man"],
  ["woman", "Woman"], ["female", "Woman"], ["f", "Woman"], ["nu", "Woman"], ["women", "Woman"],
  ["unisex", "Unisex"], ["u", "Unisex"], ["all", "Unisex"]
]);
function normalizeGender(input) {
  if (typeof input !== "string") return undefined;
  const key = input.trim().toLowerCase();
  return GENDER_ALIASES.get(key);
}


const IMG_DIR = path.join(process.cwd(), "public/images");
const ALLOW_IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);
const ALLOW_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"]);

// Lưu file buffer vào public/images, trả về URL /images/<name>
async function saveImageBufferToDisk(file) {
  if (!file || !file.buffer) return null;

  if (!ALLOW_MIME.has(file.mimetype)) {
    throw new AppError("Unsupported image type", 400);
  }

  const orig = file.originalname || "image";
  const ext = path.extname(orig).toLowerCase() || ".jpg";
  if (!ALLOW_IMG_EXT.has(ext)) {
    throw new AppError("Unsupported image extension", 400);
  }

  // đảm bảo thư mục tồn tại
  await fs.mkdir(IMG_DIR, { recursive: true });

  // tên file an toàn + unique
  const safeBase = path.basename(orig, ext).replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${safeBase}-${randomUUID()}${ext}`;
  const fullPath = path.join(IMG_DIR, filename);

  // chống path traversal (phòng khi path bị chơi xấu)
  if (!fullPath.startsWith(IMG_DIR)) {
    throw new AppError("Invalid image path", 400);
  }

  await fs.writeFile(fullPath, file.buffer);
  return `/images/${filename}`;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "on", "yes"].includes(s)) return true;
    if (["false", "0", "off", "no"].includes(s)) return false;
  }
  if (typeof v === "number") return v === 1;
  return undefined; // không set nếu không hiểu
}




export async function addProductService(input = {}) {
  const {
    categoryId,
    name,
    brand,
    gender,
    description,
    imageUrl,
    isEnable,
    image,
    file
  } = input;

  const catId = Number(categoryId);
  if (!Number.isInteger(catId) || catId <= 0) throw new AppError("Invalid categoryId", 400);

  const n = typeof name === "string" ? name.trim() : "";
  if (!n) throw new AppError("Name must be typed", 400);
  if (n.length > 200) throw new AppError("Name too long (max 200)", 400);

  const b = typeof brand === "string" ? brand.trim() : null;
  if (b && b.length > 100) throw new AppError("Brand too long (max 100)", 400);

  // ----- GENDER (Man | Woman | Unisex) -----
  const gCanon = normalizeGender(gender);
  if (gender !== undefined && !gCanon) throw new AppError("Invalid gender", 400);

  // ================== IMAGE HANDLING (đÃ “tất” upload) ==================
  // Ưu tiên thứ tự:
  // 1) file upload (multer)
  // 2) imageUrl (string)
  // 3) image[0] (string)
  let img = null;

  // (1) nếu có file upload -> lưu vào public/images và nhận URL
  if (file) {
    img = await saveImageBufferToDisk(file); // trả về "/images/<name>"
  }

  // (2) nếu không có file, dùng imageUrl (cho phép gửi "/images/xxx.jpg" hoặc chỉ "xxx.jpg")
  if (!img && typeof imageUrl === "string" && imageUrl.trim()) {
    img = imageUrl.trim().startsWith("/images/") ? imageUrl.trim() : `/images/${imageUrl.trim()}`;
  }

  // (3) nếu vẫn chưa có, fallback image[0]
  if (!img && Array.isArray(image) && image.length > 0 && typeof image[0] === "string") {
    const first = image[0].trim();
    img = first.startsWith("/images/") ? first : `/images/${first}`;
  }

  if (img) {
    if (img.length > 255) throw new AppError("imageUrl too long (max 255)", 400);
    if (!img.startsWith("/images/")) throw new AppError("imageUrl must be under /images", 400);

    const ext = path.extname(img).toLowerCase();
    if (!ALLOW_IMG_EXT.has(ext)) throw new AppError("Unsupported image extension", 400);


    if (!file) {
      const resolved = path.join(IMG_DIR, img.replace("/images/", ""));
      if (!resolved.startsWith(IMG_DIR)) throw new AppError("Invalid image path", 400);
      try { await fs.access(resolved); }
      catch { throw new AppError("Image file not found", 400); }
    }
  }


  const desc = typeof description === "string" ? description.trim() : null;

  const cat = await Category.findByPk(catId, { attributes: ["categoryId"] });
  if (!cat) throw new AppError("Category not found", 404);

  const dup = await Product.findOne({
    where: {
      [Op.and]: [
        { categoryId: catId },
        where(fn("LOWER", col("name")), n.toLowerCase()),
      ],
    },
    attributes: ["productId"],
  });
  if (dup) throw new AppError("Product already exists in this category", 409);

  const payload = {
    categoryId: catId,
    name: n,
    brand: b || null,
    gender: gCanon ?? null,
    description: desc,
    imageUrl: img || null,
  };
  // đoạn mới
  const e = toBool(isEnable);
  if (e !== undefined) payload.isEnable = e;
  ///
  const product = await Product.create(payload);
  return { product };
}






export async function getAllProductsService({ page = 1, limit = 1000, q, includeVariants = true } = {}) {
  const p = Number.isFinite(+page) && +page > 0 ? Math.floor(+page) : 1;
  const l = Number.isFinite(+limit) && +limit > 0 ? Math.min(1000, Math.floor(+limit)) : 1000;
  const offset = (p - 1) * l;

  const ql = typeof q === "string" ? q.trim().toLowerCase() : "";

  const nameFilter = ql
    ? where(fn("LOWER", col("Product.name")), { [Op.like]: `%${ql}%` })
    : undefined;

  // include mặc định: category
  const include = [
    {
      model: Category,
      as: "category",
      attributes: ["categoryId", "name"],
    },
  ];

  // tuỳ chọn include variants để hiện đầy đủ field
  if (includeVariants) {
    include.push({
      model: ProductVariant,
      as: "variants",
      attributes: [
        "variantId",
        "productId",
        "sku",
        "capacityMl",
        "price",
        "stock",
        "imageUrl",
        "createdAt",
      ],
      // Tránh nổ số dòng & sai count khi 1-n: Sequelize sẽ query variants riêng
      separate: true,
      order: [["capacityMl", "ASC"]],
    });
  }

  const { rows, count } = await Product.findAndCountAll({
    where: nameFilter ? { [Op.and]: [nameFilter] } : undefined,
    include,
    attributes: [
      "productId",
      "categoryId",
      "name",
      "brand",
      "gender",
      "description",
      "imageUrl",
      "isEnable",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
    limit: l,
    offset,
  });

  return { rows, total: count, page: p, limit: l };
}







export async function getProductByIdService({ productId, includeVariants = true } = {}) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid productId", 400);
  }

  const include = [
    {
      model: Category,
      as: "category",
      attributes: ["categoryId", "name"],
    },
  ];

  if (includeVariants) {
    include.push({
      model: ProductVariant,
      as: "variants",
      attributes: [
        "variantId",
        "productId",
        "sku",
        "capacityMl",
        "price",
        "stock",
        "imageUrl",
        "createdAt",
      ],
    });
  }

  const product = await Product.findByPk(id, {
    include,
    // Sắp xếp mảng variants theo capacityMl ASC (áp dụng khi includeVariants = true)
    order: includeVariants
      ? [[{ model: ProductVariant, as: "variants" }, "capacityMl", "ASC"]]
      : undefined,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // product.variants sẽ có đầy đủ các variant (nếu includeVariants = true)
  return { product };
}



export async function deleteProductService({ productId } = {}) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid productId", 400);
  }

  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }


  const snapshot = product.get ? product.get({ plain: true }) : { productId: id };
  await product.destroy();

  return { product: snapshot };
}




export async function setProductIsEnableService(productId, isEnable) {

  const [count] = await Product.unscoped().update(
    { isEnable: !!isEnable },
    { where: { productId } }
  );

  if (count === 0) {

    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  const row = await Product.unscoped().findOne({
    where: { productId },
    attributes: ["productId", "isEnable"],
  });

  return {
    id: row.get("productId"),
    isEnable: !!row.get("isEnable"),
  };
}




export async function getProductVariantsByProductIdService({ productId } = {}) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid productId", 400);
  }

  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["categoryId", "name"],
      },
      {
        model: ProductVariant,
        as: "variants",
        attributes: [
          "variantId",
          "productId",
          "sku",
          "capacityMl",
          "price",
          "stock",
          "imageUrl",
          "createdAt",
        ],
        // Sắp xếp variants cho dễ hiển thị (có thể đổi sang variantId)
        order: [["capacityMl", "ASC"]],
      },
    ],
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return { product };
}



export async function updateProductService(input = {}) {
  const t0 = Date.now();
  const {
    productId,
    categoryId,
    name,
    brand,
    gender,
    description,
    imageUrl,
    isEnable,
    image,
    file,
  } = input;

  const pid = Number(productId);
  if (!Number.isInteger(pid) || pid <= 0) throw new AppError("Invalid productId", 400);

  // lấy product hiện tại
  const product = await Product.findByPk(pid);
  if (!product) throw new AppError("Product not found", 404);

  // ---------------- CATEGORY ----------------
  let catId = product.categoryId;
  if (categoryId !== undefined) {
    const parsed = Number(categoryId);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError("Invalid categoryId", 400);
    // kiểm tra category tồn tại
    const cat = await Category.findByPk(parsed, { attributes: ["categoryId"] });
    if (!cat) throw new AppError("Category not found", 404);
    catId = parsed;
  }

  // ---------------- NAME ----------------
  let n = product.name;
  if (name !== undefined) {
    const tmp = typeof name === "string" ? name.trim() : "";
    if (!tmp) throw new AppError("Name must be typed", 400);
    if (tmp.length > 200) throw new AppError("Name too long (max 200)", 400);
    n = tmp;
  }

  // ---------------- BRAND ----------------
  let b = product.brand ?? null;
  if (brand !== undefined) {
    const tmp = typeof brand === "string" ? brand.trim() : null;
    if (tmp && tmp.length > 100) throw new AppError("Brand too long (max 100)", 400);
    b = tmp;
  }

  // ---------------- GENDER ----------------
  // chỉ set khi client gửi gender; nếu không thì giữ nguyên
  let gCanon;
  if (gender !== undefined) {
    gCanon = normalizeGender(gender);
    if (!gCanon) throw new AppError("Invalid gender", 400);
  }

  // ---------------- IMAGE HANDLING ----------------
  // Ưu tiên: file -> imageUrl -> image[0]
  let imgSet = false; // flag: có yêu cầu cập nhật ảnh hay không
  let img = undefined;

  if (file) {
    img = await saveImageBufferToDisk(file); // trả về "/images/<name>"
    imgSet = true;
  }

  if (!imgSet && typeof imageUrl === "string") {
    const trimmed = imageUrl.trim();
    if (trimmed) {
      img = trimmed.startsWith("/images/") ? trimmed : `/images/${trimmed}`;
      imgSet = true;
    } else {
      // gửi chuỗi rỗng -> coi như xóa ảnh
      img = null;
      imgSet = true;
    }
  }

  if (
    !imgSet &&
    Array.isArray(image) &&
    image.length > 0 &&
    typeof image[0] === "string"
  ) {
    const first = image[0].trim();
    img = first.startsWith("/images/") ? first : `/images/${first}`;
    imgSet = true;
  }

  if (imgSet && img) {
    if (img.length > 255) throw new AppError("imageUrl too long (max 255)", 400);
    if (!img.startsWith("/images/")) throw new AppError("imageUrl must be under /images", 400);

    const ext = path.extname(img).toLowerCase();
    if (!ALLOW_IMG_EXT.has(ext)) throw new AppError("Unsupported image extension", 400);

    // nếu không phải upload file mới, kiểm tra file đã tồn tại dưới /public/images
    if (!file) {
      const resolved = path.join(IMG_DIR, img.replace("/images/", ""));
      if (!resolved.startsWith(IMG_DIR)) throw new AppError("Invalid image path", 400);
      try { await fs.access(resolved); }
      catch { throw new AppError("Image file not found", 400); }
    }
  }

  // ---------------- DESCRIPTION ----------------
  let desc;
  if (description !== undefined) {
    desc = typeof description === "string" ? description.trim() : null;
  }

  // ---------------- DUPLICATE CHECK ----------------
  // nếu name/category thay đổi (hoặc muốn chắc chắn) -> kiểm tra trùng (case-insensitive) trong cùng category
  if (n.toLowerCase() !== product.name.toLowerCase() || catId !== product.categoryId) {
    const dup = await Product.findOne({
      where: {
        [Op.and]: [
          { categoryId: catId },
          where(fn("LOWER", col("name")), n.toLowerCase()),
          { productId: { [Op.ne]: pid } },
        ],
      },
      attributes: ["productId"],
    });
    if (dup) throw new AppError("Product already exists in this category", 409);
  }

  // ---------------- PAYLOAD ----------------
  const payload = {};

  if (categoryId !== undefined) payload.categoryId = catId;
  if (name !== undefined) payload.name = n;
  if (brand !== undefined) payload.brand = b || null;
  if (gender !== undefined) payload.gender = gCanon ?? null;
  if (description !== undefined) payload.description = desc;
  if (imgSet) payload.imageUrl = img || null;

  const e = toBool(isEnable);
  if (e !== undefined) payload.isEnable = e;

  console.log("[updateProductService] payload =", payload);

  // không có gì để cập nhật -> trả về nguyên trạng
  if (Object.keys(payload).length === 0) {
    return { product };
  }

  await product.update(payload);
  console.log("[updateProductService] AFTER update (no reload) =", product.get({ plain: true }));


  await product.reload();
  console.log("[updateProductService] AFTER reload =", product.get({ plain: true }), "Δt=", Date.now() - t0, "ms");
  return { product };
}
