import { coreInternal } from "../../config/coreClient.js";



export async function previewCheckoutService(payload) {

    console.log("[BFF→Core] preview payload:", {
        userId: payload.userId,
        source: payload.source,
        itemsLen: Array.isArray(payload.items) ? payload.items.length : 0,
    });

    const { data } = await coreInternal.post(`/checkout/preview`, payload);

    return data;
}

export async function placeCheckoutService(payload) {
 

    console.log("[BFF→Core] place payload:", {
        userId: payload.userId,
        source: payload.source,
        addressId: payload.addressId ?? null,
        hasShippingSnapshot: !!payload.shippingSnapshot,
        itemsLen: Array.isArray(payload.items) ? payload.items.length : 0,
        paymentMethodCode: payload.paymentMethodCode,
    });

    const { data } = await coreInternal.post(`/checkout/place`, payload);
    return data; // giữ nguyên kiểu trả về như previewCheckoutService
}


