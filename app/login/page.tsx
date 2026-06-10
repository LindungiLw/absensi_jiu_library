"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect & Refresh agar cookie terbaca di sisi server
        router.push("/admin");
        router.refresh();
      } else {
        // Pesan error dari API sudah disamarkan
        setError(data.error || "Login gagal, silakan coba lagi.");
      }
    } catch (err) {
      setError("Koneksi ke server terputus.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-100/60 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xl z-10 relative">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-blue-800 tracking-tight">
            JIU ADMIN
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Verifikasi identitas Anda
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email" // Penting untuk browser
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="Email Admin..."
            className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 py-4 text-center font-mono text-base tracking-wide outline-none text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
          />

          <input
            type="password"
            required
            autoComplete="current-password" // Penting untuk browser
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="Password..."
            className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 py-4 text-center font-mono text-xl tracking-widest outline-none text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
          />

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl text-center animate-in fade-in shadow-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-70 mt-2 active:scale-[0.98]"
          >
            {loading ? "Memverifikasi..." : "Login ke Command Center"}
          </button>
        </form>
      </div>
    </main>
  );
}
