export function checkInternalKey(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
