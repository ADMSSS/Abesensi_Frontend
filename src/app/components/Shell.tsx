import type { ReactNode } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { LayoutDashboard, ScanLine, History, LogOut, FlaskConical } from "lucide-react";
import { Wordmark } from "./AuthPage";
import { SHIFTS, dateKey, shiftBounds, useStore, type Session, type ShiftId } from "../store";

export type Page = "dasbor" | "absensi" | "riwayat";

const NAV: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dasbor", label: "Dasbor", icon: LayoutDashboard },
  { id: "absensi", label: "Absensi", icon: ScanLine },
  { id: "riwayat", label: "Riwayat", icon: History },
];

export function Shell({
  session,
  page,
  onNavigate,
  onLogout,
  children,
}: {
  session: Session;
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const { now, setOffsetTo, simulated, schedule } = useStore();

  const jumpTo = (which: "start" | "end") => {
    const key = dateKey(now);
    const a = schedule[session.employeeId]?.[key];
    const shift: ShiftId = a && a !== "libur" ? a : "pagi";
    const { start, end } = shiftBounds(key, shift);
    setOffsetTo(which === "start" ? new Date(start.getTime() + 3 * 60000) : new Date(end.getTime() + 60000));
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden lg:flex flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen px-5 py-6">
        <Wordmark dark className="text-3xl" />
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sidebar-foreground/60 mt-2">Absensi Karyawan</p>

        <nav className="mt-10 space-y-1.5" aria-label="Menu utama">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-md font-display font-bold transition-colors focus-visible:outline-2 focus-visible:outline-sidebar-ring ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-border pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground grid place-items-center font-display font-extrabold">
              {session.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{session.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                {session.role === "admin" ? "Admin" : "Pekerja"}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="flex items-center justify-between gap-4 px-5 lg:px-10 py-4 border-b-2 border-foreground bg-background sticky top-0 z-20">
          <div className="lg:hidden">
            <Wordmark className="text-2xl" />
          </div>
          <p className="hidden lg:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {format(now, "EEEE, d MMMM yyyy", { locale: idLocale })}
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`font-mono text-xl font-medium px-3 py-1 rounded-md border-2 border-foreground tabular-nums ${
                simulated ? "bg-destructive text-destructive-foreground" : "bg-accent"
              }`}
              aria-label="Jam saat ini"
            >
              {format(now, "HH:mm:ss")}
            </div>
            <button
              onClick={onLogout}
              aria-label="Keluar"
              className="lg:hidden p-2 rounded-md border-2 border-foreground hover:bg-secondary"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {session.role === "pekerja" && (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 lg:px-10 py-2 border-b border-foreground/30 text-xs"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, #e2ddcb 0 8px, #efece1 8px 16px)" }}
          >
            <span className="flex items-center gap-1.5 font-mono uppercase tracking-widest font-medium">
              <FlaskConical className="w-3.5 h-3.5" /> Simulasi waktu
            </span>
            <button onClick={() => jumpTo("start")} className="underline underline-offset-2 hover:text-destructive font-medium">
              Ke awal shift
            </button>
            <button onClick={() => jumpTo("end")} className="underline underline-offset-2 hover:text-destructive font-medium">
              Ke akhir shift
            </button>
            <button
              onClick={() => setOffsetTo(null)}
              disabled={!simulated}
              className="underline underline-offset-2 hover:text-destructive font-medium disabled:opacity-40 disabled:no-underline"
            >
              Waktu nyata
            </button>
            <span className="text-muted-foreground hidden sm:inline">
              Pagi {SHIFTS.pagi.start}–{SHIFTS.pagi.end} · Malam {SHIFTS.malam.start}–{SHIFTS.malam.end}
            </span>
          </div>
        )}

        <main className="px-5 lg:px-10 py-8 max-w-[1280px]">{children}</main>
      </div>

      <nav
        aria-label="Menu utama"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-3 bg-sidebar text-sidebar-foreground border-t-2 border-foreground"
      >
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-bold ${active ? "text-accent" : "text-sidebar-foreground/70"}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
