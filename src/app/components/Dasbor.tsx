import { addDays, format, startOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowRight, Award, Clock, Moon, Sun, Users, UserCheck, Check } from "lucide-react";
import { toast } from "sonner";
import {
  EMPLOYEE_OF_MONTH,
  SHIFTS,
  dateKey,
  useStore,
  type Assignment,
  type Session,
  type ShiftId,
} from "../store";
import type { Page } from "./Shell";

const CONFETTI = ["#111611", "#ff6a3d", "#f9f7ef", "#111611", "#ff6a3d", "#f9f7ef"];

function EmployeeOfMonth() {
  const { now, employees } = useStore();
  const emp = employees.find((e) => e.id === EMPLOYEE_OF_MONTH.employeeId)!;
  const stats = [
    { label: "Kehadiran", value: EMPLOYEE_OF_MONTH.stats.kehadiran },
    { label: "Tepat waktu", value: EMPLOYEE_OF_MONTH.stats.tepat },
    { label: "Jam kerja", value: EMPLOYEE_OF_MONTH.stats.jam },
  ];
  return (
    <section
      aria-label="Karyawan terbaik bulan ini"
      className="relative overflow-hidden bg-accent border-2 border-foreground rounded-md shadow-[6px_6px_0_0_#111611]"
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="hadirin-confetti absolute top-0 block"
            style={{
              left: `${(i * 4.7 + 3) % 100}%`,
              width: i % 3 === 0 ? 8 : 6,
              height: i % 3 === 0 ? 14 : 6,
              borderRadius: i % 2 ? 9999 : 1,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i * 0.37) % 4.5}s`,
              animationDuration: `${3.8 + (i % 5) * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-foreground text-accent overflow-hidden border-b-2 border-foreground py-1.5">
        <div className="hadirin-marquee flex w-max gap-8 font-mono text-xs uppercase tracking-[0.3em] whitespace-nowrap">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i}>★ Selamat ★ Karyawan Terbaik</span>
          ))}
        </div>
      </div>

      <div className="relative grid sm:grid-cols-[200px_1fr] gap-6 p-6 sm:p-8">
        <div className="relative w-40 sm:w-full aspect-[4/5] rotate-[-3deg] border-2 border-foreground bg-card p-1.5 shadow-[4px_4px_0_0_#111611]">
          <img
            src="https://images.unsplash.com/photo-1742844019488-12a9356a7ace?auto=format&fit=crop&w=500&h=625&q=80"
            alt={`Foto ${emp.name}, karyawan terbaik bulan ini`}
            className="w-full h-full object-cover object-top bg-secondary"
          />
          <span className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-destructive text-destructive-foreground border-2 border-foreground grid place-items-center rotate-12">
            <Award className="w-6 h-6" />
          </span>
        </div>

        <div className="flex flex-col justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em]">
              Employee of the Month · {format(now, "MMMM yyyy", { locale: idLocale })}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95] mt-2">{emp.name}</h2>
            <p className="mt-2 font-medium">{emp.position} — kehadiran sempurna, tak pernah terlambat.</p>
          </div>
          <dl className="grid grid-cols-3 border-t-2 border-foreground pt-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-3xl font-extrabold tabular-nums">{s.value}</dd>
                <dt className="font-mono text-[10px] uppercase tracking-widest">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`border-2 border-foreground rounded-md p-5 ${dark ? "bg-foreground text-background" : "bg-card"} flex-1`}
    >
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">
        {label}
        {icon}
      </div>
      <div className="font-display text-5xl font-extrabold tabular-nums mt-3 leading-none">{value}</div>
      {hint && <p className="text-sm mt-2 opacity-75">{hint}</p>}
    </div>
  );
}

function ShiftIcon({ shift, className = "w-4 h-4" }: { shift: ShiftId; className?: string }) {
  return shift === "pagi" ? <Sun className={className} /> : <Moon className={className} />;
}

