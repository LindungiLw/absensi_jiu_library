"use client";

import { useState, useEffect } from "react";

interface Petugas {
  id: number;
  username: string;
  pin: string;
  lastOpenedAt: string | null;
}

export default function PengaturanKiosk() {
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // State Form Input Manual
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ambil Data dari API
  const fetchPetugas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/petugas");
      const json = await res.json();
      if (json.success) setPetugasList(json.data);
    } catch (err) {
      setNotif({ type: "error", msg: "Gagal menyambung ke database server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetugas();
  }, []);

  // Proses Pendaftaran Petugas Baru
  const handleTambahPetugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || pin.length !== 6) {
      setNotif({
        type: "error",
        msg: "Username valid & 6-Digit PIN wajib diisi!",
      });
      return;
    }
    setSubmitting(true);
    setNotif(null);

    try {
      const res = await fetch("/api/petugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();

      if (res.ok) {
        setNotif({ type: "success", msg: data.message });
        setUsername("");
        setPin("");
        fetchPetugas();
      } else {
        setNotif({ type: "error", msg: data.error });
      }
    } catch (err) {
      setNotif({ type: "error", msg: "Koneksi sistem bermasalah." });
    } finally {
      setSubmitting(false);
    }
  };

  // Proses Penghapusan Akun Petugas
  const handleHapusPetugas = async (id: number, user: string) => {
    const konfirmasi = window.confirm(
      `Cabut izin akses dan hapus akun petugas "${user}"?`,
    );
    if (!konfirmasi) return;

    try {
      const res = await fetch(`/api/petugas?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotif({ type: "success", msg: data.message });
        fetchPetugas();
      } else {
        setNotif({ type: "error", msg: data.error });
      }
    } catch (err) {
      setNotif({ type: "error", msg: "Gagal memproses penghapusan." });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 w-full text-slate-800 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <h1 className="text-2xl font-black text-blue-800">
            PENGATURAN PIN STASIUN KIOSK
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Kelola akun dan PIN otoritas pembuka mesin scanner presensi.
          </p>
        </div>
        {notif && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold ${notif.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}
          >
            {notif.msg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FORM KIRI: BUAT AKUN PETUGAS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            🔑 Tambah Otoritas Kiosk
          </h2>
          <form onSubmit={handleTambahPetugas} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-0.5">
                Username / ID Staf
              </label>
              <input
                type="text"
                required
                placeholder="Cth: petugas_pagi atau email"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all text-slate-800 shadow-inner"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-0.5">
                PIN Otoritas (6 Digit Angka)
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-center font-mono text-xl tracking-widest outline-none focus:border-blue-500 transition-all text-slate-800 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || pin.length !== 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              {submitting ? "Menyimpan..." : "+ Daftarkan Petugas"}
            </button>
          </form>
        </div>

        {/* TABEL KANAN: LIST MONITORING REAL-TIME */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Daftar Aktif Petugas Kiosk
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-200 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Username</th>
                  <th className="px-6 py-3.5 text-center">PIN Aktif</th>
                  <th className="px-6 py-3.5">Terakhir Aktif Membuka</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-6 text-center text-slate-400 animate-pulse"
                    >
                      Memuat data dari database...
                    </td>
                  </tr>
                ) : petugasList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-6 text-center text-slate-400 italic"
                    >
                      Belum ada akun petugas terdaftar. Kiosk terkunci penuh.
                    </td>
                  </tr>
                ) : (
                  petugasList.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-blue-700 font-bold font-mono">
                        {p.username}
                      </td>
                      <td className="px-6 py-3.5 text-center font-mono tracking-widest text-slate-400 font-bold">
                        ••••••
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono">
                        {p.lastOpenedAt ? (
                          new Date(p.lastOpenedAt).toLocaleString("id-ID")
                        ) : (
                          <span className="text-slate-300 italic">
                            Belum pernah masuk
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handleHapusPetugas(p.id, p.username)}
                          className="px-2.5 py-1 text-[11px] bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-600 hover:text-white transition-all font-bold"
                        >
                          Cabut Akses
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
