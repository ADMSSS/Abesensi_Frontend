import { useEffect, useRef, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { Camera, CameraOff, CheckCircle2, LogOut, QrCode as QrIcon, ScanLine, Smartphone, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { QrCode } from "./QrCode";
import { SHIFTS, dateKey, shiftBounds, useStore, type Method, type Session } from "../store";
import type { Page } from "./Shell";

const QR_LIFETIME = 30;

function QrMethod({ mode, onConfirm }: { mode: "masuk" | "keluar"; onConfirm: () => void }) {
  const [round, setRound] = useState(1);
  const [left, setLeft] = useState(QR_LIFETIME);
  useEffect(() => {
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRound((r) => r + 1);
          return QR_LIFETIME;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-center">
      <div className="relative mx-auto">
        <div className="border-2 border-foreground p-3 bg-white rounded-md shadow-[6px_6px_0_0_#c9f23c]">
          <QrCode value={`hadirin-${mode}-${round}`} size={220} />
        </div>
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden" aria-hidden>
          <div className="h-full bg-foreground transition-all duration-1000 ease-linear" style={{ width: `${(left / QR_LIFETIME) * 100}%` }} />
        </div>
        <p className="font-mono text-xs text-center mt-1.5 text-muted-foreground">
          Kode diperbarui dalam {left} detik
        </p>
      </div>

      <div>
        <h3 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Smartphone className="w-6 h-6" /> Scan kode QR ini
        </h3>
        <ol className="mt-3 space-y-2 text-muted-foreground list-decimal list-inside">
          <li>Buka kamera atau aplikasi pemindai di ponsel Anda.</li>
          <li>Arahkan ke kode QR di samping hingga terbaca.</li>
          <li>Konfirmasi absen {mode} di ponsel Anda.</li>
        </ol>
        <button
          onClick={onConfirm}
          className="mt-5 flex items-center gap-2 bg-foreground text-accent font-display font-bold px-5 py-3 rounded-md border-2 border-foreground shadow-[4px_4px_0_0_#c9f23c] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all"
        >
          <ScanLine className="w-5 h-5" />
          Simulasikan scan berhasil
        </button>
        <p className="text-xs text-muted-foreground mt-2">Mode contoh: tombol ini menggantikan pemindaian dari ponsel.</p>
      </div>
    </div>
  );
}

function CameraMethod({ mode, onConfirm }: { mode: "masuk" | "keluar"; onConfirm: (photo?: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"memuat" | "aktif" | "gagal">("memuat");

  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("gagal");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setState("aktif");
      })
      .catch(() => !cancelled && setState("gagal"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v || state !== "aktif" || !v.videoWidth) return onConfirm();
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = Math.round((160 * v.videoHeight) / v.videoWidth);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    onConfirm(c.toDataURL("image/jpeg", 0.6));
  };

  return (
    <div className="grid sm:grid-cols-[minmax(0,420px)_1fr] gap-8 items-center">
      <div className="relative aspect-[4/3] bg-foreground rounded-md overflow-hidden border-2 border-foreground shadow-[6px_6px_0_0_#c9f23c]">
        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover -scale-x-100 ${state === "aktif" ? "" : "hidden"}`} />
        {state !== "aktif" && (
          <div className="absolute inset-0 grid place-items-center text-center p-6 text-background">
            {state === "memuat" ? (
              <p className="font-mono text-sm">Menyalakan kamera…</p>
            ) : (
              <div>
                <CameraOff className="w-10 h-10 mx-auto mb-3 text-accent" />
                <p className="font-bold">Kamera tidak tersedia</p>
                <p className="text-sm opacity-70 mt-1">Izinkan akses kamera di browser, atau lanjutkan dengan mode contoh.</p>
              </div>
            )}
          </div>
        )}
        <div aria-hidden className="absolute inset-[14%] border-2 border-accent rounded-[40%] pointer-events-none" />
        {state === "aktif" && <div aria-hidden className="hadirin-scan absolute inset-x-[14%] h-0.5 bg-accent shadow-[0_0_12px_#c9f23c]" />}
      </div>

      <div>
        <h3 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Camera className="w-6 h-6" /> Absen dengan kamera
        </h3>
        <p className="mt-3 text-muted-foreground">
          Posisikan wajah di dalam bingkai dengan pencahayaan cukup, lalu ambil foto untuk mencatat absen {mode}.
        </p>
        <button
          onClick={capture}
          className="mt-5 flex items-center gap-2 bg-foreground text-accent font-display font-bold px-5 py-3 rounded-md border-2 border-foreground shadow-[4px_4px_0_0_#c9f23c] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all"
        >
          <Camera className="w-5 h-5" />
          {state === "aktif" ? `Ambil foto & absen ${mode}` : "Lanjutkan (mode contoh)"}
        </button>
      </div>
    </div>
  );
}

function Flow({ mode, onDone }: { mode: "masuk" | "keluar"; onDone: (method: Method, photo?: string) => void }) {
  const [method, setMethod] = useState<Method>("qr");
  return (
    <div className="border-2 border-foreground rounded-md bg-card">
      <div role="tablist" aria-label="Metode absen" className="grid grid-cols-2 border-b-2 border-foreground">
        {([
          { id: "qr", label: "Scan QR", icon: QrIcon },
          { id: "kamera", label: "Kamera", icon: Camera },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={method === id}
            onClick={() => setMethod(id)}
            className={`flex items-center justify-center gap-2 py-3.5 font-display font-bold transition-colors ${
              method === id ? "bg-foreground text-accent" : "hover:bg-secondary"
            } ${id === "qr" ? "border-r-2 border-foreground" : ""}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
      <div className="p-6 sm:p-8">
        {method === "qr" ? (
          <QrMethod mode={mode} onConfirm={() => onDone("qr")} />
        ) : (
          <CameraMethod mode={mode} onConfirm={(p) => onDone("kamera", p)} />
        )}
      </div>
    </div>
  );
}

function WorkerAbsensi({ session, onNavigate }: { session: Session; onNavigate: (p: Page) => void }) {
  const { now, schedule, openRecord, todayRecord, canCheckIn, checkIn, canCheckOut, checkOut } = useStore();
  const eid = session.employeeId;
  const open = openRecord(eid);
  const today = todayRecord(eid);
  const myShift = schedule[eid]?.[dateKey(now)];
  const inChk = canCheckIn(eid);
  const outChk = canCheckOut(eid);

  const doIn = (method: Method, photo?: string) => {
    checkIn(eid, method, photo);
    toast.success(`Absen masuk tercatat pukul ${format(now, "HH:mm")}`);
  };
  const doOut = (method: Method) => {
    checkOut(eid, method);
    toast.success(`Check-out tercatat pukul ${format(now, "HH:mm")}. Terima kasih!`);
  };

  if (open) {
    const { end } = shiftBounds(open.date, open.shift);
    const mins = Math.max(0, differenceInMinutes(now, new Date(open.checkIn)));
    return (
      <div className="space-y-6">
        <div className={`border-2 border-foreground rounded-md p-5 sm:p-6 ${outChk.ok ? "bg-destructive text-destructive-foreground" : "bg-accent"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em]">{SHIFTS[open.shift].label} · masuk {format(new Date(open.checkIn), "HH:mm")}</p>
              <p className="font-display text-3xl font-extrabold mt-1">
                {outChk.ok ? "Jam kerja sudah selesai — saatnya absen keluar." : "Anda sedang bekerja."}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-4xl font-extrabold tabular-nums">
                {Math.floor(mins / 60)}j {String(mins % 60).padStart(2, "0")}m
              </p>
              <p className="font-mono text-xs uppercase tracking-widest">Durasi kerja</p>
            </div>
          </div>
        </div>

        {outChk.ok ? (
          <Flow mode="keluar" onDone={(m) => doOut(m)} />
        ) : (
          <div className="border-2 border-dashed border-foreground/50 rounded-md p-8 text-center">
            <LogOut className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="font-display font-bold text-xl mt-3">Check-out belum dibuka</p>
            <p className="text-muted-foreground mt-1">
              {outChk.reason} Shift berakhir pukul {format(end, "HH:mm")}.
            </p>
            <p className="text-xs text-muted-foreground mt-3">Coba “Ke akhir shift” pada panel simulasi waktu di atas.</p>
          </div>
        )}
      </div>
    );
  }

  if (today?.checkOut) {
    const mins = differenceInMinutes(new Date(today.checkOut), new Date(today.checkIn));
    return (
      <div className="border-2 border-foreground rounded-md bg-card p-8 text-center shadow-[6px_6px_0_0_#c9f23c]">
        <CheckCircle2 className="w-12 h-12 mx-auto" />
        <h2 className="font-display text-3xl font-extrabold mt-3">Absensi hari ini lengkap</h2>
        <div className="grid grid-cols-3 max-w-md mx-auto mt-6 border-t-2 border-foreground pt-4">
          {[
            ["Masuk", format(new Date(today.checkIn), "HH:mm")],
            ["Keluar", format(new Date(today.checkOut), "HH:mm")],
            ["Durasi", `${Math.floor(mins / 60)}j ${mins % 60}m`],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="font-display text-2xl font-extrabold tabular-nums">{v}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("riwayat")} className="mt-6 underline underline-offset-4 font-bold hover:text-muted-foreground">
          Lihat di riwayat
        </button>
      </div>
    );
  }

  if (!inChk.ok) {
    return (
      <div className="border-2 border-dashed border-foreground/50 rounded-md p-8 text-center">
        <TimerReset className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="font-display font-bold text-xl mt-3">Belum bisa absen masuk</p>
        <p className="text-muted-foreground mt-1">{inChk.reason}</p>
        {!myShift && (
          <button
            onClick={() => onNavigate("dasbor")}
            className="mt-5 bg-accent border-2 border-foreground rounded-md px-4 py-2 font-display font-bold hover:bg-foreground hover:text-accent transition-colors"
          >
            Ambil shift di Dasbor
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-foreground rounded-md bg-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Jadwal hari ini</p>
          <p className="font-display text-2xl font-extrabold">
            {SHIFTS[inChk.shift!].label} · {SHIFTS[inChk.shift!].start}–{SHIFTS[inChk.shift!].end}
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest bg-secondary px-2.5 py-1 rounded-sm">Pilih metode absen masuk</p>
      </div>
      <Flow mode="masuk" onDone={doIn} />
    </div>
  );
}

function AdminAbsensi() {
  const { now, employees, schedule, records } = useStore();
  const key = dateKey(now);
  const rows = employees.map((e) => {
    const a = schedule[e.id]?.[key];
    const rec = [...records].reverse().find((r) => r.employeeId === e.id && (r.date === key || !r.checkOut));
    let status: "Bekerja" | "Selesai" | "Belum hadir" | "Libur" = "Belum hadir";
    if (rec?.checkOut) status = "Selesai";
    else if (rec) status = "Bekerja";
    else if (a === "libur" || !a) status = "Libur";
    return { e, a, rec, status };
  });
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const tone: Record<string, string> = {
    Bekerja: "bg-accent border-foreground",
    Selesai: "bg-foreground text-background border-foreground",
    "Belum hadir": "bg-destructive text-destructive-foreground border-foreground",
    Libur: "bg-secondary border-foreground/40",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {["Bekerja", "Selesai", "Belum hadir", "Libur"].map((s) => (
          <div key={s} className={`border-2 rounded-md p-4 ${tone[s]}`}>
            <p className="font-display text-4xl font-extrabold tabular-nums">{count(s)}</p>
            <p className="font-mono text-[11px] uppercase tracking-widest">{s}</p>
          </div>
        ))}
      </div>

      <div className="border-2 border-foreground rounded-md bg-card overflow-x-auto no-scrollbar">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-foreground text-background font-mono text-[11px] uppercase tracking-widest">
              {["Karyawan", "Shift", "Masuk", "Keluar", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, a, rec, status }) => (
              <tr key={e.id} className="border-t border-border hover:bg-accent/20">
                <td className="px-4 py-3">
                  <p className="font-bold leading-tight">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.position}</p>
                </td>
                <td className="px-4 py-3 capitalize">{a && a !== "libur" ? a : "—"}</td>
                <td className="px-4 py-3 font-mono">{rec ? format(new Date(rec.checkIn), "HH:mm") : "—"}</td>
                <td className="px-4 py-3 font-mono">{rec?.checkOut ? format(new Date(rec.checkOut), "HH:mm") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block font-mono text-[11px] uppercase tracking-wider px-2 py-1 rounded-sm border ${tone[status]}`}>{status}</span>
                  {rec?.status === "terlambat" && <span className="ml-2 text-xs text-destructive font-bold">terlambat</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Absensi({ session, onNavigate }: { session: Session; onNavigate: (p: Page) => void }) {
  const isAdmin = session.role === "admin";
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {isAdmin ? "Kehadiran hari ini" : "Absen masuk & keluar"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">Absensi</h1>
      </div>
      {isAdmin ? <AdminAbsensi /> : <WorkerAbsensi session={session} onNavigate={onNavigate} />}
    </div>
  );
}
