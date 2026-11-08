import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ClipboardList, LayoutDashboard, LogOut, Server, Tags, Users, WashingMachine } from "lucide-react";
import { Toaster, toast } from "sonner";
import { clearToken, DEFAULT_API_URL, getApiUrl, getToken, loadSavedApiUrl, setApiUrl } from "./api/client";
import { pingServer } from "./api/laundry";
import { DashboardView } from "./components/DashboardView";
import { PesananView } from "./components/PesananView";
import { PelangganView } from "./components/PelangganView";
import { LayananView } from "./components/LayananView";
import { Button, Field, inputClass, Modal } from "./components/ui";
import { LoginView } from "./components/LoginView";

type Tab = "dashboard" | "pesanan" | "pelanggan" | "layanan";
const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pesanan", label: "Pesanan", icon: ClipboardList },
  { id: "pelanggan", label: "Pelanggan", icon: Users },
  { id: "layanan", label: "Layanan", icon: Tags },
];

type Conn = "checking" | "online" | "offline";

export function LaundryApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [ready, setReady] = useState(false);
  const [apiUrl, setUrlState] = useState(DEFAULT_API_URL);
  const [conn, setConn] = useState<Conn>("checking");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [username, setUsername] = useState(() => window.localStorage.getItem("laundry_username") ?? "");
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));

  const check = useCallback(async () => {
    setConn("checking");
    try {
      await pingServer();
      setConn("online");
    } catch {
      setConn("offline");
    }
  }, []);

  // Jalan sekali di browser: baca alamat server yang tersimpan lalu cek koneksi
  useEffect(() => {
    setUrlState(loadSavedApiUrl());
    setReady(true);
    if (getToken()) void check();
  }, [check]);

  useEffect(() => {
    const expire = () => {
      clearToken();
      window.localStorage.removeItem("laundry_username");
      setAuthenticated(false);
      setUsername("");
      toast.error("Sesi berakhir. Silakan masuk kembali.");
    };
    window.addEventListener("laundry:unauthorized", expire);
    return () => window.removeEventListener("laundry:unauthorized", expire);
  }, []);

  const handleLogin = (name: string) => {
    window.localStorage.setItem("laundry_username", name);
    setUsername(name);
    setAuthenticated(true);
    void check();
  };

  const handleLogout = () => {
    clearToken();
    window.localStorage.removeItem("laundry_username");
    setAuthenticated(false);
    setUsername("");
    toast.success("Anda sudah keluar.");
  };

  const saveUrl = async (e: FormEvent) => {
    e.preventDefault();
    setApiUrl(draftUrl || DEFAULT_API_URL);
    setUrlState(getApiUrl());
    setSettingsOpen(false);
    setRefreshKey((k) => k + 1);
    await check();
    toast.success("Alamat server disimpan");
  };

  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" />

      {!authenticated ? <LoginView onLogin={handleLogin} /> : <>

      <header className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="bubble-bg flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground shadow-lift">
            <WashingMachine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-none">LaundryKu</h1>
            <p className="text-xs text-muted-foreground">Sistem Manajemen Laundry</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{username}</span>
        <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold shadow-soft hover:bg-muted">
          <LogOut className="h-3.5 w-3.5" /> Keluar
        </button>
        <button
          type="button"
          onClick={() => {
            setDraftUrl(apiUrl);
            setSettingsOpen(true);
          }}
          className="inline-flex items-center gap-2 self-start rounded-full border bg-card px-3 py-1.5 text-xs shadow-soft hover:bg-muted md:self-auto"
          title="Ubah alamat server"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              conn === "online" ? "bg-success" : conn === "offline" ? "bg-destructive" : "bg-warning animate-pulse"
            }`}
          />
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">
            {conn === "online" ? "Server terhubung" : conn === "offline" ? "Server tidak terhubung" : "Mengecek..."}
          </span>
          <span className="hidden text-muted-foreground sm:inline">{apiUrl}</span>
        </button>
        </div>
      </header>

      <nav className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border bg-card p-1 shadow-soft">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6" key={refreshKey}>
        {conn === "offline" && (
          <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <p className="font-semibold">Server API belum terhubung.</p>
            <p className="mt-1 text-muted-foreground">
              Buka folder <b>laundry-api</b> di terminal, jalankan <code className="rounded bg-muted px-1">npm run dev</code>,
              lalu klik{" "}
              <button type="button" className="font-semibold text-primary underline" onClick={() => { setRefreshKey((k) => k + 1); void check(); }}>
                cek lagi
              </button>
              .
            </p>
          </div>
        )}

        {ready && tab === "dashboard" && <DashboardView />}
        {ready && tab === "pesanan" && <PesananView />}
        {ready && tab === "pelanggan" && <PelangganView />}
        {ready && tab === "layanan" && <LayananView />}
      </main>

      <Modal open={settingsOpen} title="Alamat server API" onClose={() => setSettingsOpen(false)}>
        <form className="space-y-4" onSubmit={saveUrl}>
          <Field label="Base URL" hint={`Default: ${DEFAULT_API_URL}. Untuk HP/Desktop di jaringan yang sama gunakan IP laptop, mis. http://192.168.1.5:3000/api`}>
            <input className={inputClass} value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDraftUrl(DEFAULT_API_URL)}>
              Reset
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
      </>}
    </div>
  );
}
