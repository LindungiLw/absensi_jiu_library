"use client";

import React from "react";

interface KioskClosedScreenProps {
  keterangan: string;
  fontClass: string;
}

export default function KioskClosedScreen({
  keterangan,
  fontClass,
}: KioskClosedScreenProps) {
  return (
    <main
      className={`${fontClass} min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden`}
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-xl p-10 text-center z-10 relative">
        <div className="flex justify-center mb-6">
          <img
            src="/JIU Library.png"
            alt="JIU Library Logo"
            className="h-20 md:h-24 w-auto object-contain grayscale opacity-50"
          />
        </div>
        <div className="text-6xl mb-4">📢</div>
        <h1 className="text-4xl font-black text-rose-600 mb-2 tracking-widest">
          LIBRARY CLOSED TODAY
        </h1>
        <p className="text-slate-700 text-base font-bold bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl inline-block mb-4">
          Ket: {keterangan || "Hari Libur Nasional / Kampus Resmi."}
        </p>
        <p className="text-slate-500 text-sm">
          Sistem absensi dinonaktifkan sementara. Silakan kembali besok hari.
        </p>
      </div>
    </main>
  );
}
