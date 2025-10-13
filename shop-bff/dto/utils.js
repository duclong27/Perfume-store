/** ---------- helpers cơ bản ---------- */
export const first = (arr, fallback = null) =>
    Array.isArray(arr) && arr.length ? arr[0] : fallback;

export const ensureArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

export const pick = (...candidates) => {
    for (const v of candidates) if (v !== undefined && v !== null) return v;
    return undefined;
};

export const toStringSafe = (v, fallback = "") =>
    v === undefined || v === null ? fallback : String(v);

export const toNumberSafe = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

export const toBoolSafe = (v, fallback = false) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return ["true", "1", "yes"].includes(v.toLowerCase());
    if (typeof v === "number") return v !== 0;
    return fallback;
};

export const toDateIso = (v) => {
    try {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
        return null;
    }
};

/** ---------- helpers ảnh (product-only) ---------- */
const trimEndSlash = (s) => String(s).replace(/\/+$/g, "");
const trimStartSlash = (s) => String(s).replace(/^\/+/g, "");
export const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// absolute: http(s)://..., //cdn..., data:
export const isAbsoluteUrl = (u) =>
    /^([a-z][a-z\d+\-.]*:)?\/\//i.test(String(u)) || String(u).startsWith("data:");

const isUnsafeScheme = (u) => {
    const s = String(u).trim();
    const idx = s.indexOf(":");
    if (idx <= 0) return false; // relative, không có scheme
    const scheme = s.slice(0, idx).toLowerCase();
    if (scheme === "javascript" || scheme === "vbscript") return true;
    if (scheme === "data") {
        // chỉ cho data:image/*
        return !/^data:image\//i.test(s);
    }
    return false;
};

const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Chuẩn hoá URL về host BFF khi cần:
 * - Nếu absolute http(s) trỏ tới ADMIN_PUBLIC_ORIGIN → rewrite origin sang ASSET_BASE_URL
 * - Nếu relative → ghép ASSET_BASE_URL
 * - Nếu absolute khác (CDN, v.v.) → giữ nguyên
 * - Chặn scheme nguy hiểm (javascript:, vbscript:, data: không phải image)
 */
export function normalizeImageUrl(input, base) {
    if (!input) return null;
    let u = String(input).trim();
    if (!u) return null;

    // chặn scheme nguy hiểm
    if (isUnsafeScheme(u)) return null;

    // //cdn → https://cdn
    if (u.startsWith("//")) {
        u = `https:${u}`;
    }

    // env
    const BFF_BASE =
        base ||
        process.env.ASSET_BASE_URL ||
        process.env.FILE_BASE_URL ||
        ""; // vd: http://localhost:5000
    const ADMIN_ORIGIN = process.env.ADMIN_PUBLIC_ORIGIN || "http://localhost:4000";

    // absolute?
    if (isAbsoluteUrl(u)) {
        // data:image/... được phép đi thẳng
        if (u.startsWith("data:")) return u;

        // ép origin admin 4000 -> BFF
        const re = new RegExp("^" + escRe(ADMIN_ORIGIN));
        if (re.test(u) && BFF_BASE) {
            return u.replace(re, trimEndSlash(BFF_BASE));
        }
        // absolute khác: giữ nguyên (nếu bạn muốn ép TẤT CẢ qua BFF, cần có proxy ngoài admin)
        return u;
    }

    // relative → ghép base BFF
    if (BFF_BASE) {
        return `${trimEndSlash(BFF_BASE)}/${trimStartSlash(u)}`;
    }

    // không có base → trả lại nguyên relative (ít gặp, nhưng tránh null)
    return u;
}

/**
 * Lấy ảnh từ CHÍNH product (không đụng tới variant)
 * - Ưu tiên: imageUrl | imageURL | image | mainImage | photo
 * - Rơi xuống: images[0] | thumbnails[0] | pictures[0] (string)
 * - Rơi xuống: images/gallery item { secure_url | url | src }
 * - Rơi xuống: thumbnail | thumb | cover | coverUrl
 * - Trả về URL đã normalize (có thể null nếu unsafe)
 */
export function pickImageUrl(obj, { base, fallback = null } = {}) {
    if (!obj) return fallback;

    const direct =
        obj.imageUrl || obj.imageURL || obj.image || obj.mainImage || obj.photo;
    if (isNonEmptyString(direct)) {
        const out = normalizeImageUrl(direct, base);
        return out ?? fallback;
    }

    const arrStr =
        (Array.isArray(obj.images) && obj.images.find(isNonEmptyString)) ||
        (Array.isArray(obj.thumbnails) && obj.thumbnails.find(isNonEmptyString)) ||
        (Array.isArray(obj.pictures) && obj.pictures.find(isNonEmptyString)) ||
        null;
    if (arrStr) {
        const out = normalizeImageUrl(arrStr, base);
        return out ?? fallback;
    }

    const arrObj =
        (Array.isArray(obj.images) &&
            obj.images.find((x) => isNonEmptyString(x?.secure_url || x?.url || x?.src))) ||
        (Array.isArray(obj.gallery) &&
            obj.gallery.find((x) => isNonEmptyString(x?.secure_url || x?.url || x?.src))) ||
        null;
    if (arrObj) {
        const candidate = arrObj.secure_url || arrObj.url || arrObj.src;
        const out = normalizeImageUrl(candidate, base);
        return out ?? fallback;
    }

    const thumb = obj.thumbnail || obj.thumb || obj.cover || obj.coverUrl;
    if (isNonEmptyString(thumb)) {
        const out = normalizeImageUrl(thumb, base);
        return out ?? fallback;
    }

    return fallback;
}

/** ---------- aggregate price/stock từ variants ---------- */
export function aggregateVariantPriceStock(variants) {
    const arr = ensureArray(variants);

    const prices = arr
        .map((v) => toNumberSafe(pick(v.price, v.unitPrice, v.salePrice, null), NaN))
        .filter((n) => Number.isFinite(n));

    const stocks = arr.map((v) => toNumberSafe(pick(v.stock, v.qty, v.quantity, 0), 0));

    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const totalStock = stocks.reduce((a, b) => a + b, 0);
    const inStock = totalStock > 0;

    return { minPrice, maxPrice, totalStock, inStock };
}
