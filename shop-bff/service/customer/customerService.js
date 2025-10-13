import { core, coreInternal } from "../../config/coreClient.js";

import { toCustomerUserDTO } from "../../dto/customerDto.js";


export async function getCustomerInfoService({ userId }) {
  const { data } = await coreInternal.get(`/customer/getUserById/${userId}`);
  const rawUser = data?.data ?? data;
  return toCustomerUserDTO(rawUser);
}