"use client";

import { useState, useEffect } from "react";
import { generateCustomExcel } from "../../admin/lib/excel-utils";
import {
  CalendarOffIcon,
  ClockIcon,
  DownloadIcon,
} from "@/app/components/icons/LibraryIcons";

export default function LaporanAbsensi() {
  const [loading, setLoading] = useState(true);

  // ==============================================================
  // 🔥 MENGGUNAKAN ZONA WAKTU JAKARTA SECARA PAKSA BUKAN UTC (ANTI-TIME TRAVEL BUG)
  // ==============================================================
  const getWIBDate = () => {
    const d = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayDate = getWIBDate();

  // STATE UI & TABEL PENCARIAN HARIAN
  const [searchDate, setSearchDate] = useState(todayDate);
  const [dataAbsenHarian, setDataAbsenHarian] = useState<any[]>([]);
  const [loadingHarian, setLoadingHarian] = useState(false);

  // STATE EXCEL (Rentang Tanggal Bebas)
  // Default: Dari tanggal 1 awal bulan ini, sampai hari ini
  const firstDayOfMonth = todayDate.slice(0, 8) + "01";
  const [exportStartDate, setExportStartDate] = useState(firstDayOfMonth);
  const [exportEndDate, setExportEndDate] = useState(todayDate);
  const [downloadRole, setDownloadRole] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // STATE HARI LIBUR & JAM OPERASIONAL
  const [liburList, setLiburList] = useState<any[]>([]);
  const [tglLibur, setTglLibur] = useState("");
  const [ketLibur, setKetLibur] = useState("");
  const [sesiWaktu, setSesiWaktu] = useState<any[]>([]);
  const [loadingSesi, setLoadingSesi] = useState(false);

  // Fungsi ini sekarang 100x Lebih Ringan karena tidak mengunduh data anggota!
  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [resLibur, resSesi] = await Promise.all([
        fetch("/api/libur"),
        fetch("/api/pengaturan-sesi"),
      ]);

      const jsonLibur = await resLibur.json();
      const jsonSesi = await resSesi.json();

      if (jsonLibur.success) setLiburList(jsonLibur.data);
      if (jsonSesi.success) setSesiWaktu(jsonSesi.data);
    } catch (error) {
      console.error("Gagal menarik master data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    const fetchHarian = async () => {
      setLoadingHarian(true);
      try {
        const res = await fetch(`/api/laporan?date=${searchDate}`);
        const json = await res.json();
        if (json.success) {
          setDataAbsenHarian(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHarian(false);
      }
    };
    fetchHarian();
  }, [searchDate]);

  // ==============================================================
  // 3. EXCEL GENERATOR (RENTANG TANGGAL BEBAS & LAZY LOADING)
  // ==============================================================
  const handleDownloadExcel = async () => {
    if (exportStartDate > exportEndDate) {
      alert("Tanggal Mulai tidak boleh lebih besar dari Tanggal Akhir!");
      return;
    }

    setIsExporting(true);
    try {
      // 1. Tarik Data Kunjungan Terlebih Dahulu
      const resAbsen = await fetch(
        `/api/laporan?startDate=${exportStartDate}&endDate=${exportEndDate}&isExport=true`,
      );
      const jsonAbsen = await resAbsen.json();

      if (!jsonAbsen.success || jsonAbsen.data.length === 0) {
        alert("Tidak ada data kunjungan pada rentang tanggal tersebut.");
        setIsExporting(false); // Menghentikan loading
        return;
      }

      // 🔥 2. LAZY LOAD: Tarik Master Data Anggota BARU SAAT EXCEL MAU DIBUAT
      // Ini membuat halaman utama sangat ringan di awal!
      const resAnggota = await fetch("/api/anggota?limit=10000");
      const jsonAnggota = await resAnggota.json();
      const anggotaMaster: any[] = jsonAnggota.data || [];

      // 3. Filter Kategori Role
      const anggotaSesuaiKategori = anggotaMaster.filter((a) =>
        downloadRole === "all" ? true : a.role === downloadRole,
      );

      if (anggotaSesuaiKategori.length === 0) {
        alert("Belum ada data anggota yang terdaftar di kategori ini.");
        setIsExporting(false);
        return;
      }

      const dataAbsenExport = jsonAbsen.data;
      const catatanKehadiran: Record<string, number> = {};

      // 4. Hitung Presensi
      dataAbsenExport.forEach((log: any) => {
        catatanKehadiran[log.id_anggota] =
          (catatanKehadiran[log.id_anggota] || 0) + 1;
      });

      // 5. Rakit ke Excel
      let finalDataExcel = anggotaSesuaiKategori.map((anggota) => {
        let rowData: any = {
          "ID Anggota": anggota.id_anggota,
          "Nama Lengkap": anggota.nama,
        };
        if (downloadRole === "all") {
          rowData["Role"] = anggota.role.toUpperCase();
          rowData["Jurusan"] = anggota.jurusan || "-";
          rowData["Batch"] = anggota.batch || "-";
        } else if (downloadRole === "student") {
          rowData["Jurusan"] = anggota.jurusan || "-";
          rowData["Batch"] = anggota.batch || "-";
        } else if (downloadRole === "lecturer") {
          rowData["Jurusan"] = anggota.jurusan || "-";
        }
        rowData["Total Kehadiran"] = catatanKehadiran[anggota.id_anggota] || 0;
        return rowData;
      });

      finalDataExcel.sort((a, b) => {
        const valA = a.Batch && a.Batch !== "-" ? parseInt(a.Batch) : 9999;
        const valB = b.Batch && b.Batch !== "-" ? parseInt(b.Batch) : 9999;
        if (valA !== valB) return valA - valB;
        return a["Nama Lengkap"].localeCompare(b["Nama Lengkap"]);
      });

      const judulFile = `Rekap_Absensi_${downloadRole.toUpperCase()}_${exportStartDate}_sd_${exportEndDate}`;
      generateCustomExcel(finalDataExcel, judulFile);
    } catch (err) {
      alert("Gagal memproses data Excel. Periksa koneksi internet Anda.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTambahLibur = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/libur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggal: tglLibur, keterangan: ketLibur }),
    });
    setTglLibur("");
    setKetLibur("");
    fetchMasterData();
  };

  const handleHapusLibur = async (id: number) => {
    await fetch(`/api/libur?id=${id}`, { method: "DELETE" });
    fetchMasterData();
  };

  const handleUpdateJamOperasional = async () => {
    setLoadingSesi(true);
    await fetch("/api/pengaturan-sesi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sesiWaktu),
    });
    setLoadingSesi(false);
    alert("Jam operasional berhasil diperbarui!");
  };

  const handleSesiChange = (id: number, field: string, value: string) => {
    setSesiWaktu((prev) =>
      prev.map((sesi) => (sesi.id === id ? { ...sesi, [field]: value } : sesi)),
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 w-full text-slate-800">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-blue-800">LAPORAN & REKAP</h1>
          <p className="text-slate-500 text-xs mt-1">
            Unduh laporan akumulasi absensi berdasarkan periode.
          </p>
        </div>

        {/* KOTAK MENU DOWNLOAD (RENTANG TANGGAL) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 w-full xl:w-auto flex-wrap">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider hidden sm:block">
            Ekspor:
          </span>

          <select
            value={downloadRole}
            onChange={(e) => setDownloadRole(e.target.value)}
            className="w-full sm:w-auto bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="student">Mahasiswa</option>
            <option value="lecturer">Dosen</option>
            <option value="staff">Staff</option>
          </select>

          {/* INPUT RENTANG TANGGAL */}
          <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-2 py-1">
            <input
              type="date"
              title="Dari Tanggal"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            />
            <span className="text-emerald-300 font-bold">-</span>
            <input
              type="date"
              title="Sampai Tanggal"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleDownloadExcel}
            disabled={isExporting || loading}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? (
              "Memproses..."
            ) : (
              <>
                <DownloadIcon className="w-4 h-4" />
                Unduh Excel
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KOLOM KIRI (HARI LIBUR & JAM OPERASIONAL) */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-[550px]">
          {/* KOTAK 1: HARI LIBUR */}
          <div className="bg-white border border-rose-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-3 border-b border-rose-100 bg-rose-50">
              <h2 className="text-xs font-bold text-rose-700 flex items-center gap-2">
                <CalendarOffIcon className="w-4 h-4" />
                Pengaturan Hari Libur
              </h2>
            </div>
            <div className="p-3 border-b border-slate-100">
              <form onSubmit={handleTambahLibur} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={tglLibur}
                    onChange={(e) => setTglLibur(e.target.value)}
                    className="w-1/3 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Keterangan"
                    value={ketLibur}
                    onChange={(e) => setKetLibur(e.target.value)}
                    className="w-2/3 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Tambah Libur
                </button>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {liburList.map((l) => (
                <div
                  key={l.id}
                  className="flex justify-between items-center bg-rose-50 p-2 rounded-lg border border-rose-100"
                >
                  <div>
                    <p className="text-[10px] font-bold text-rose-700">
                      {new Date(l.tanggal).toLocaleDateString("id-ID")}
                    </p>
                    <p className="text-[9px] text-rose-500">{l.keterangan}</p>
                  </div>
                  <button
                    onClick={() => handleHapusLibur(l.id)}
                    className="text-[9px] bg-white text-rose-600 px-2 py-1 rounded-md border border-rose-200 font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* KOTAK 2: JAM OPERASIONAL */}
          <div className="bg-white border border-blue-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-3 border-b border-blue-100 bg-blue-50">
              <h2 className="text-xs font-bold text-blue-700 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Jam Operasional Sesi
              </h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {sesiWaktu.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center">
                  Memuat...
                </p>
              ) : (
                sesiWaktu.map((sesi) => (
                  <div
                    key={sesi.id}
                    className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                  >
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {sesi.nama_sesi}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={sesi.jam_mulai}
                        onChange={(e) =>
                          handleSesiChange(sesi.id, "jam_mulai", e.target.value)
                        }
                        className="flex-1 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <input
                        type="time"
                        value={sesi.jam_selesai}
                        onChange={(e) =>
                          handleSesiChange(
                            sesi.id,
                            "jam_selesai",
                            e.target.value,
                          )
                        }
                        className="flex-1 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleUpdateJamOperasional}
                disabled={loadingSesi}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {loadingSesi ? "Menyimpan..." : "Simpan Jam Operasional"}
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: PENCARIAN PINTAR & TABEL DATA HARIAN */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Pencarian Pintar Harian
              </h2>
              <p className="text-[10px] text-slate-500">
                Lihat log siapa saja yang datang di hari tertentu.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-300 rounded-xl shadow-sm">
              <span className="text-lg ml-1">📅</span>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-blue-700 outline-none pr-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 bg-white">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold">Jam Kunjungan</th>
                  <th className="px-4 py-3 font-semibold">ID / Nama Lengkap</th>
                  <th className="px-4 py-3 font-semibold text-center">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHarian ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-500 text-xs"
                    >
                      Mencari data kunjungan hari tersebut...
                    </td>
                  </tr>
                ) : dataAbsenHarian.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <div className="text-4xl mb-2">🏜️</div>
                      <p className="text-slate-500 text-sm font-bold">
                        Tidak ada kunjungan
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Belum ada yang absensi pada tanggal ini.
                      </p>
                    </td>
                  </tr>
                ) : (
                  dataAbsenHarian.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-blue-700 font-bold text-sm bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {new Date(log.waktu).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 text-sm">
                          {log.nama}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {log.id_anggota}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${log.role === "student" ? "bg-blue-50 text-blue-600 border-blue-200" : log.role === "lecturer" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-purple-50 text-purple-600 border-purple-200"}`}
                        >
                          {log.role}
                        </span>
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
