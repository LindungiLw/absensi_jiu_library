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
  ];

  // 🔥 FUNGSI LOGOUT YANG MEMANGGIL API PENGHANCUR COOKIE
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Gagal logout", err);
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

        {/* 🔥 AREA BAWAH SIDEBAR (TOMBOL LOGOUT & KEMBALI) */}
        <div className="flex flex-col gap-4 mt-8 border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="text-slate-400 text-xs hover:text-blue-500 transition-colors flex items-center gap-2 font-medium"
          >
            ← Kembali ke Scanner
          </Link>
          <button
            onClick={handleLogout}
            className="text-left text-rose-500 text-xs hover:text-rose-700 font-bold transition-colors flex items-center gap-2"
          >
            🚪 Logout System
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
