import { useMemo, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Camera, QrCode as QrIcon } from "lucide-react";
import { SHIFTS, useStore, type AttendanceRecord, type Session } from "../store";

const dur = (r: AttendanceRecord) => {
  if (!r.checkOut) return null;
  return differenceInMinutes(new Date(r.checkOut), new Date(r.checkIn));
};

const fmtDur = (m: number) => `${Math.floor(m / 60)}j ${String(m % 60).padStart(2, "0")}m`;

export function Riwayat({ session }: { session: Session }) {
  const { records, employees } = useStore();
  const isAdmin = session.role === "admin";
  const [who, setWho] = useState("semua");
  const [status, setStatus] = useState<"semua" | "tepat" | "terlambat">("semua");

  const rows = useMemo(
    () =>
      records
        .filter((r) => (isAdmin ? who === "semua" || r.employeeId === who : r.employeeId === session.employeeId))
        .filter((r) => status === "semua" || r.status === status)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    [records, isAdmin, who, status, session.employeeId]
  );

  const totalMin = rows.reduce((s, r) => s + (dur(r) ?? 0), 0);
  const late = rows.filter((r) => r.status === "terlambat").length;
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  const summary = [
    { label: "Total hari hadir", value: rows.length },
    { label: "Terlambat", value: late },
    { label: "Total jam kerja", value: `${Math.round(totalMin / 60)} j` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {isAdmin ? "Semua karyawan" : "Catatan pribadi"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">Riwayat absensi</h1>
      </div>

      <div className="grid grid-cols-3 border-2 border-foreground rounded-md bg-card divide-x-2 divide-foreground">
        {summary.map((s) => (
          <div key={s.label} className="p-4 sm:p-5">
            <p className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums">{s.value}</p>
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && (
          <select
            value={who}
            onChange={(e) => setWho(e.target.value)}
            aria-label="Filter karyawan"
            className="bg-card border-2 border-foreground rounded-md px-3 py-2 font-medium"
          >
            <option value="semua">Semua karyawan</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex border-2 border-foreground rounded-md overflow-hidden" role="group" aria-label="Filter status">
          {(["semua", "tepat", "terlambat"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`px-3.5 py-2 text-sm font-bold capitalize ${status === s ? "bg-foreground text-accent" : "bg-card hover:bg-secondary"}`}
            >
              {s === "tepat" ? "Tepat waktu" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="border-2 border-foreground rounded-md bg-card overflow-x-auto no-scrollbar">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="bg-foreground text-background font-mono text-[11px] uppercase tracking-widest">
              <th className="text-left px-4 py-3">Tanggal</th>
              {isAdmin && <th className="text-left px-4 py-3">Karyawan</th>}
              <th className="text-left px-4 py-3">Shift</th>
              <th className="text-left px-4 py-3">Masuk</th>
              <th className="text-left px-4 py-3">Keluar</th>
              <th className="text-left px-4 py-3">Durasi</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = dur(r);
              return (
                <tr key={r.id} className="border-t border-border hover:bg-accent/20">
                  <td className="px-4 py-3 capitalize">{format(new Date(`${r.date}T00:00:00`), "EEE, d MMM yyyy", { locale: idLocale })}</td>
                  {isAdmin && <td className="px-4 py-3 font-bold">{nameOf(r.employeeId)}</td>}
                  <td className="px-4 py-3">{SHIFTS[r.shift].label.replace("Shift ", "")}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className="inline-flex items-center gap-1.5">
                      {r.photo ? (
                        <img src={r.photo} alt="Foto absen masuk" className="w-6 h-6 rounded-sm object-cover border border-foreground" />
                      ) : r.method === "kamera" ? (
                        <Camera className="w-3.5 h-3.5 text-muted-foreground" aria-label="Kamera" />
                      ) : (
                        <QrIcon className="w-3.5 h-3.5 text-muted-foreground" aria-label="QR" />
                      )}
                      {format(new Date(r.checkIn), "HH:mm")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {r.checkOut ? (
                      <span className="inline-flex items-center gap-1.5">
                        {r.outMethod === "kamera" ? (
                          <Camera className="w-3.5 h-3.5 text-muted-foreground" aria-label="Kamera" />
                        ) : (
                          <QrIcon className="w-3.5 h-3.5 text-muted-foreground" aria-label="QR" />
                        )}
                        {format(new Date(r.checkOut), "HH:mm")}
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-wider bg-accent border border-foreground px-1.5 py-0.5 rounded-sm">Bekerja</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">{m === null ? "—" : fmtDur(m)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block font-mono text-[11px] uppercase tracking-wider px-2 py-1 rounded-sm border ${
                        r.status === "tepat" ? "bg-accent border-foreground" : "bg-destructive text-destructive-foreground border-foreground"
                      }`}
                    >
                      {r.status === "tepat" ? "Tepat waktu" : "Terlambat"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">
                  Belum ada catatan absensi yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
