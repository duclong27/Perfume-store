export const API_ORIGIN = import.meta.env.VITE_BACKEND_URL || '';

export function resolveUrl(p) {
  try {
    return new URL(p, API_ORIGIN || window.location.origin).toString();
  } catch (e) {
    return p; // fallback nếu p không hợp lệ
  }
}