"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastVariant = "error" | "success" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 4500;

const variantStyles: Record<
  ToastVariant,
  { icon: typeof XCircle; accent: string; iconColor: string }
> = {
  error: {
    icon: XCircle,
    accent: "border-red-500/30",
    iconColor: "text-red-400",
  },
  success: {
    icon: CheckCircle2,
    accent: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  info: {
    icon: Info,
    accent: "border-sky-500/30",
    iconColor: "text-sky-400",
  },
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  // Track auto-dismiss timers so they're cleared if the provider ever unmounts
  // (root-level in practice, but never leave a dangling timer on state).
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      // Cap the stack inside one functional update so a burst of errors never
      // floods the screen (the newest N stay visible).
      setToasts((prev) => [...prev, { id, variant, message }].slice(-4));
      // Auto-dismiss lives here (single source of truth for the timeout);
      // the toast itself only animates the progress bar.
      const timer = window.setTimeout(() => dismiss(id), DURATION_MS);
      timers.current.push(timer);
    },
    [dismiss]
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      error: (message: string) => push("error", message),
      success: (message: string) => push("success", message),
      info: (message: string) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Fixed viewport, stacked bottom-right; pointer-events only on toasts. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const { icon: Icon, accent, iconColor } = variantStyles[toast.variant];

  // Animate the progress bar to mirror the provider's auto-dismiss timeout.
  const [progress, setProgress] = useState(1);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.max(0, 1 - elapsed / DURATION_MS));
      if (elapsed < DURATION_MS) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className={`toast-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border ${accent} bg-zinc-900/95 p-3.5 pr-9 shadow-2xl shadow-black/50 backdrop-blur`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm leading-snug text-zinc-100">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      >
        <X size={14} />
      </button>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-800/60">
        <span
          className="block h-full bg-emerald-500/70"
          style={{ width: `${progress * 100}%` }}
        />
      </span>
    </div>
  );
}
