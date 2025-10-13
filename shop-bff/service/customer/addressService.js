import { coreInternal } from "../../config/coreClient.js";


// **
//  * POST /addAddress/:userId
//  * body: { recipientName, phoneNumber, addressLine, city, state, postalCode, country, isDefault? }
//  */
export async function addAddressService(userId, body) {
    const { data } = await coreInternal.post(`/address/addAddress/${userId}`, body);
    return data; 
}

/**
 * GET /getAddresses/:userId
 */
export async function getAddressesByUserIdService(userId) {
    const { data } = await coreInternal.get(`/address/getAddresses/${userId}`);
    return data; 
}

/**
 * PATCH /updateAddress/:userId/info/:addressId
 * patch: { recipientName?, phoneNumber?, addressLine?, city?, state?, postalCode?, country? }
 */
export async function updateAddressInfoService(userId, addressId, patch) {
    const { data } = await coreInternal.patch(
        `/address/updateAddress/${userId}/info/${addressId}`,
        patch
    );
    return data;
}

/**
 * PATCH /updateAddress/:userId/default/:addressId
 * body rỗng
 */
export async function setAddressDefaultService(userId, addressId) {
    const { data } = await coreInternal.patch(
        `/address/updateAddress/${userId}/default/${addressId}`
    );
    return data; 
}

/**
 * DELETE /deleteAddress/:userId/del/:addressId
 */
export async function deleteAddressService(userId, addressId) {
    const { data } = await coreInternal.delete(
        `/address/deleteAddress/${userId}/del/${addressId}`
    );
    return data; 
}
