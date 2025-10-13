// /admin-backend/src/utils/passCoreError.js
export function passCoreError(res, err) {
  const isDev = process.env.NODE_ENV !== "production";
  console.error("[CoreError]", err && err.stack ? err.stack : err);

  if (err && typeof err.statusCode === "number" && err.message) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err?.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Validation error",
      errors: err.errors?.map((e) => e.message) || [],
    });
  }

  return res.status(500).json({
    success: false,
    message: isDev ? `[${err?.name || "Error"}] ${err?.message || "Internal server error"}` : "Internal server error",
  });
}
