/**
 * Normalize image URL - ensures it's a full URL
 * If the URL is already a full URL (starts with http:// or https://), returns as is
 * If it's a relative path, prepends the API base URL
 * @param {string|null|undefined} imageUrl - The image URL from API
 * @returns {string|null} - Normalized full URL or null
 */
export const normalizeImageUrl = (imageUrl) => {
  // Handle null, undefined, or empty string
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return null;
  }
  
  const trimmedUrl = imageUrl.trim();
  
  // If it's already a full URL, return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // Get API base URL from environment
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const baseURL = apiBaseUrl.replace(/\/+$/, '');
  
  // If no base URL is configured, return the original (might be a relative path)
  // This will cause issues in production, but at least won't crash
  if (!baseURL) {
    console.warn('[ImageUtils] VITE_API_BASE_URL is not set, using image URL as-is:', trimmedUrl);
    return trimmedUrl;
  }
  
  // Remove leading slash from imageUrl if present (to avoid double slashes)
  const cleanImageUrl = trimmedUrl.startsWith('/') ? trimmedUrl.slice(1) : trimmedUrl;
  
  // Combine base URL with image path
  return `${baseURL}/${cleanImageUrl}`;
};

