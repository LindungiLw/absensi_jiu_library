"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  UserIcon,
  GradCapIcon,
  BriefcaseIcon,
  UploadIcon,
  DownloadIcon,
  TrashIcon,
  EditIcon,
  XIcon,
} from "../../components/icons/LibraryIcons";

interface Anggota {
  id_anggota: string;
  nama: string;
  role: string;
  jurusan: string | null;
  batch: string | null;
  negara?: string | null;
  pulau?: string | null;
  total_absensi?: number;
}

const JURUSAN_OPTIONS = [
  { value: "IS", label: "Information System (IS)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "EL", label: "English Literature (EL)" },
  { value: "JL", label: "Japanese Literature (JL)" },
  { value: "VCD", label: "Visual Communication Design (VCD)" },
  { value: "ACC", label: "Accounting (ACC)" },
];

const NEGARA_OPTIONS = [
  { value: "ID", label: "🇮🇩 Indonesia" },
  { value: "KR", label: "🇰🇷 South Korea" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "AF", label: "🇦🇫 Afghanistan" },
  { value: "INT", label: "🌐 Other / International" },
];

const PULAU_OPTIONS = [
  "Sumatera",
  "Jawa",
  "Kalimantan",
  "Sulawesi",
  "Papua",
  "Nias",
  "Bali",
  "Nusa Tenggara",
  "Maluku",
];

export default function ManajemenAnggota() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState("Student");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const LIMIT = 50;

  // State untuk menyimpan data statistik total
  const [stats, setStats] = useState({ student: 0, lecturer: 0, staff: 0 });

  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const currentYear = new Date().getFullYear();
  const batchOptions = Array.from({ length: 5 }, (_, i) =>
    String(currentYear - i),
  );

  const [formManual, setFormManual] = useState({
    id_anggota: "",
    nama: "",
    role: "student",
    jurusan: "",
    batch: "",
    negara: "ID",
    pulau: "",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formEdit, setFormEdit] = useState<Anggota>({
    id_anggota: "",
    nama: "",
    role: "student",
    jurusan: "",
    batch: "",
    negara: "ID",
    pulau: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const roleQuery = activeTab.toLowerCase();
        const res = await fetch(
          `/api/anggota?page=${currentPage}&limit=${LIMIT}&search=${searchQuery}&role=${roleQuery}`,
        );
        const json = await res.json();
        if (json.success) {
          setAnggotaList(json.data);
          setTotalPages(json.meta.totalPages || 1);
          if (json.meta.stats) {
            setStats(json.meta.stats);
          }
        }
      } catch (err) {
        setNotif({ type: "error", msg: "Koneksi server bermasalah." });
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, currentPage, refreshTrigger]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formManual.id_anggota.trim() || !formManual.nama.trim()) {
      setNotif({ type: "error", msg: "ID dan Nama tidak boleh kosong!" });
      return;
    }
    setLoading(true);
    setNotif(null);
    try {
      const payload = {
        ...formManual,
        pulau: formManual.negara === "ID" ? formManual.pulau : "",
      };
      const res = await fetch("/api/anggota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setNotif({ type: "success", msg: data.message });
        setFormManual({
          id_anggota: "",
          nama: "",
          role: "student",
          jurusan: "",
          batch: "",
          negara: "ID",
          pulau: "",
        });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setNotif({ type: "error", msg: data.error });
      }
    } catch (err) {
      setNotif({ type: "error", msg: "Koneksi terputus." });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotif(null);
    try {
      const payload = {
        ...formEdit,
        pulau: formEdit.negara === "ID" ? formEdit.pulau : "",
      };
      const res = await fetch("/api/anggota", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setNotif({ type: "success", msg: data.message });
        setEditModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setNotif({ type: "error", msg: data.error });
      }
    } catch (err) {
      setNotif({ type: "error", msg: "Gagal menyimpan perubahan." });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (anggota: Anggota) => {
    setFormEdit({
      ...anggota,
      negara: anggota.negara || "ID",
      pulau: anggota.pulau || "",
    });
    setEditModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsStudent = XLSX.utils.aoa_to_sheet([
      ["ID_ANGGOTA", "NAMA", "JURUSAN", "BATCH"],
    ]);
    wsStudent["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsStudent, "Mahasiswa");

    const wsLecturer = XLSX.utils.aoa_to_sheet([
      ["ID_ANGGOTA", "NAMA", "JURUSAN"],
    ]);
    wsLecturer["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsLecturer, "Dosen");

    const wsStaff = XLSX.utils.aoa_to_sheet([["ID_ANGGOTA", "NAMA"]]);
    wsStaff["!cols"] = [{ wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsStaff, "Staff");

    XLSX.writeFile(wb, "Template_Import_Anggota_JIU.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setNotif(null);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        let payloadExcel: any[] = [];

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[];
          let roleToAssign = "student";
          if (sheetName.toLowerCase().includes("dosen"))
            roleToAssign = "lecturer";
          else if (sheetName.toLowerCase().includes("staff"))
            roleToAssign = "staff";

          rawData.forEach((row) => {
            if (row.ID_ANGGOTA && row.NAMA) {
              const cleanId = String(row.ID_ANGGOTA).replace(/^'/, "").trim();
              payloadExcel.push({
                id_anggota: cleanId,
                nama: String(row.NAMA).trim(),
                role: roleToAssign,
                jurusan: row.JURUSAN ? String(row.JURUSAN).trim() : null,
                batch: row.BATCH ? String(row.BATCH).trim() : null,
              });
            }
          });
        });

        if (payloadExcel.length === 0) {
          setNotif({
            type: "error",
            msg: "Data kosong. Pastikan kolom ID_ANGGOTA dan NAMA terisi di Excel!",
          });
          setLoading(false);
          return;
        }

        const res = await fetch("/api/anggota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadExcel),
        });
        const data = await res.json();

        if (res.ok) {
          setNotif({ type: "success", msg: data.message });
          setRefreshTrigger((prev) => prev + 1);
        } else {
          setNotif({ type: "error", msg: data.error });
        }
      } catch (err) {
        setNotif({ type: "error", msg: "Gagal membaca format file Excel." });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id: string, nama: string) => {
    const confirmDelete = window.confirm(
      `Hapus data anggota "${nama}" beserta riwayat kunjungannya?`,
    );
    if (!confirmDelete) return;
    setLoading(true);
    setNotif(null);
    try {
      const res = await fetch(`/api/anggota?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotif({ type: "success", msg: data.message });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setNotif({ type: "error", msg: data.error });
      }
    } catch (err) {
      setNotif({ type: "error", msg: "Gagal menghapus data." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 w-full text-slate-800 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-800">
            DATA ANGGOTA PERPUSTAKAAN
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Kelola data master mahasiswa, dosen, dan staf JIU.
          </p>
        </div>
        {notif && (
          <div
            className={`px-4 py-2 rounded-lg text-xs font-bold animate-in fade-in ${notif.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}
          >
            {notif.msg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Form Tambah Manual */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <UploadIcon className="w-4 h-4 text-blue-600" />
            Import Data Massal
          </h2>
          <form
            onSubmit={handleManualSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <input
              type="text"
              required
              placeholder="ID (NIM/NIDN)"
              value={formManual.id_anggota}
              onChange={(e) =>
                setFormManual({ ...formManual, id_anggota: e.target.value })
              }
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="text"
              required
              placeholder="Nama Lengkap"
              value={formManual.nama}
              onChange={(e) =>
                setFormManual({ ...formManual, nama: e.target.value })
              }
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <div className="space-y-1">
              {/* Label dengan Ikon yang berubah otomatis */}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                {formManual.role === "student" && (
                  <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                )}
                {formManual.role === "lecturer" && (
                  <GradCapIcon className="w-3.5 h-3.5 text-amber-600" />
                )}
                {formManual.role === "staff" && (
                  <BriefcaseIcon className="w-3.5 h-3.5 text-purple-600" />
                )}
                Role Akses
              </label>

              {/* Select murni (tanpa elemen lain di dalamnya) */}
              <select
                value={formManual.role}
                onChange={(e) =>
                  setFormManual({
                    ...formManual,
                    role: e.target.value,
                    jurusan:
                      e.target.value === "staff" ? "" : formManual.jurusan,
                    batch: e.target.value !== "student" ? "" : formManual.batch,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-700 transition-all"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {formManual.role !== "staff" ? (
              <select
                required={formManual.role !== "staff"}
                value={formManual.jurusan}
                onChange={(e) =>
                  setFormManual({ ...formManual, jurusan: e.target.value })
                }
                className={`bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 ${!formManual.jurusan ? "text-slate-400" : "text-slate-800"}`}
              >
                <option value="" disabled>
                  Pilih Jurusan...
                </option>
                {JURUSAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="hidden md:block"></div>
            )}

            {formManual.role === "student" && (
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Angkatan / Batch (Cth: 2026)"
                  value={formManual.batch}
                  onChange={(e) =>
                    setFormManual({ ...formManual, batch: e.target.value })
                  }
                  onFocus={() => setShowBatchAdd(true)}
                  onBlur={() => setTimeout(() => setShowBatchAdd(false), 200)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                />
                {showBatchAdd && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    {batchOptions.map((year) => (
                      <li
                        key={year}
                        onClick={() => {
                          setFormManual({ ...formManual, batch: year });
                          setShowBatchAdd(false);
                        }}
                        className="px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        {year}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <select
              value={formManual.negara}
              onChange={(e) =>
                setFormManual({
                  ...formManual,
                  negara: e.target.value,
                  pulau: "",
                })
              }
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
            >
              {NEGARA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {formManual.negara === "ID" && (
              <select
                value={formManual.pulau}
                onChange={(e) =>
                  setFormManual({ ...formManual, pulau: e.target.value })
                }
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
              >
                <option value="">-- Pilih Pulau / Region (Opsional) --</option>
                {PULAU_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            <div className="md:col-span-2 flex justify-end mt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
              >
                + Simpan Data
              </button>
            </div>
          </form>
        </div>

        {/* Kotak Import Excel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-[30px] pointer-events-none"></div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <UploadIcon className="w-4 h-4 text-blue-600" />
              Import Data Massal
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4 relative z-10">
              Upload data Mahasiswa, Dosen, dan Staff sekaligus! <br />
              <span className="text-rose-600 font-bold block mt-1">
                PENTING:
              </span>{" "}
              Pastikan kolom ID_ANGGOTA formatnya adalah <strong>"Text"</strong>
              .
            </p>
          </div>
          <div className="space-y-2 relative z-10">
            <button
              onClick={handleDownloadTemplate}
              className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              1. Download Template (3 Sheet)
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Memproses..."
              ) : (
                <>
                  <UploadIcon className="w-4 h-4" />
                  2. Upload Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 bg-slate-50 p-2 gap-3">
            <div className="flex overflow-x-auto w-full sm:w-auto">
              {["Student", "Lecturer", "Staff"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap transition-colors rounded-lg flex items-center gap-2 ${activeTab === tab ? "text-blue-700 bg-blue-100/50 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}`}
                >
                  {tab === "Student" && <UserIcon className="w-3.5 h-3.5" />}
                  {tab === "Lecturer" && (
                    <GradCapIcon className="w-3.5 h-3.5" />
                  )}
                  {tab === "Staff" && <BriefcaseIcon className="w-3.5 h-3.5" />}
                  {tab === "Student"
                    ? "Mahasiswa"
                    : tab === "Lecturer"
                      ? "Dosen"
                      : "Staff"}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari ID, Nama..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-350px)] border-b border-slate-200">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-white sticky top-0 z-20 shadow-sm">
                <tr className="text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">No</th>
                  <th className="px-6 py-4 font-semibold">ID Anggota</th>
                  <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Total Absensi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && anggotaList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500 text-xs"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : anggotaList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-400 text-xs italic"
                    >
                      {searchQuery
                        ? "Data tidak ditemukan."
                        : `Belum ada data ${activeTab} terdaftar.`}
                    </td>
                  </tr>
                ) : (
                  anggotaList.map((anggota, index) => (
                    <tr
                      key={anggota.id_anggota}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                        {(currentPage - 1) * LIMIT + index + 1}
                      </td>
                      <td className="px-6 py-3 font-mono text-blue-600 font-medium text-xs">
                        {anggota.id_anggota}
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-800 text-xs">
                        {anggota.nama}
                        <span className="ml-2 text-[10px]">
                          {anggota.negara === "KR"
                            ? "🇰🇷"
                            : anggota.negara === "JP"
                              ? "🇯🇵"
                              : anggota.negara === "AF"
                                ? "🇦🇫"
                                : "🇮🇩"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md font-mono text-xs font-bold border border-slate-200">
                            {anggota.total_absensi || 0}{" "}
                            <span className="text-[9px] font-sans font-normal ml-1">
                              Kunjungan
                            </span>
                          </div>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(anggota)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit Data"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(anggota.id_anggota, anggota.nama)
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Hapus Data"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =========================================================
              🔥 FOOTER TABEL: PAGINATION & TOTAL DATA DITENGAH
              ========================================================= */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-slate-200 bg-slate-50 gap-4 sm:gap-0">
            {/* 1. KIRI: Info Halaman */}
            <div className="flex-1 flex justify-start">
              <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Halaman <strong className="text-blue-700">{currentPage}</strong>{" "}
                dari {totalPages}
              </span>
            </div>

            {/* 2. TENGAH: Info Total Data Aktif */}
            <div className="flex-1 flex justify-center">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-600 tracking-wide">
                Total
                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-100 text-sm">
                  {activeTab === "Student"
                    ? stats.student
                    : activeTab === "Lecturer"
                      ? stats.lecturer
                      : stats.staff}
                </span>
              </div>
            </div>

            {/* 3. KANAN: Tombol Prev / Next */}
            <div className="flex-1 flex justify-end gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 disabled:opacity-50 transition-all shadow-sm"
              >
                &larr; Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={
                  currentPage === totalPages || totalPages === 0 || loading
                }
                className="px-4 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 disabled:opacity-50 transition-all shadow-sm"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDIT DATA */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">
                Edit Data Anggota
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
                title="Tutup"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  ID Anggota
                </label>
                <input
                  type="text"
                  disabled
                  value={formEdit.id_anggota}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formEdit.nama}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, nama: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Role
                  </label>
                  <select
                    value={formEdit.role}
                    onChange={(e) =>
                      setFormEdit({
                        ...formEdit,
                        role: e.target.value,
                        jurusan:
                          e.target.value === "staff" ? "" : formEdit.jurusan,
                        batch:
                          e.target.value !== "student" ? "" : formEdit.batch,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Batch
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={formEdit.role !== "student"}
                      placeholder="Kosong"
                      value={formEdit.batch || ""}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, batch: e.target.value })
                      }
                      onFocus={() => setShowBatchEdit(true)}
                      onBlur={() =>
                        setTimeout(() => setShowBatchEdit(false), 200)
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-800 disabled:bg-slate-100"
                    />
                    {showBatchEdit && formEdit.role === "student" && (
                      <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
                        {batchOptions.map((year) => (
                          <li
                            key={year}
                            onClick={() => {
                              setFormEdit({ ...formEdit, batch: year });
                              setShowBatchEdit(false);
                            }}
                            className="px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                          >
                            {year}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Negara
                  </label>
                  <select
                    value={formEdit.negara || "ID"}
                    onChange={(e) =>
                      setFormEdit({
                        ...formEdit,
                        negara: e.target.value,
                        pulau: "",
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-800"
                  >
                    {NEGARA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Pulau (ID)
                  </label>
                  <select
                    disabled={formEdit.negara !== "ID"}
                    value={formEdit.pulau || ""}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, pulau: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-800 disabled:bg-slate-100"
                  >
                    <option value="">-- Kosong --</option>
                    {PULAU_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
