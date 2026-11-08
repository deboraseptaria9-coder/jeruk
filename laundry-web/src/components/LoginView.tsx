import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, WashingMachine } from "lucide-react";
import { api, getErrorMessage, saveToken } from "../api/client";

type LoginResponse = { success: boolean; message: string; data: { token: string; username: string } };

export function LoginView({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await api.post<LoginResponse>("/auth/login", { username: username.trim(), password });
      saveToken(response.data.data.token);
      onLogin(response.data.data.username);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-visual" aria-label="LaundryKu">
        <div className="login-brand">
          <span className="login-brand-icon"><WashingMachine size={25} /></span>
          <span>Laundry<span className="login-brand-light">Ku</span></span>
        </div>
        <div className="login-message">
          <span className="login-eyebrow"><span /> LAYANAN LAUNDRY MODERN</span>
          <h1>Urus laundry,<br /><em>jadi lebih mudah.</em></h1>
          <p>Pantau pesanan, pelanggan, dan layanan dalam satu tempat yang rapi.</p>
        </div>
        <div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" />
        <div className="login-visual-footer">Bersih, rapi, selesai tepat waktu.</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand"><span className="login-brand-icon"><WashingMachine size={22} /></span> LaundryKu</div>
          <div className="login-heading-icon"><LockKeyhole size={21} /></div>
          <p className="login-kicker">SELAMAT DATANG KEMBALI</p>
          <h2>Masuk ke akun Anda</h2>
          <p className="login-subtitle">Masukkan kredensial admin untuk melanjutkan.</p>

          <form className="login-form" onSubmit={submit}>
            <label className="login-label" htmlFor="username">Username</label>
            <input id="username" className="login-input" autoComplete="username" autoFocus required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Masukkan username" />

            <div className="login-password-label"><label className="login-label" htmlFor="password">Password</label></div>
            <div className="login-password-wrap">
              <input id="password" className="login-input" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
              <button type="button" className="login-eye" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button className="login-submit" type="submit" disabled={busy}>
              {busy ? "Memeriksa..." : "Masuk ke dashboard"}<ArrowRight size={18} />
            </button>
          </form>
          <p className="login-security"><LockKeyhole size={14} /> Koneksi login dilindungi token JWT</p>
          <p className="login-copy">© {new Date().getFullYear()} LaundryKu · Sistem Manajemen Laundry</p>
        </div>
      </section>
    </main>
  );
}
