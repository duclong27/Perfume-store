import { coreInternal } from "../../config/coreClient.js";
import { toSuccessSummaryDTO } from "../../dto/successDto.js";


export async function getSuccessSummaryService({ orderId }) {
    const { data } = await coreInternal.get(`/order/getOrderSummaryById/${orderId}`);
    const raw = data?.data ?? data;
    return toSuccessSummaryDTO(raw);
}

