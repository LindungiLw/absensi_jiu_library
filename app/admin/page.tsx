"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  ChartIcon,
  UsersIcon,
  ReportIcon,
} from "../components/icons/LibraryIcons";

// Menyimpan semua hasil kalkulasi grafik dan total angka agar instan saat bolak-balik menu
let globalDashboardCache: any = null;

export default function DashboardUtama() {
  const [chartData1W, setChartData1W] = useState<any[]>([]);
  const [chartData1M, setChartData1M] = useState<any[]>([]);
  const [chartData6M, setChartData6M] = useState<any[]>([]);

  // State Kunjungan Hari Ini
  const [totalHadir, setTotalHadir] = useState(0);
  const [hadirMahasiswa, setHadirMahasiswa] = useState(0);
  const [hadirStaff, setHadirStaff] = useState(0);

  // State Total Anggota Terdaftar di Database
  const [totalStudentReg, setTotalStudentReg] = useState(0);
  const [totalLecturerReg, setTotalLecturerReg] = useState(0);
  const [totalStaffReg, setTotalStaffReg] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Jeda 50ms agar CSS Grid selesai digambar browser (mencegah bug Recharts)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  //  Fungsi tarik data dengan parameter "forceRefresh"
  const fetchDashboardData = async (forceRefresh = false) => {
    // 1. CEK GLOBAL CACHE: Jika data sudah ada dan tidak dipaksa refresh, pakai cache!
    if (!forceRefresh && globalDashboardCache) {
      const cache = globalDashboardCache;
      setTotalHadir(cache.totalHadir);
      setHadirMahasiswa(cache.hadirMahasiswa);
      setHadirStaff(cache.hadirStaff);

      setTotalStudentReg(cache.totalStudentReg);
      setTotalLecturerReg(cache.totalLecturerReg);
      setTotalStaffReg(cache.totalStaffReg);

      setChartData1W(cache.chartData1W);
      setChartData1M(cache.chartData1M);
      setChartData6M(cache.chartData6M);

      setLastUpdated(cache.lastUpdated);
      setLoading(false);
      return; // Stop di sini, tidak perlu tembak API database lagi
    }

    setLoading(true);
    try {
      // HANYA PANGGIL API JIKA CACHE KOSONG ATAU TOMBOL REFRESH DITEKAN
      const res = await fetch("/api/dashboard");
      const json = await res.json();

      if (json.success) {
        const dashboardData = json.data;

        // SET STATE KUNJUNGAN HARI INI
        const tHadir = dashboardData.hariIni.total;
        const hMhs = dashboardData.hariIni.mahasiswa;
        const hStaff = dashboardData.hariIni.staff;
        setTotalHadir(tHadir);
        setHadirMahasiswa(hMhs);
        setHadirStaff(hStaff);

        // SET STATE TOTAL ANGGOTA DATABASE
        const tStudent = dashboardData.database.student;
        const tLecturer = dashboardData.database.lecturer;
        const tStaff = dashboardData.database.staff;
        setTotalStudentReg(tStudent);
        setTotalLecturerReg(tLecturer);
        setTotalStaffReg(tStaff);

        // PROSES GRAFIK
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(today.getDate() - 180);

        const formatDate = (date: Date) => {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const dd = String(date.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        };

        const dateMap: Record<string, number> = {};
        for (
          let d = new Date(sixMonthsAgo);
          d <= today;
          d.setDate(d.getDate() + 1)
        ) {
          dateMap[formatDate(new Date(d))] = 0;
        }

        // Timpa angka 0 dengan data asli dari database
        dashboardData.grafik.forEach((g: any) => {
          if (dateMap[g.tanggal] !== undefined) {
            dateMap[g.tanggal] = g.total;
          }
        });

        // Ubah ke format Array untuk Recharts
        const chartDataUtuh = Object.keys(dateMap)
          .sort()
          .map((date) => {
            const d = new Date(date);
            return {
              rawDate: date,
              tanggal: d.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              }),
              total: dateMap[date],
            };
          });

        const c6M = chartDataUtuh;
        const c1M = chartDataUtuh.slice(-30);
        const c1W = chartDataUtuh.slice(-7);
        setChartData6M(c6M);
        setChartData1M(c1M);
        setChartData1W(c1W);

        // UPDATE JAM TERAKHIR SINKRONISASI
        const timeUpdate = new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLastUpdated(timeUpdate);

        // 💾 SIMPAN SEMUA HASIL KE GLOBAL CACHE
        globalDashboardCache = {
          totalHadir: tHadir,
          hadirMahasiswa: hMhs,
          hadirStaff: hStaff,
          totalStudentReg: tStudent,
          totalLecturerReg: tLecturer,
          totalStaffReg: tStaff,
          chartData1W: c1W,
          chartData1M: c1M,
          chartData6M: c6M,
          lastUpdated: timeUpdate,
        };
      }
    } catch (error) {
      console.error("Gagal menarik data dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false); // Mount pertama kali: Coba pakai cache dulu
  }, []);

  const MiniChart = ({
    title,
    data,
    gradientId,
    colorHex,
  }: {
    title: string;
    data: any[];
    gradientId: string;
    colorHex: string;
  }) => (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col h-full relative overflow-hidden group hover:border-slate-300 transition-colors">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
        {title}
      </h3>
      {loading || !isMounted ? (
        <div className="flex items-center justify-center text-slate-400 font-mono text-[10px] animate-pulse h-[200px]">
          Menyiapkan visualisasi...
        </div>
      ) : (
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="99%" height={200}>
            <AreaChart
              data={data}
              margin={{ top: 5, right: 0, left: -30, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorHex} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={colorHex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="tanggal"
                stroke="#94a3b8"
                fontSize={9}
                tickMargin={8}
                minTickGap={15}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={9}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (val === 0 ? "" : val)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "10px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ color: colorHex, fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Hadir"
                stroke={colorHex}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{
                  r: 4,
                  fill: colorHex,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 w-full text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-800">DASHBOARD</h1>
          <p className="text-slate-500 text-xs mt-1">
            Data statistik absensi dan keanggotaan JIU Library.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm w-full md:w-auto">
          {lastUpdated && (
            <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
              Update: {lastUpdated} WIB
            </div>
          )}
          {/* TOMBOL REFRESH MEMAKSA SINKRONISASI KE DATABASE (forceRefresh = true) */}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Menyinkronkan..." : "🔄 Refresh Data"}
          </button>
        </div>
      </div>

      {/* BARIS 1: KUNJUNGAN HARI INI */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ChartIcon className="w-4 h-4" />
          Kunjungan Hari Ini
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full blur-[30px] pointer-events-none"></div>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              Total Hadir
            </p>
            <div className="flex items-end gap-2 relative z-10">
              <h2 className="text-4xl font-black text-slate-800 leading-none">
                {totalHadir}
              </h2>
              <span className="text-blue-600 text-xs font-bold mb-1">
                orang
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100 rounded-full blur-[30px] pointer-events-none"></div>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              Mahasiswa Hadir
            </p>
            <div className="flex items-end gap-2 relative z-10">
              <h2 className="text-4xl font-black text-slate-800 leading-none">
                {hadirMahasiswa}
              </h2>
              <span className="text-sky-600 text-xs font-bold mb-1">orang</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-[30px] pointer-events-none"></div>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              Dosen & Staff Hadir
            </p>
            <div className="flex items-end gap-2 relative z-10">
              <h2 className="text-4xl font-black text-slate-800 leading-none">
                {hadirStaff}
              </h2>
              <span className="text-indigo-600 text-xs font-bold mb-1">
                orang
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARIS 2: TOTAL ANGGOTA TERDAFTAR */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <UsersIcon className="w-4 h-4" />
          Total Anggota Database
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-emerald-300 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-[30px] pointer-events-none"></div>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              Mahasiswa Aktif
            </p>
            <div className="flex items-end gap-2 relative z-10">
              <h2 className="text-4xl font-black text-slate-800 leading-none">
                {totalStudentReg}
              </h2>
              <span className="text-emerald-600 text-xs font-bold mb-1">
                orang
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-amber-300 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-[30px] pointer-events-none"></div>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              Dosen Aktif
            </p>
            <div className="flex items-end gap-2 relative z-10">
              <h2 className="text-4xl font-black text-slate-800 leading-none">
                {totalLecturerReg}
              </h2>
              <span className="text-amber-600 text-xs font-bold mb-1">
                orang
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-purple-300 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full blur-[30px] pointer-events-none"></div>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              Staff Aktif
            </p>
            <div className="flex items-end gap-2 relative z-10">
              <h2 className="text-4xl font-black text-slate-800 leading-none">
                {totalStaffReg}
              </h2>
              <span className="text-purple-600 text-xs font-bold mb-1">
                orang
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARIS 3: GRAFIK / VISUALISASI */}
      <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-sm w-full mt-2">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ReportIcon className="w-5 h-5 text-blue-600" />
          Visualisasi Kunjungan Berkala
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MiniChart
            title="Tren 7 Hari Terakhir"
            data={chartData1W}
            gradientId="color1W"
            colorHex="#2563eb"
          />
          <MiniChart
            title="Tren 30 Hari Terakhir"
            data={chartData1M}
            gradientId="color1M"
            colorHex="#0284c7"
          />
          <MiniChart
            title="Tren 6 Bulan Terakhir"
            data={chartData6M}
            gradientId="color6M"
            colorHex="#4f46e5"
          />
        </div>
      </div>
    </div>
  );
}
