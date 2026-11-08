import axios from "axios";

/*
 * Axios instance — SATU tempat untuk alamat server API.
 * Semua request (GET/POST/PUT/PATCH/DELETE) memakai instance ini.
 */
const STORAGE_KEY = "laundry_api_url";
export const TOKEN_KEY = "laundry_jwt";

export const DEFAULT_API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000/api";

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !String(error.config?.url ?? "").includes("/auth/login")) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("laundry:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export function getApiUrl(): string {
  return api.defaults.baseURL ?? DEFAULT_API_URL;
}

/** Ganti alamat server (disimpan di browser supaya tidak hilang saat refresh) */
export function setApiUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, "");
  api.defaults.baseURL = clean;
  window.localStorage.setItem(STORAGE_KEY, clean);
}

/** Panggil di useEffect (hanya di browser) */
export function loadSavedApiUrl(): string {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) api.defaults.baseURL = saved;
  return getApiUrl();
}

/** Ubah error axios menjadi pesan yang mudah dibaca */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Tidak bisa terhubung ke server. Pastikan server API sudah dijalankan (npm run dev).";
    }
    const body = err.response.data as { message?: string; error?: string } | undefined;
    if (body?.error) return `${body.message ?? "Gagal"}: ${body.error}`;
    return body?.message ?? err.message;
  }
  return err instanceof Error ? err.message : "Terjadi kesalahan";
}

export function saveToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}
