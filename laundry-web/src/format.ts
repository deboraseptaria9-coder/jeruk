import type { StatusBayar, StatusPesanan } from "./types";

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/** Tanggal dari SQLite ("2026-11-06 14:46:35", UTC) -> waktu lokal */
export const formatTanggal = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

export const STATUS_LIST: StatusPesanan[] = [
  "diterima",
  "dicuci",
  "disetrika",
  "selesai",
  "diambil",
  "dibatalkan",
];

export const STATUS_LABEL: Record<StatusPesanan, string> = {
  diterima: "Diterima",
  dicuci: "Dicuci",
  disetrika: "Disetrika",
  selesai: "Selesai",
  diambil: "Diambil",
  dibatalkan: "Dibatalkan",
};

export const BAYAR_LABEL: Record<StatusBayar, string> = {
  belum_bayar: "Belum bayar",
  lunas: "Lunas",
};
