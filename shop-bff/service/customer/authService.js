
import {core} from "../../config/coreClient.js";




export async function registerCustomerService(body = {}) {
  
  const { data } = await core.post("/customer/registerCustomer", body);

  if (data?.user && "passwordHash" in data.user) {
    const { passwordHash, ...safeUser } = data.user;
    return { ...data, user: safeUser };
  }
  return data;
}


export async function loginCustomerService(body = {}) {
  const { data } = await core.post("/customer/loginCustomer", body);
  return data;
}





