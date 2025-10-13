import jwt from "jsonwebtoken";


export const createToken = (id, extra = {}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }

  const uid = Number.isFinite(id) ? id : (typeof id === "string" ? Number(id) : id);

  // Payload luôn có uid + userId + id để tương thích middleware cũ
  const payload = {
    uid,
    userId: uid,
    id: uid,
    ...extra,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
    subject: String(uid), // để middleware nào đọc payload.sub vẫn thấy
  });
};