import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import type { StatusBayar, StatusPesanan } from "../types";
import { BAYAR_LABEL, STATUS_LABEL } from "../format";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Button ---------- */
type Variant = "primary" | "outline" | "ghost" | "danger" | "soft";
const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
  soft: "bg-secondary text-secondary-foreground hover:bg-accent/60",
  outline: "border border-input bg-card text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "text-destructive hover:bg-destructive/10",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "icon" }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-8 w-8",
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Form fields ---------- */
export const inputClass =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl border bg-card text-card-foreground shadow-soft", className)}>
      {children}
    </div>
  );
}

/* ---------- Badges ---------- */
const STATUS_TONE: Record<StatusPesanan, string> = {
  diterima: "bg-status-diterima/12 text-status-diterima",
  dicuci: "bg-status-dicuci/12 text-status-dicuci",
  disetrika: "bg-status-disetrika/15 text-status-disetrika",
  selesai: "bg-status-selesai/12 text-status-selesai",
  diambil: "bg-status-diambil/12 text-status-diambil",
  dibatalkan: "bg-status-dibatalkan/12 text-status-dibatalkan",
};

export const STATUS_DOT: Record<StatusPesanan, string> = {
  diterima: "bg-status-diterima",
  dicuci: "bg-status-dicuci",
  disetrika: "bg-status-disetrika",
  selesai: "bg-status-selesai",
  diambil: "bg-status-diambil",
  dibatalkan: "bg-status-dibatalkan",
};

export function StatusBadge({ status }: { status: StatusPesanan }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_TONE[status],
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function BayarBadge({ status }: { status: StatusBayar }) {
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "lunas" ? "bg-success/12 text-success" : "bg-warning/20 text-warning-foreground",
      )}
    >
      {BAYAR_LABEL[status]}
    </span>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center animate-in fade-in"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-lift animate-in zoom-in-95"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- States ---------- */
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function Loading({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="p-10 text-center text-sm text-muted-foreground">{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const td = "px-4 py-3 align-middle";
