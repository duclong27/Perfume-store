import { core } from "../../config/coreClient.js";
import { toCustomerProductDTO, toCustomerProductListDTO } from "../../dto/productDto.js";

// LIST
export async function getAllProductsService(params = {}) {

  const { data } = await core.get("/product/getAllProduct", { params });
  return toCustomerProductListDTO(data);
}

// DETAIL
// BFF service
export async function getProductByIdService(productId) {
  if (!productId) throw new Error("id is required");

  const { data: res } = await core.get(`/product/getProductById/${encodeURIComponent(productId)}`);

  // Unwrap các khả năng thường gặp: {data:{product}}, {data}, {result:{product}}, {payload}, {content}, {product}, ...
  const payload =
    res?.data?.product ??
    res?.data ??
    res?.result?.product ??
    res?.result ??
    res?.payload?.product ??
    res?.payload ??
    res?.content?.product ??
    res?.content ??
    res?.product ??
    res;

  if (!payload || typeof payload !== "object") {
    // In log để soi nhanh trong dev
    console.error("Unexpected response shape from core.getProductById:", JSON.stringify(res, null, 2));
    throw new Error("Unexpected response shape");
  }

  return toCustomerProductDTO(payload);
}

/** (TÙY CHỌN) Debug keys của bản ghi đầu tiên từ admin */
export async function debugAdminProductKeys(params = {}) {
  const { data } = await core.get("/product/getAllProducts", { params });
  const first = Array.isArray(data) ? data[0] : data?.items?.[0];
  const keys = first ? Object.keys(first) : [];
  console.log("admin product keys:", keys);
  return keys;
}