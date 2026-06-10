"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartIcon,
  UsersIcon,
  ReportIcon,
} from "../components/icons/LibraryIcons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Daftar Menu Navigasi
  const navItems = [
    {
      name: "Manajemen Absensi",
      href: "/admin",
      icon: <ChartIcon className="w-5 h-5" />,
    },
    {
      name: "Data Anggota",
      href: "/admin/anggota",
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      name: "Laporan Rekap",
      href: "/admin/laporan",
      icon: <ReportIcon className="w-5 h-5" />,
    },
    {
      name: "Pengaturan Log",
      href: "/admin/settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  // LOGOUT: Hancurkan sesi di server & Kunci navigasi Client
  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Apakah Anda yakin ingin keluar dari Admin Panel dan mengunci sistem?",
    );
    if (!confirmLogout) return;

    try {
      // 1. Panggil API untuk menghancurkan HTTP-Only Cookie di sisi server
      await fetch("/api/auth/logout", { method: "POST" });

      // 2. Gunakan REPLACE (bukan push) agar halaman /admin dihapus dari history browser
      router.replace("/");

      // 3. Refresh untuk memicu Middleware melakukan pengecekan ulang (Sesi dipastikan 100% mati)
      router.refresh();
    } catch (err) {
      console.error("Gagal melakukan proteksi logout", err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 z-20 shadow-sm overflow-y-auto">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-blue-700 tracking-wider">
            JIU LIBRARY
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">
            Admin Panel
          </p>
        </div>

        <nav className="space-y-2 flex-grow">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out text-sm ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm"
                    : "text-slate-500 font-medium border border-transparent hover:bg-slate-50 hover:text-blue-600 hover:translate-x-1"
                }`}
              >
                <span
                  className={`text-base transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-60"}`}
                >
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/*  AREA BAWAH SIDEBAR: SATU TOMBOL UNTUK KEAMANAN TOTAL */}
        <div className="mt-8 border-t border-slate-100 pt-4">
          <button
            onClick={handleLogout}
            className="w-full text-left text-rose-600 hover:text-rose-700 font-bold text-xs transition-colors flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-rose-50"
          >
            {/* SVG Logout Icon yang Selaras dengan Tema */}
            <svg
              className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Keluar & Kunci Scanner
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative bg-transparent">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="relative z-10 w-full min-h-full">{children}</div>
      </main>
    </div>
  );
}
