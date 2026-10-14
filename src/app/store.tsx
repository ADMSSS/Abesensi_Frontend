import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addDays, addMinutes, format, startOfWeek, set, subMinutes, isBefore, isAfter, differenceInMinutes } from "date-fns";

export type Role = "admin" | "pekerja";
export type ShiftId = "pagi" | "malam";
export type Method = "qr" | "kamera";
export type Assignment = ShiftId | "libur";

export const SHIFTS: Record<ShiftId, { label: string; start: string; end: string; capacity: number }> = {
  pagi: { label: "Shift Pagi", start: "07:00", end: "15:00", capacity: 6 },
  malam: { label: "Shift Malam", start: "19:00", end: "03:00", capacity: 4 },
};

export const LATE_AFTER_MIN = 10;
export const OPEN_BEFORE_MIN = 60;

export interface Employee {
  id: string;
  name: string;
  position: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  shift: ShiftId;
  checkIn: string;
  checkOut?: string;
  method: Method;
  outMethod?: Method;
  status: "tepat" | "terlambat";
  photo?: string;
}

export interface Session {
  role: Role;
  name: string;
  email: string;
  employeeId: string;
}

export const ACCOUNTS: (Session & { password: string })[] = [
  { role: "admin", name: "Hendra Wijaya", email: "admin@hadirin.id", password: "admin123", employeeId: "adm" },
  { role: "pekerja", name: "Dewi Lestari", email: "pekerja@hadirin.id", password: "pekerja123", employeeId: "e1" },
];

export const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Dewi Lestari", position: "Staf Produksi" },
  { id: "e2", name: "Bagas Hermawan", position: "Staf Gudang" },
  { id: "e3", name: "Siti Nurhaliza", position: "Kasir" },
  { id: "e4", name: "Rizky Pratama", position: "Teknisi" },
  { id: "e5", name: "Maya Anggraini", position: "Staf Produksi" },
  { id: "e6", name: "Fajar Nugroho", position: "Keamanan" },
  { id: "e7", name: "Intan Permata", position: "Administrasi" },
  { id: "e8", name: "Yoga Saputra", position: "Staf Gudang" },
  { id: "e9", name: "Lestari Wulandari", position: "Staf Produksi" },
  { id: "e10", name: "Andi Firmansyah", position: "Pengemudi" },
  { id: "e11", name: "Putri Ayu", position: "Kasir" },
  { id: "e12", name: "Kevin Mahendra", position: "Teknisi" },
];

export const EMPLOYEE_OF_MONTH = {
  employeeId: "e2",
  stats: { kehadiran: "100%", tepat: "22/22", jam: "176" },
};

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export function shiftBounds(key: string, shift: ShiftId) {
  const [h1, m1] = SHIFTS[shift].start.split(":").map(Number);
  const [h2, m2] = SHIFTS[shift].end.split(":").map(Number);
  const base = new Date(`${key}T00:00:00`);
  const start = set(base, { hours: h1, minutes: m1 });
  let end = set(base, { hours: h2, minutes: m2 });
  if (!isAfter(end, start)) end = addDays(end, 1);
  return { start, end };
}

type Schedule = Record<string, Record<string, Assignment>>;

function seedSchedule(today: Date): Schedule {
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const todayKey = dateKey(today);
  const out: Schedule = {};
  EMPLOYEES.forEach((emp, i) => {
    out[emp.id] = {};
    for (let d = 0; d < 7; d++) {
      const key = dateKey(addDays(monday, d));
      const v = (i * 2 + d) % 5;
      let a: Assignment = v === 4 ? "libur" : (i + d) % 2 === 0 ? "pagi" : "malam";
      if (d === 6) a = "libur";
      if (emp.id === "e1" && key >= todayKey) continue;
      out[emp.id][key] = a;
    }
  });
  return out;
}

function seedRecords(today: Date, schedule: Schedule): AttendanceRecord[] {
  const recs: AttendanceRecord[] = [];
  const todayKey = dateKey(today);
  let n = 0;
  EMPLOYEES.forEach((emp, i) => {
    for (let back = 1; back <= 12; back++) {
      const day = addDays(today, -back);
      const key = dateKey(day);
      const sched = schedule[emp.id]?.[key];
      const shift: ShiftId | undefined = sched && sched !== "libur" ? sched : back % 7 === 0 ? undefined : (i + back) % 2 === 0 ? "pagi" : "malam";
      if (!shift || (i + back) % 9 === 0) continue;
      const { start, end } = shiftBounds(key, shift);
      const off = ((i * 7 + back * 5) % 31) - 8;
      const outOff = (i * 3 + back * 4) % 41;
      const ci = addMinutes(start, off);
      const co = addMinutes(end, outOff);
      recs.push({
        id: `seed-${n++}`,
        employeeId: emp.id,
        date: key,
        shift,
        checkIn: ci.toISOString(),
        checkOut: co.toISOString(),
        method: (i + back) % 3 === 0 ? "kamera" : "qr",
        outMethod: (i + back) % 4 === 0 ? "kamera" : "qr",
        status: off > LATE_AFTER_MIN ? "terlambat" : "tepat",
      });
    }
    const sched = schedule[emp.id]?.[todayKey];
    if (sched === "pagi" && emp.id !== "e1" && i !== 5) {
      const { start } = shiftBounds(todayKey, "pagi");
      const off = ((i * 4) % 14) - 6;
      recs.push({
        id: `seed-${n++}`,
        employeeId: emp.id,
        date: todayKey,
        shift: "pagi",
        checkIn: addMinutes(start, off).toISOString(),
        method: i % 2 === 0 ? "qr" : "kamera",
        status: off > LATE_AFTER_MIN ? "terlambat" : "tepat",
      });
    }
  });
  return recs;
}

