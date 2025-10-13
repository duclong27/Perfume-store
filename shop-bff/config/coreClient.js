// src/services/coreClient.js
import axios from "axios";

export const core = axios.create({
    baseURL: process.env.ADMIN_API_BASE_URL || "http://localhost:4000/api",
    timeout: 8000,
    
});

export const coreInternal = axios.create({
  baseURL: process.env.CORE_INTERNAL_BASE_URL || "http://localhost:4000/internal",
  timeout: 8000,
  headers: { "x-internal-key": process.env.INTERNAL_API_KEY },
});



