import { useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pelangganApi } from "../api/laundry";
import { getErrorMessage } from "../api/client";
import type { Pelanggan, PelangganInput } from "../types";
import { useApi } from "../useApi";
import { Button, Card, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader, td, th } from "./ui";

const EMPTY: PelangganInput = { nama: "", no_hp: "", alamat: "" };

export function PelangganView() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, error, reload } = useApi(() => pelangganApi.list(query), [query]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pelanggan | null>(null);
  const [form, setForm] = useState<PelangganInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (p: Pelanggan) => {
    setEditing(p);
    setForm({ nama: p.nama, no_hp: p.no_hp, alamat: p.alamat ?? "" });
    setOpen(true);
  };

  // POST (tambah) atau PUT (edit)
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await pelangganApi.update(editing.id, form);
        toast.success("Pelanggan berhasil diupdate");
      } else {
        await pelangganApi.create(form);
        toast.success("Pelanggan berhasil ditambahkan");
      }
      setOpen(false);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const onDelete = async (p: Pelanggan) => {
    if (!window.confirm(`Hapus pelanggan "${p.nama}"?`)) return;
    try {
      await pelangganApi.remove(p.id);
      toast.success("Pelanggan dihapus");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        subtitle="Kelola data pelanggan laundry"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah pelanggan
          </Button>
        }
      />

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
      >
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Cari nama, no HP, atau alamat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" type="submit">
          Cari
        </Button>
      </form>

      {error && <ErrorBox message={error} onRetry={reload} />}

      {!error && (
        <Card className="overflow-hidden">
          {loading && !data ? (
            <Loading />
          ) : data && data.length === 0 ? (
            <Empty>Belum ada pelanggan{query && ` dengan kata "${query}"`}.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/60">
                  <tr>
                    <th className={th}>Nama</th>
                    <th className={th}>No. HP</th>
                    <th className={th}>Alamat</th>
                    <th className={`${th} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className={`${td} font-semibold`}>{p.nama}</td>
                      <td className={td}>{p.no_hp}</td>
                      <td className={`${td} text-muted-foreground`}>{p.alamat || "-"}</td>
                      <td className={`${td} text-right`}>
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(p)}>
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

      <Modal open={open} title={editing ? "Edit pelanggan" : "Tambah pelanggan"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Nama">
            <input
              className={inputClass}
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </Field>
          <Field label="No. HP" hint="10–15 digit angka, contoh 081234567890">
            <input
              className={inputClass}
              required
              inputMode="tel"
              value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
            />
          </Field>
          <Field label="Alamat">
            <textarea
              className={`${inputClass} h-20 py-2`}
              value={form.alamat ?? ""}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
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
