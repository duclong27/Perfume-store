export function passCoreError(res, err) {
  const status = err?.response?.status || 500;
  const data = err?.response?.data;
  const message = (data && (data.message || data.error)) || err.message || "Internal error";
  const extras = {};
  if (data && typeof data === "object") {
    // truyền qua các hint hữu ích (vd: maxAvailable) nếu có
    if (data.maxAvailable != null) extras.maxAvailable = data.maxAvailable;
  }
  return res.status(status).json({ success: false, message, ...extras });
}
