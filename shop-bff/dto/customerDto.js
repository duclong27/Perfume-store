import { toStringSafe, toBoolSafe, toDateIso } from "./utils.js";


const toPlain = (x) =>
    x && typeof x.get === "function" ? x.get({ plain: true }) : x;


export function toCustomerUserDTO(u = {}) {
    const raw = toPlain(u);

    return {
        id: raw.userId ?? null,
        name: toStringSafe(raw.name),
        email: toStringSafe(raw.email),
        isEnable: toBoolSafe(raw.isEnable, true),
        createdAt: toDateIso(raw.createdAt),
    };
}
