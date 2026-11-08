import { useState, type FormEvent } from "react";
import { Pencil, Plus, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { layananApi } from "../api/laundry";
import { getErrorMessage } from "../api/client";
import type { Layanan, LayananInput } from "../types";
import { formatRupiah } from "../format";
import { useApi } from "../useApi";
import { Button, Card, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader } from "./ui";

const EMPTY: LayananInput = { nama_layanan: "", satuan: "kg", harga: 0, estimasi_hari: 2, deskripsi: "" };

export function LayananView() {
  const { data, loading, error, reload } = useApi(() => layananApi.list());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Layanan | null>(null);
  const [form, setForm] = useState<LayananInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (l: Layanan) => {
    setEditing(l);
    setForm({
      nama_layanan: l.nama_layanan,
      satuan: l.satuan,
      harga: l.harga,
      estimasi_hari: l.estimasi_hari,
      deskripsi: l.deskripsi ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await layananApi.update(editing.id, form);
        toast.success("Layanan berhasil diupdate");
      } else {
        await layananApi.create(form);
        toast.success("Layanan berhasil ditambahkan");
      }
      setOpen(false);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (l: Layanan) => {
    try {
      await layananApi.update(l.id, { is_active: l.is_active ? 0 : 1 });
      toast.success(l.is_active ? "Layanan dinonaktifkan" : "Layanan diaktifkan");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onDelete = async (l: Layanan) => {
    if (!window.confirm(`Hapus layanan "${l.nama_layanan}"?`)) return;
    try {
      await layananApi.remove(l.id);
      toast.success("Layanan dihapus");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Layanan & harga"
        subtitle="Jenis layanan laundry beserta harga per kg / pcs"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah layanan
          </Button>
        }
      />

      {loading && !data && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <Card>
          <Empty>Belum ada layanan.</Empty>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((l) => (
            <Card key={l.id} className={`flex flex-col p-5 ${l.is_active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold">{l.nama_layanan}</h3>
                <button
                  type="button"
                  onClick={() => toggleActive(l)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    l.is_active ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"
                  }`}
                  title="Klik untuk ubah status"
                >
                  {l.is_active ? "Aktif" : "Nonaktif"}
                </button>
              </div>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{l.deskripsi || "-"}</p>
              <p className="mt-4 font-display text-2xl font-bold text-primary">
                {formatRupiah(l.harga)}
                <span className="text-sm font-medium text-muted-foreground"> / {l.satuan}</span>
              </p>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" /> {l.estimasi_hari} hari
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(l)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="icon" aria-label="Hapus" onClick={() => onDelete(l)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? "Edit layanan" : "Tambah layanan"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Nama layanan">
            <input
              className={inputClass}
              required
              value={form.nama_layanan}
              onChange={(e) => setForm({ ...form, nama_layanan: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Harga (Rp)">
              <input
                className={inputClass}
                type="number"
                min={0}
                required
                value={form.harga}
                onChange={(e) => setForm({ ...form, harga: Number(e.target.value) })}
              />
            </Field>
            <Field label="Satuan">
              <select
                className={inputClass}
                value={form.satuan}
                onChange={(e) => setForm({ ...form, satuan: e.target.value as LayananInput["satuan"] })}
              >
                <option value="kg">per kg</option>
                <option value="pcs">per pcs</option>
              </select>
            </Field>
          </div>
          <Field label="Estimasi selesai (hari)">
            <input
              className={inputClass}
              type="number"
              min={0}
              required
              value={form.estimasi_hari}
              onChange={(e) => setForm({ ...form, estimasi_hari: Number(e.target.value) })}
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={`${inputClass} h-20 py-2`}
              value={form.deskripsi ?? ""}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
          </Field>
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
