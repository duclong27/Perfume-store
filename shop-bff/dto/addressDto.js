
const toPlain = (x) => (x && typeof x.get === "function" ? x.get({ plain: true }) : x);

const pick = (...args) => {
    for (const x of args) if (x !== undefined && x !== null) return x;
    return null;
};

const toNumberSafe = (x, fb = null) => {
    if (x === null || x === undefined || x === "") return fb;
    const n = Number(x);
    return Number.isFinite(n) ? n : fb;
};

const toStringSafe = (x, fb = null) => {
    if (x === undefined || x === null) return fb;
    const s = String(x).trim();
    return s.length ? s : fb;
};


const toBoolSafe = (x, fb = false) => {
    if (typeof x === "boolean") return x;
    if (x === 1 || x === "1" || x === "true" || x === "TRUE") return true;
    if (x === 0 || x === "0" || x === "false" || x === "FALSE") return false;
    return fb;
};

const toLowerSafe = (x, fb = "") => (typeof x === "string" ? x : fb).toLowerCase();

const asStringOrUndef = (x) => (x == null ? undefined : String(x));
const asBoolOrUndef = (x) => (x == null ? undefined : toBoolSafe(x));

/* =========================================================================
 * 1) BUILD PAYLOAD → gửi Core (PATH-ONLY)
 *    - KHÔNG nhét userId/addressId vào body (đã có trong path)
 *    - Chỉ pass trường hợp hợp lệ; không “bịa” default
 * ========================================================================= */

/**
 * Create: POST /addAddress/:userId
 * Lưu ý: isDefault chỉ pass nếu client gửi; Core tự auto-default nếu là địa chỉ đầu tiên.
 */
export function buildCreateAddressDTO({ body }) {
    return {
        recipientName: asStringOrUndef(pick(body?.recipientName, body?.recipient_name, null)),
        phoneNumber: asStringOrUndef(pick(body?.phoneNumber, body?.phone_number, null)),
        addressLine: asStringOrUndef(pick(body?.addressLine, body?.address_line, "")),
        city: asStringOrUndef(body?.city),
        state: asStringOrUndef(body?.state),
        postalCode: asStringOrUndef(pick(body?.postalCode, body?.postal_code, null)),
        country: asStringOrUndef(body?.country),
        isDefault: asBoolOrUndef(pick(body?.isDefault, body?.is_default, undefined)), // có thì pass, không thì undefined
    };
}

/**
 * Update info: PATCH /updateAddress/:userId/info/:addressId
 * Không cho sửa isDefault tại đây (để endpoint /default riêng).
 */
export function buildUpdateAddressDTO({ body }) {
    // chỉ nhặt các text fields hợp lệ
    const candidate = {
        recipientName: asStringOrUndef(pick(body?.recipientName, body?.recipient_name, undefined)),
        phoneNumber: asStringOrUndef(pick(body?.phoneNumber, body?.phone_number, undefined)),
        addressLine: asStringOrUndef(pick(body?.addressLine, body?.address_line, undefined)),
        city: asStringOrUndef(body?.city),
        state: asStringOrUndef(body?.state),
        postalCode: asStringOrUndef(pick(body?.postalCode, body?.postal_code, undefined)),
        country: asStringOrUndef(body?.country),
    };

    // loại isDefault nếu client gửi nhầm (endpoint set default riêng sẽ xử lý)
    // eslint-disable-next-line no-unused-vars
    const { isDefault, is_default, ...safe } = { ...candidate };

    // chỉ gắn các key không undefined
    const out = {};
    for (const [k, v] of Object.entries(safe)) {
        if (v !== undefined) out[k] = v;
    }
    return out; // ❌ không có userId/addressId
}

/**
 * Set default: PATCH /updateAddress/:userId/default/:addressId
 * Body để trống; chỉ cần path params.
 */
export function buildSetDefaultAddressDTO() {
    return {}; // ❌ không có userId/addressId trong body
}

/* =========================================================================
 * 2) NORMALIZE RESPONSE ← từ Core/BFF về FE
 *    - Chấp nhận camelCase hoặc snake_case
 *    - Trả về camelCase đồng nhất
 * ========================================================================= */

export function toAddressDTO(raw = {}) {
    // unwrap nếu payload bị bọc
    const root = toPlain(raw) || {};
    const a = toPlain(
        root.address ?? root.Address ?? root.data?.address ?? root
    ) || {};

    return {
        addressId: toNumberSafe(a.addressId ?? a.address_id ?? a.id, null),
        userId: toNumberSafe(a.userId ?? a.user_id, null),

        recipientName: toStringSafe(a.recipientName ?? a.recipient_name, null),
        phoneNumber: toStringSafe(a.phoneNumber ?? a.phone_number, null),
        addressLine: toStringSafe(a.addressLine ?? a.address_line, null),
        city: toStringSafe(a.city, null),
        state: toStringSafe(a.state, null),
        postalCode: toStringSafe(a.postalCode ?? a.postal_code, null),
        country: toStringSafe(a.country, null),

        isDefault: toBoolSafe(a.isDefault ?? a.is_default ?? false, false),
    };
}

export function toAddressListDTO(rawList = []) {
    const arr = Array.isArray(rawList) ? rawList : [];
    return arr.map(toAddressDTO);
}

/* =========================================================================
 * 3) Shipping Snapshot helper (dùng cho preview/place)
 *    - chụp bản text từ Address để khớp Order.snapshot
 * ========================================================================= */
export function toShippingSnapshotFromAddress(addressRaw = {}) {
    const a = toAddressDTO(addressRaw);
    return {
        recipientName: a.recipientName,
        phoneNumber: a.phoneNumber,
        addressLine: a.addressLine,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country,
    };
}
