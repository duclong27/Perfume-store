import { addAddressService, getAddressesByUserIdService, updateAddressInfoService, setAddressDefaultService, deleteAddressService } from "../service/customer/addressService.js";
import { buildCreateAddressDTO, buildUpdateAddressDTO, toAddressDTO, toAddressListDTO } from "../dto/addressDto.js";
import { passCoreError } from "../utils/errorMapper.js";


function unwrapAddressOne(payload) {
    const d = payload?.data ?? payload;
    // các kiểu bọc phổ biến: { address }, { Address }, { data: { address } }
    return d?.address ?? d?.Address ?? d;
}
function unwrapAddressList(payload) {
    const d = payload?.data ?? payload;
    // các kiểu bọc phổ biến: [ ... ], { addresses: [...] }, { items: [...] }, { results: [...] }
    return Array.isArray(d) ? d
        : Array.isArray(d?.addresses) ? d.addresses
            : Array.isArray(d?.items) ? d.items
                : Array.isArray(d?.results) ? d.results
                    : [];
}

// * ----------------------------- CREATE ADDRESS---------------------------- */
/** POST /api/address
 *  FE body: { recipientName, phoneNumber, addressLine, city, state, postalCode, country, isDefault? }
 */
export async function addAddressController(req, res) {
    try {
        const userId = Number(req.auth?.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }
        const body = buildCreateAddressDTO({ body: req.body });
        const raw = await addAddressService(userId, body);
        const data = raw?.data ?? raw;
        const dto = toAddressDTO(data);
        return res.status(201).json({ success: true, data: dto });
    } catch (err) {

        return passCoreError(res, err);
    }
}

/* --------------------------- LIST USER ADDRESSES -------------------------- */
/** GET /api/address */
export async function getAddressesController(req, res) {
    try {
        const userId = Number(req.auth?.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }

        const raw = await getAddressesByUserIdService(userId);
        const data = raw?.data ?? raw;


        const base =
            Array.isArray(data) ? data :
                Array.isArray(data?.addresses) ? data.addresses :
                    Array.isArray(data?.items) ? data.items :
                        Array.isArray(data?.results) ? data.results :
                            [];

        const list = toAddressListDTO(base);
        return res.status(200).json({ success: true, data: list });
    } catch (err) {
        return passCoreError(res, err);
    }
}


/* ------------------------------ UPDATE INFO ------------------------------ */
export async function updateAddressInfoController(req, res) {
    try {
        const userId = Number(req.auth?.userId);
        const addressId = Number(req.params?.addressId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }
        if (!Number.isInteger(addressId) || addressId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid addressId" });
        }

        const patch = buildUpdateAddressDTO({ body: req.body }); // KHÔNG nhét userId/addressId
        const raw = await updateAddressInfoService(userId, addressId, patch);

        const base = unwrapAddressOne(raw);   // 👈 tự unwrap
        const dto = toAddressDTO(base);

        return res.status(200).json({ success: true, data: dto });
    } catch (err) {
        return passCoreError(res, err);
    }
}

/* ------------------------------ SET DEFAULT ------------------------------ */
export async function setAddressDefaultController(req, res) {
    try {
        const userId = Number(req.auth?.userId);
        const addressId = Number(req.params?.addressId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }
        if (!Number.isInteger(addressId) || addressId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid addressId" });
        }

        const raw = await setAddressDefaultService(userId, addressId);
        const d = raw?.data ?? raw;

        
        if (d && typeof d === "object") {
            const base = unwrapAddressOne(d);     
            return res.status(200).json({ success: true, data: toAddressDTO(base) });
        }
        return res.status(200).json({ success: true, data: true });
    } catch (err) {
        return passCoreError(res, err);
    }
}

/* --------------------------------- DELETE -------------------------------- */
export async function deleteAddressController(req, res) {
    try {
        const userId = Number(req.auth?.userId);
        const addressId = Number(req.params?.addressId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }
        if (!Number.isInteger(addressId) || addressId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid addressId" });
        }

        const raw = await deleteAddressService(userId, addressId);
        const d = raw?.data ?? raw;

        // Chuẩn hóa output delete (true | { deleted:1 } | { success:true } ...)
        const ok = (d === true) || (d?.deleted === 1) || (d?.success === true);
        return res.status(200).json({ success: true, data: !!ok });
    } catch (err) {
        return passCoreError(res, err);
    }
}



