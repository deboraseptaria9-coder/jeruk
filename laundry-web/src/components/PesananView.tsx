import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { layananApi, pelangganApi, pesananApi } from "../api/laundry";
import { getErrorMessage } from "../api/client";
import type { Layanan, Pelanggan, Pesanan, StatusBayar, StatusPesanan } from "../types";
import { formatRupiah, formatTanggal, STATUS_LABEL, STATUS_LIST } from "../format";
import { useApi } from "../useApi";
import {
  BayarBadge,
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  inputClass,
  Loading,
  Modal,
  PageHeader,
  StatusBadge,
  td,
  th,
} from "./ui";

type FormState = {
  pelanggan_id: string;
  layanan_id: string;
  jumlah: string;
  catatan: string;
  status_bayar: StatusBayar;
};
const EMPTY: FormState = { pelanggan_id: "", layanan_id: "", jumlah: "", catatan: "", status_bayar: "belum_bayar" };

export function PesananView() {
  const [status, setStatus] = useState<StatusPesanan | "">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, error, reload } = useApi(
    () => pesananApi.list({ status, search: query }),
    [status, query],
  );

  // data untuk dropdown form
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [layanan, setLayanan] = useState<Layanan[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pesanan | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const loadOptions = async () => {
    try {
      const [pl, ly] = await Promise.all([pelangganApi.list(), layananApi.list(true)]);
      setPelanggan(pl);
      setLayanan(ly);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
    await loadOptions();
  };
  const openEdit = async (p: Pesanan) => {
    setEditing(p);
    setForm({
      pelanggan_id: String(p.pelanggan_id),
      layanan_id: String(p.layanan_id),
      jumlah: String(p.jumlah),
      catatan: p.catatan ?? "",
      status_bayar: p.status_bayar,
    });
    setOpen(true);
    await loadOptions();
  };

  const selectedLayanan = layanan.find((l) => String(l.id) === form.layanan_id);
  const estimasiTotal = useMemo(() => {
    const harga = selectedLayanan?.harga ?? (editing && String(editing.layanan_id) === form.layanan_id ? editing.harga_satuan : 0);
    return Math.round((Number(form.jumlah) || 0) * harga);
  }, [selectedLayanan, form.jumlah, form.layanan_id, editing]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      pelanggan_id: Number(form.pelanggan_id),
      layanan_id: Number(form.layanan_id),
      jumlah: Number(form.jumlah),
      catatan: form.catatan || null,
      status_bayar: form.status_bayar,
    };
    setSaving(true);
    try {
      if (editing) {
        await pesananApi.update(editing.id, body);
        toast.success("Pesanan berhasil diupdate");
      } else {
        const created = await pesananApi.create(body);
        toast.success(`Pesanan ${created.kode_pesanan} berhasil dibuat`);
      }
      setOpen(false);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // PATCH status
  const changeStatus = async (p: Pesanan, next: StatusPesanan) => {
    try {
      await pesananApi.updateStatus(p.id, next);
      toast.success(`${p.kode_pesanan}: ${STATUS_LABEL[next]}`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      await reload();
    }
  };

  const markPaid = async (p: Pesanan) => {
    try {
      await pesananApi.update(p.id, { status_bayar: "lunas" });
      toast.success(`${p.kode_pesanan} ditandai lunas`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onDelete = async (p: Pesanan) => {
    if (!window.confirm(`Hapus pesanan ${p.kode_pesanan}?`)) return;
    try {
      await pesananApi.remove(p.id);
      toast.success("Pesanan dihapus");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const locked = (p: Pesanan) => p.status === "diambil" || p.status === "dibatalkan";

  return (
    <div>
      <PageHeader
        title="Pesanan"
        subtitle="Catat cucian masuk, ubah status, dan tandai pembayaran"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Pesanan baru
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {(["", ...STATUS_LIST] as const).map((s) => (
            <button
              key={s || "semua"}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                status === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border hover:bg-muted"
              }`}
            >
              {s ? STATUS_LABEL[s] : "Semua"}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2 sm:ml-auto"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={`${inputClass} pl-9 sm:w-64`}
              placeholder="Kode / nama pelanggan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" type="submit">
            Cari
          </Button>
        </form>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      {!error && (
        <Card className="overflow-hidden">
          {loading && !data ? (
            <Loading />
          ) : data && data.length === 0 ? (
            <Empty>Tidak ada pesanan.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-b bg-muted/60">
                  <tr>
                    <th className={th}>Pesanan</th>
                    <th className={th}>Layanan</th>
                    <th className={th}>Total</th>
                    <th className={th}>Status</th>
                    <th className={th}>Bayar</th>
                    <th className={th}>Estimasi</th>
                    <th className={`${th} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className={td}>
                        <p className="font-semibold">{p.nama_pelanggan}</p>
                        <p className="text-xs text-muted-foreground">{p.kode_pesanan}</p>
                      </td>
                      <td className={td}>
                        <p>{p.nama_layanan}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.jumlah} {p.satuan} × {formatRupiah(p.harga_satuan)}
                        </p>
                      </td>
                      <td className={`${td} font-semibold`}>{formatRupiah(p.total_harga)}</td>
                      <td className={td}>
                        {locked(p) ? (
                          <StatusBadge status={p.status} />
                        ) : (
                          <select
                            aria-label={`Status ${p.kode_pesanan}`}
                            className="h-8 rounded-lg border border-input bg-card px-2 text-xs font-semibold"
                            value={p.status}
                            onChange={(e) => changeStatus(p, e.target.value as StatusPesanan)}
                          >
                            {STATUS_LIST.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className={td}>
                        {p.status_bayar === "belum_bayar" && !locked(p) ? (
                          <Button variant="soft" size="sm" onClick={() => markPaid(p)}>
                            <Wallet className="h-3.5 w-3.5" /> Tandai lunas
                          </Button>
                        ) : (
                          <BayarBadge status={p.status_bayar} />
                        )}
                      </td>
                      <td className={`${td} text-xs text-muted-foreground`}>
                        {p.status === "diambil"
                          ? `Diambil ${formatTanggal(p.tanggal_diambil)}`
                          : formatTanggal(p.estimasi_selesai)}
                      </td>
                      <td className={`${td} text-right`}>
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            disabled={locked(p)}
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="danger" size="icon" aria-label="Hapus" onClick={() => onDelete(p)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={open} title={editing ? `Edit ${editing.kode_pesanan}` : "Pesanan baru"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Pelanggan">
            <select
              className={inputClass}
              required
              value={form.pelanggan_id}
              onChange={(e) => setForm({ ...form, pelanggan_id: e.target.value })}
            >
              <option value="">— Pilih pelanggan —</option>
              {pelanggan.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.no_hp})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Layanan">
            <select
              className={inputClass}
              required
              value={form.layanan_id}
              onChange={(e) => setForm({ ...form, layanan_id: e.target.value })}
            >
              <option value="">— Pilih layanan —</option>
              {layanan.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama_layanan} — {formatRupiah(l.harga)}/{l.satuan}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Jumlah (${selectedLayanan?.satuan ?? editing?.satuan ?? "kg/pcs"})`}>
              <input
                className={inputClass}
                type="number"
                min={0.1}
                step={selectedLayanan?.satuan === "pcs" ? 1 : 0.1}
                required
                value={form.jumlah}
                onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
              />
            </Field>
            <Field label="Pembayaran">
              <select
                className={inputClass}
                value={form.status_bayar}
                onChange={(e) => setForm({ ...form, status_bayar: e.target.value as StatusBayar })}
              >
                <option value="belum_bayar">Belum bayar</option>
                <option value="lunas">Lunas</option>
              </select>
            </Field>
          </div>
          <Field label="Catatan">
            <textarea
              className={`${inputClass} h-20 py-2`}
              placeholder="Mis. pisahkan baju putih"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </Field>
          <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
            <span className="text-sm text-secondary-foreground">Perkiraan total</span>
            <span className="font-display text-xl font-bold text-secondary-foreground">
              {formatRupiah(estimasiTotal)}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