function WorkerSchedule({ session }: { session: Session }) {
  const { now, schedule, assign, countFor } = useStore();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const todayKey = dateKey(now);
  const mine = schedule[session.employeeId] ?? {};

  const choose = (key: string, a: Assignment) => {
    assign(session.employeeId, key, a);
    toast.success(
      a === "libur"
        ? `Libur dicatat untuk ${format(new Date(`${key}T00:00:00`), "EEEE", { locale: idLocale })}.`
        : `${SHIFTS[a].label} diambil untuk ${format(new Date(`${key}T00:00:00`), "EEEE, d MMM", { locale: idLocale })}.`
    );
  };

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {Array.from({ length: 7 }).map((_, i) => {
        const day = addDays(monday, i);
        const key = dateKey(day);
        const past = key < todayKey;
        const isToday = key === todayKey;
        const a = mine[key];
        return (
          <div
            key={key}
            className={`border-2 rounded-md p-4 ${
              isToday ? "border-foreground bg-card shadow-[4px_4px_0_0_#c9f23c]" : "border-foreground/30 bg-card/60"
            } ${past ? "opacity-60" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <p className="font-display font-extrabold text-lg capitalize">{format(day, "EEEE", { locale: idLocale })}</p>
              <p className="font-mono text-xs text-muted-foreground">{format(day, "d MMM", { locale: idLocale })}</p>
            </div>
            {isToday && <span className="inline-block mt-1 font-mono text-[10px] uppercase tracking-widest bg-foreground text-accent px-1.5 py-0.5 rounded-sm">Hari ini</span>}

            <div className="mt-3 space-y-2">
              {(["pagi", "malam"] as ShiftId[]).map((s) => {
                const taken = countFor(key, s);
                const full = taken >= SHIFTS[s].capacity && a !== s;
                const selected = a === s;
                return (
                  <button
                    key={s}
                    disabled={past || (full && !selected)}
                    onClick={() => choose(key, s)}
                    aria-pressed={selected}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border-2 text-left transition-colors disabled:cursor-not-allowed ${
                      selected
                        ? "bg-foreground text-accent border-foreground"
                        : "border-foreground/40 hover:border-foreground hover:bg-accent disabled:hover:bg-transparent disabled:hover:border-foreground/40 disabled:opacity-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <ShiftIcon shift={s} />
                      {s === "pagi" ? "Pagi" : "Malam"}
                      <span className="font-mono text-[11px] font-normal opacity-80">
                        {SHIFTS[s].start}–{SHIFTS[s].end}
                      </span>
                    </span>
                    {selected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="font-mono text-[11px]">{full ? "Penuh" : `${taken}/${SHIFTS[s].capacity}`}</span>
                    )}
                  </button>
                );
              })}
              <button
                disabled={past}
                onClick={() => choose(key, "libur")}
                aria-pressed={a === "libur"}
                className={`w-full text-xs font-medium py-1.5 rounded-md ${
                  a === "libur" ? "bg-secondary border-2 border-foreground" : "text-muted-foreground hover:text-foreground underline underline-offset-2"
                } disabled:opacity-0`}
              >
                {a === "libur" ? "Libur ✓" : "Ambil libur"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminSchedule() {
  const { now, employees, schedule } = useStore();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(monday, i));
  const todayKey = dateKey(now);
  return (
    <div className="border-2 border-foreground rounded-md bg-card overflow-x-auto no-scrollbar">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="bg-foreground text-background">
            <th className="text-left font-mono text-[11px] uppercase tracking-widest px-4 py-3">Karyawan</th>
            {days.map((d) => (
              <th
                key={d.toISOString()}
                className={`font-mono text-[11px] uppercase tracking-widest px-2 py-3 ${dateKey(d) === todayKey ? "text-accent" : ""}`}
              >
                {format(d, "EEE d", { locale: idLocale })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id} className="border-t border-border">
              <td className="px-4 py-2.5">
                <p className="font-bold leading-tight">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.position}</p>
              </td>
              {days.map((d) => {
                const a = schedule[e.id]?.[dateKey(d)];
                return (
                  <td key={d.toISOString()} className={`text-center px-1 py-2 ${dateKey(d) === todayKey ? "bg-accent/25" : ""}`}>
                    {a === "pagi" || a === "malam" ? (
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-sm border ${
                          a === "pagi" ? "bg-accent border-foreground" : "bg-foreground text-background border-foreground"
                        }`}
                      >
                        <ShiftIcon shift={a} className="w-3 h-3" />
                        {a === "pagi" ? "P" : "M"}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{a === "libur" ? "libur" : "—"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dasbor({ session, onNavigate }: { session: Session; onNavigate: (p: Page) => void }) {
  const { now, employees, schedule, records, todayRecord, openRecord } = useStore();
  const todayKey = dateKey(now);
  const isAdmin = session.role === "admin";

  const scheduledToday = employees.filter((e) => {
    const a = schedule[e.id]?.[todayKey];
    return a === "pagi" || a === "malam";
  }).length;
  const presentToday = records.filter((r) => r.date === todayKey).length;

  const mineToday = todayRecord(session.employeeId);
  const mineOpen = openRecord(session.employeeId);
  const myShift = schedule[session.employeeId]?.[todayKey];

  let statusText = "Belum ada shift";
  let statusHint = "Ambil shift di jadwal di bawah.";
  if (myShift === "libur") {
    statusText = "Libur";
    statusHint = "Nikmati hari istirahat Anda.";
  } else if (mineOpen) {
    statusText = "Bekerja";
    statusHint = `Masuk pukul ${format(new Date(mineOpen.checkIn), "HH:mm")}.`;
  } else if (mineToday?.checkOut) {
    statusText = "Selesai";
    statusHint = `Keluar pukul ${format(new Date(mineToday.checkOut), "HH:mm")}.`;
  } else if (myShift) {
    statusText = "Belum absen";
    statusHint = `${SHIFTS[myShift].label}, ${SHIFTS[myShift].start}–${SHIFTS[myShift].end}.`;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {isAdmin ? "Ringkasan tim" : "Halo,"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
          {isAdmin ? "Dasbor Admin" : session.name.split(" ")[0]}
        </h1>
      </div>

      <div className="grid xl:grid-cols-[1.7fr_1fr] gap-6">
        <EmployeeOfMonth />
        <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total karyawan"
            value={employees.length}
            hint={`${scheduledToday} dijadwalkan hari ini`}
            dark
          />
          {isAdmin ? (
            <StatCard
              icon={<UserCheck className="w-5 h-5" />}
              label="Hadir hari ini"
              value={
                <>
                  {presentToday}
                  <span className="text-2xl text-muted-foreground">/{scheduledToday}</span>
                </>
              }
              hint="Pantau detailnya di menu Absensi."
            />
          ) : (
            <div className="border-2 border-foreground rounded-md p-5 bg-card flex flex-col">
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">
                Status saya
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-display text-4xl font-extrabold mt-3 leading-none">{statusText}</div>
              <p className="text-sm mt-2 text-muted-foreground">{statusHint}</p>
              <button
                onClick={() => onNavigate("absensi")}
                className="mt-4 self-start flex items-center gap-2 bg-accent border-2 border-foreground rounded-md px-4 py-2 font-display font-bold hover:bg-foreground hover:text-accent transition-colors"
              >
                Buka absensi <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="jadwal-title">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <div>
            <h2 id="jadwal-title" className="font-display text-3xl font-extrabold tracking-tight">
              Jadwal masuk karyawan
            </h2>
            <p className="text-muted-foreground">
              {isAdmin
                ? "Pembagian shift seluruh tim minggu ini. P = Pagi, M = Malam."
                : "Pilih shift pagi atau malam untuk tiap hari. Kuota terbatas per shift."}
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Pagi {SHIFTS.pagi.start}–{SHIFTS.pagi.end} · Malam {SHIFTS.malam.start}–{SHIFTS.malam.end}
          </p>
        </div>
        {isAdmin ? <AdminSchedule /> : <WorkerSchedule session={session} />}
      </section>
    </div>
  );
}
