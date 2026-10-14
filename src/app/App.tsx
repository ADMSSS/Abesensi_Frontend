import { useState } from "react";
import { Toaster } from "sonner";
import { StoreProvider, useStore, type Session } from "./store";
import { AuthPage } from "./components/AuthPage";
import { Shell, type Page } from "./components/Shell";
import { Dasbor } from "./components/Dasbor";
import { Absensi } from "./components/Absensi";
import { Riwayat } from "./components/Riwayat";

function Root() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<Page>("dasbor");
  const { setOffsetTo } = useStore();

  if (!session) {
    return <AuthPage onAuth={(s) => { setPage("dasbor"); setSession(s); }} />;
  }

  const logout = () => {
    setOffsetTo(null);
    setSession(null);
  };

  return (
    <Shell session={session} page={page} onNavigate={setPage} onLogout={logout}>
      {page === "dasbor" && <Dasbor session={session} onNavigate={setPage} />}
      {page === "absensi" && <Absensi session={session} onNavigate={setPage} />}
      {page === "riwayat" && <Riwayat session={session} />}
    </Shell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
      <Toaster position="top-center" richColors closeButton />
    </StoreProvider>
  );
}
