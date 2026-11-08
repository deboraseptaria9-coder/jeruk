import type { AxiosResponse } from "axios";
import { api } from "./client";
import type {
  ApiResponse,
  Dashboard,
  Layanan,
  LayananInput,
  Pelanggan,
  PelangganInput,
  Pesanan,
  PesananInput,
  StatusPesanan,
} from "../types";

/** Ambil isi "data" dari response { success, message, data } */
async function unwrap<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const res = await request;
  return res.data.data;
}

/* ================= DASHBOARD ================= */
export const getDashboard = () => unwrap<Dashboard>(api.get("/dashboard"));

/** Cek server menyala (GET /api/test bawaan template) */
export const pingServer = () => api.get("/test", { timeout: 3000 });

/* ================= PELANGGAN ================= */
export const pelangganApi = {
  list: (search?: string) =>
    unwrap<Pelanggan[]>(api.get("/pelanggan", { params: search ? { search } : {} })),
  get: (id: number) => unwrap<Pelanggan>(api.get(`/pelanggan/${id}`)),
  create: (body: PelangganInput) => unwrap<Pelanggan>(api.post("/pelanggan", body)),
  update: (id: number, body: Partial<PelangganInput>) =>
    unwrap<Pelanggan>(api.put(`/pelanggan/${id}`, body)),
  remove: (id: number) => api.delete(`/pelanggan/${id}`),
};

/* ================= LAYANAN ================= */
export const layananApi = {
  list: (onlyActive = false) =>
    unwrap<Layanan[]>(api.get("/layanan", { params: onlyActive ? { aktif: 1 } : {} })),
  get: (id: number) => unwrap<Layanan>(api.get(`/layanan/${id}`)),
  create: (body: LayananInput) => unwrap<Layanan>(api.post("/layanan", body)),
  update: (id: number, body: Partial<LayananInput>) =>
    unwrap<Layanan>(api.put(`/layanan/${id}`, body)),
  remove: (id: number) => api.delete(`/layanan/${id}`),
};

/* ================= PESANAN ================= */
export type PesananFilter = { status?: StatusPesanan | ""; search?: string };

export const pesananApi = {
  list: (filter: PesananFilter = {}) => {
    const params: { status?: string; search?: string } = {};
    if (filter.status) params.status = filter.status;
    if (filter.search) params.search = filter.search;
    return unwrap<Pesanan[]>(api.get("/pesanan", { params }));
  },
  get: (id: number) => unwrap<Pesanan>(api.get(`/pesanan/${id}`)),
  create: (body: PesananInput) => unwrap<Pesanan>(api.post("/pesanan", body)),
  update: (id: number, body: Partial<PesananInput>) =>
    unwrap<Pesanan>(api.put(`/pesanan/${id}`, body)),
  updateStatus: (id: number, status: StatusPesanan) =>
    unwrap<Pesanan>(api.patch(`/pesanan/${id}/status`, { status })),
  remove: (id: number) => api.delete(`/pesanan/${id}`),
};
