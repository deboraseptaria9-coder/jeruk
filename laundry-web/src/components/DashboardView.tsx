import { RefreshCw, Shirt, Users, Wallet, Clock } from "lucide-react";
import { getDashboard } from "../api/laundry";
import { formatRupiah, formatTanggal, STATUS_LABEL, STATUS_LIST } from "../format";
import { useApi } from "../useApi";
import { Button, Card, ErrorBox, Loading, PageHeader, StatusBadge, STATUS_DOT } from "./ui";

export function DashboardView() {
  const { data, loading, error, reload } = useApi(getDashboard);

  const stats = data
    ? [
        { label: "Pesanan aktif", value: String(data.pesanan_aktif), icon: Shirt },
        { label: "Pendapatan (lunas)", value: formatRupiah(data.pendapatan), icon: Wallet },
        { label: "Belum dibayar", value: formatRupiah(data.belum_dibayar), icon: Clock },
        { label: "Pelanggan", value: String(data.total_pelanggan), icon: Users },
      ]
    : [];

  const maxStatus = Math.max(1, ...(data?.per_status.map((s) => s.jumlah) ?? [1]));

  return (
    <div>
      <PageHeader
        title="Ringkasan hari ini"
        subtitle="Data diambil langsung dari server lewat GET /api/dashboard"
        action={
          <Button variant="outline" onClick={reload}>
            <RefreshCw className="h-4 w-4" /> Muat ulang
          </Button>
        }
      />

      {loading && !data && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Card
                key={s.label}
                className={i === 0 ? "bubble-bg border-transparent p-5 text-primary-foreground" : "p-5"}
              >
                <s.icon className={i === 0 ? "h-5 w-5 opacity-80" : "h-5 w-5 text-primary"} />
                <p className="mt-4 font-display text-3xl font-bold">{s.value}</p>
                <p className={i === 0 ? "text-sm opacity-85" : "text-sm text-muted-foreground"}>
                  {s.label}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-bold">Pesanan per status</h3>
              <div className="mt-5 space-y-3">
                {STATUS_LIST.map((st) => {
                  const jumlah = data.per_status.find((p) => p.status === st)?.jumlah ?? 0;
                  return (
                    <div key={st}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{STATUS_LABEL[st]}</span>
                        <span className="font-semibold">{jumlah}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${STATUS_DOT[st]}`}
                          style={{ width: `${(jumlah / maxStatus) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 lg:col-span-3">
              <h3 className="text-lg font-bold">Pesanan terbaru</h3>
              <ul className="mt-4 divide-y">
                {data.pesanan_terbaru.length === 0 && (
                  <li className="py-6 text-sm text-muted-foreground">Belum ada pesanan.</li>
                )}
                {data.pesanan_terbaru.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.nama_pelanggan}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.kode_pesanan} · {p.nama_layanan} · {formatTanggal(p.tanggal_masuk)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm font-semibold sm:inline">
                        {formatRupiah(p.total_harga)}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