interface Store {
  now: Date;
  setOffsetTo: (target: Date | null) => void;
  simulated: boolean;
  employees: Employee[];
  schedule: Schedule;
  assign: (employeeId: string, key: string, a: Assignment) => void;
  countFor: (key: string, shift: ShiftId) => number;
  records: AttendanceRecord[];
  openRecord: (employeeId: string) => AttendanceRecord | undefined;
  todayRecord: (employeeId: string) => AttendanceRecord | undefined;
  canCheckIn: (employeeId: string) => { ok: boolean; reason?: string; shift?: ShiftId };
  checkIn: (employeeId: string, method: Method, photo?: string) => void;
  canCheckOut: (employeeId: string) => { ok: boolean; reason?: string; ended: boolean };
  checkOut: (employeeId: string, method: Method) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const now = useMemo(() => new Date(Date.now() + offset), [offset, tick]);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const [schedule, setSchedule] = useState<Schedule>(() => seedSchedule(new Date()));
  const [records, setRecords] = useState<AttendanceRecord[]>(() => seedRecords(new Date(), seedSchedule(new Date())));

  const setOffsetTo = useCallback((target: Date | null) => setOffset(target ? target.getTime() - Date.now() : 0), []);

  const assign = useCallback((employeeId: string, key: string, a: Assignment) => {
    setSchedule((s) => ({ ...s, [employeeId]: { ...s[employeeId], [key]: a } }));
  }, []);

  const countFor = useCallback(
    (key: string, shift: ShiftId) => EMPLOYEES.filter((e) => schedule[e.id]?.[key] === shift).length,
    [schedule]
  );

  const openRecord = useCallback(
    (employeeId: string) => [...records].reverse().find((r) => r.employeeId === employeeId && !r.checkOut),
    [records]
  );

  const todayRecord = useCallback(
    (employeeId: string) => [...records].reverse().find((r) => r.employeeId === employeeId && r.date === dateKey(now)),
    [records, now]
  );

  const canCheckIn: Store["canCheckIn"] = (employeeId) => {
    const key = dateKey(now);
    const a = schedule[employeeId]?.[key];
    if (!a || a === "libur") return { ok: false, reason: a === "libur" ? "Hari ini jadwal Anda libur." : "Anda belum mengambil shift untuk hari ini." };
    if (todayRecord(employeeId)) return { ok: false, reason: "Anda sudah absen masuk hari ini." };
    const { start, end } = shiftBounds(key, a);
    const opens = subMinutes(start, OPEN_BEFORE_MIN);
    if (isBefore(now, opens)) return { ok: false, reason: `Absen masuk dibuka pukul ${format(opens, "HH:mm")}.`, shift: a };
    if (isAfter(now, end)) return { ok: false, reason: "Shift hari ini sudah berakhir.", shift: a };
    return { ok: true, shift: a };
  };

  const checkIn = (employeeId: string, method: Method, photo?: string) => {
    const chk = canCheckIn(employeeId);
    if (!chk.ok || !chk.shift) return;
    const key = dateKey(now);
    const { start } = shiftBounds(key, chk.shift);
    const late = differenceInMinutes(now, start) > LATE_AFTER_MIN;
    setRecords((r) => [
      ...r,
      { id: `r-${Date.now()}`, employeeId, date: key, shift: chk.shift!, checkIn: now.toISOString(), method, photo, status: late ? "terlambat" : "tepat" },
    ]);
  };

  const canCheckOut: Store["canCheckOut"] = (employeeId) => {
    const rec = openRecord(employeeId);
    if (!rec) return { ok: false, reason: "Belum ada absen masuk.", ended: false };
    const { end } = shiftBounds(rec.date, rec.shift);
    if (isBefore(now, end)) return { ok: false, reason: `Check-out dibuka setelah jam kerja berakhir pukul ${format(end, "HH:mm")}.`, ended: false };
    return { ok: true, ended: true };
  };

  const checkOut = (employeeId: string, method: Method) => {
    const rec = openRecord(employeeId);
    if (!rec || !canCheckOut(employeeId).ok) return;
    setRecords((rs) => rs.map((r) => (r.id === rec.id ? { ...r, checkOut: now.toISOString(), outMethod: method } : r)));
  };

  const value: Store = {
    now,
    setOffsetTo,
    simulated: offset !== 0,
    employees: EMPLOYEES,
    schedule,
    assign,
    countFor,
    records,
    openRecord,
    todayRecord,
    canCheckIn,
    checkIn,
    canCheckOut,
    checkOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return c;
}
