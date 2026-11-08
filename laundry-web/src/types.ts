// Tipe data — harus sama dengan kolom tabel di server (src/sql_scripts/init.sql)

/** Format response standar dari server */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface Pelanggan {
  id: number;
  nama: string;
  no_hp: string;
  alamat: string | null;
  created_at: string;
  updated_at: string;
}

export type PelangganInput = {
  nama: string;
  no_hp: string;
  alamat?: string | null;
};

export type Satuan = "kg" | "pcs";

export interface Layanan {
  id: number;
  nama_layanan: string;
  satuan: Satuan;
  harga: number;
  estimasi_hari: number;
  deskripsi: string | null;
  is_active: number; // 1 = aktif, 0 = nonaktif
  created_at: string;
  updated_at: string;
}

export type LayananInput = {
  nama_layanan: string;
  satuan: Satuan;
  harga: number;
  estimasi_hari: number;
  deskripsi?: string | null;
  is_active?: number;
};

export type StatusPesanan =
  | "diterima"
  | "dicuci"
  | "disetrika"
  | "selesai"
  | "diambil"
  | "dibatalkan";

export type StatusBayar = "belum_bayar" | "lunas";

export interface Pesanan {
  id: number;
  kode_pesanan: string;
  pelanggan_id: number;
  layanan_id: number;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
  status: StatusPesanan;
  status_bayar: StatusBayar;
  catatan: string | null;
  tanggal_masuk: string;
  estimasi_selesai: string | null;
  tanggal_diambil: string | null;
  created_at: string;
  updated_at: string;
  // hasil JOIN
  nama_pelanggan: string;
  no_hp_pelanggan: string;
  nama_layanan: string;
  satuan: Satuan;
}

export type PesananInput = {
  pelanggan_id: number;
  layanan_id: number;
  jumlah: number;
  catatan?: string | null;
  status_bayar?: StatusBayar;
};

export interface Dashboard {
  total_pelanggan: number;
  total_layanan_aktif: number;
  total_pesanan: number;
  pesanan_aktif: number;
  pendapatan: number;
  belum_dibayar: number;
  per_status: { status: StatusPesanan; jumlah: number }[];
  pesanan_terbaru: Pesanan[];
}
