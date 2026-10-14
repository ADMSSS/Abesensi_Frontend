import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, HardHat } from "lucide-react";
import { ACCOUNTS, type Session } from "../store";

type Mode = "masuk" | "daftar";

export function Wordmark({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight leading-none ${className}`}>
      Hadir<span className={dark ? "text-accent" : "bg-foreground text-accent px-1.5 ml-0.5 rounded-sm"}>In</span>
    </span>
  );
}

export function AuthPage({ onAuth }: { onAuth: (s: Session) => void }) {
  const [mode, setMode] = useState<Mode>("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const mail = email.trim().toLowerCase();
    if (mode === "daftar" && !name.trim()) return setError("Nama lengkap wajib diisi.");
    if (!mail || !password) return setError("Email dan kata sandi wajib diisi.");
    if (mode === "masuk") {
      const acc = ACCOUNTS.find((a) => a.email === mail && a.password === password);
      if (!acc) return setError("Email atau kata sandi salah. Coba akun demo di bawah.");
      const { password: _p, ...session } = acc;
      return onAuth(session);
    }
    if (password.length < 6) return setError("Kata sandi minimal 6 karakter.");
    const isAdmin = mail.startsWith("admin");
    const base = ACCOUNTS.find((a) => a.role === (isAdmin ? "admin" : "pekerja"))!;
    onAuth({ role: base.role, employeeId: base.employeeId, email: mail, name: name.trim() });
  };

  const fill = (i: number) => {
    setMode("masuk");
    setEmail(ACCOUNTS[i].email);
    setPassword(ACCOUNTS[i].password);
    setError("");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative bg-accent text-foreground overflow-hidden px-8 py-10 lg:px-14 lg:py-14 flex flex-col justify-between min-h-[320px]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, #111611 0 2px, transparent 2px 28px)" }}
        />
        <div className="relative flex items-center justify-between">
          <Wordmark className="text-4xl" />
          <span className="font-mono text-xs uppercase tracking-widest border border-foreground rounded-full px-3 py-1">
            Absensi Karyawan
          </span>
        </div>

        <div className="relative my-10 lg:my-0">
          <p className="font-mono text-xs uppercase tracking-[0.25em] mb-4">Masuk tepat waktu. Pulang tercatat.</p>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            Satu ketukan,
            <br />
            kehadiran
            <br />
            <span className="inline-block bg-foreground text-accent px-3 -rotate-1 mt-1">terbukti.</span>
          </h1>
        </div>

        <div className="relative hidden lg:grid grid-cols-3 gap-0 border-t-2 border-foreground pt-5 font-mono text-xs uppercase tracking-wider">
          <div>
            <div className="font-display text-3xl font-extrabold normal-case tracking-tight">QR</div>
            Scan cepat
          </div>
          <div>
            <div className="font-display text-3xl font-extrabold normal-case tracking-tight">Kamera</div>
            Verifikasi wajah
          </div>
          <div>
            <div className="font-display text-3xl font-extrabold normal-case tracking-tight">2 Shift</div>
            Pagi &amp; malam
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-md">
          <div
            role="tablist"
            aria-label="Pilih mode"
            className="grid grid-cols-2 border-2 border-foreground rounded-md overflow-hidden mb-8 font-display font-bold"
          >
            {(["masuk", "daftar"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`py-3 capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] ${
                  mode === m ? "bg-foreground text-accent" : "bg-card hover:bg-secondary"
                }`}
              >
                {m === "masuk" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            {mode === "masuk" ? "Selamat datang kembali" : "Buat akun HadirIn"}
          </h2>
          <p className="text-muted-foreground mt-1 mb-6">
            {mode === "masuk"
              ? "Masuk untuk absen atau memantau kehadiran tim."
              : "Gunakan email berawalan “admin” untuk mendaftar sebagai Admin."}
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "daftar" && (
              <Field label="Nama lengkap">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dewi Lestari"
                  className="w-full bg-transparent outline-none"
                  autoComplete="name"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.id"
                className="w-full bg-transparent outline-none"
                autoComplete="email"
              />
            </Field>
            <Field label="Kata sandi">
              <div className="flex items-center gap-2">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-transparent outline-none"
                  autoComplete={mode === "masuk" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive border-l-4 border-destructive pl-3 py-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="group w-full flex items-center justify-between bg-foreground text-accent font-display font-bold text-lg px-5 py-4 rounded-md shadow-[4px_4px_0_0_#c9f23c] border-2 border-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {mode === "masuk" ? "Masuk" : "Daftar & Masuk"}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Akun demo (klik untuk mengisi)
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <DemoChip
                icon={<ShieldCheck className="w-4 h-4" />}
                title="Admin"
                mail={ACCOUNTS[0].email}
                pass={ACCOUNTS[0].password}
                onClick={() => fill(0)}
              />
              <DemoChip
                icon={<HardHat className="w-4 h-4" />}
                title="Pekerja"
                mail={ACCOUNTS[1].email}
                pass={ACCOUNTS[1].password}
                onClick={() => fill(1)}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="mt-1.5 border-2 border-foreground rounded-md bg-card px-4 py-3 focus-within:shadow-[4px_4px_0_0_#c9f23c] focus-within:-translate-y-px transition-all">
        {children}
      </div>
    </label>
  );
}

function DemoChip({
  icon,
  title,
  mail,
  pass,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  mail: string;
  pass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left border border-foreground/40 border-dashed rounded-md p-3 bg-card hover:bg-accent hover:border-solid hover:border-foreground transition-colors"
    >
      <span className="flex items-center gap-2 font-display font-bold">
        {icon}
        {title}
      </span>
      <span className="block font-mono text-xs mt-1.5 break-all">{mail}</span>
      <span className="block font-mono text-xs text-muted-foreground">{pass}</span>
    </button>
  );
}
