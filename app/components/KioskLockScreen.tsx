"use client";

import React, { useRef } from "react";

interface KioskLockScreenProps {
  username: string;
  setUsername: (val: string) => void;
  passcode: string;
  setPasscode: (val: string) => void;
  lockError: string;
  unlocking: boolean;
  onUnlock: (e: React.FormEvent) => void;
  usernameInputRef: React.RefObject<HTMLInputElement | null>;
  fontClass: string;
}

export default function KioskLockScreen({
  username,
  setUsername,
  passcode,
  setPasscode,
  lockError,
  unlocking,
  onUnlock,
  usernameInputRef,
  fontClass,
}: KioskLockScreenProps) {
  const pinLength = 6;
  // Ref array untuk mengontrol pergerakan fokus otomatis 6 kotak PIN
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mengatur ketikan angka masuk ke string utama passcode
  const handlePinChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const val = e.target.value.replace(/\D/g, ""); // Hanya mengizinkan karakter angka
    if (!val) return;

    // Ambil digit terakhir yang dimasukkan (mengantisipasi ketikan cepat)
    const lastChar = val.substring(val.length - 1);

    const passcodeArray = passcode.split("");
    passcodeArray[index] = lastChar;
    const newPasscode = passcodeArray.join("").substring(0, pinLength);
    setPasscode(newPasscode);

    // Auto-focus bergeser ke kotak kanan berikutnya
    if (index < pinLength - 1 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Mengatur hapusan tombol Backspace ala aplikasi bank rekening
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const passcodeArray = passcode.split("");

      if (passcodeArray[index]) {
        // Jika kotak aktif ada angkanya, hapus angka di kotak itu saja
        passcodeArray[index] = "";
        setPasscode(passcodeArray.join(""));
      } else if (index > 0) {
        // Jika kotak aktif kosong, hapus angka di kotak sebelah kiri lalu pindah fokus
        passcodeArray[index - 1] = "";
        setPasscode(passcodeArray.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Fitur pintar pendukung jika pin disalin (paste) massal
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .substring(0, pinLength);
    if (pastedData) {
      setPasscode(pastedData);
      const targetIndex = Math.min(pastedData.length, pinLength - 1);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <main
      className={`${fontClass} min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden`}
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl z-10 relative text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/JIU Library.png"
            alt="JIU Library Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-xl font-black tracking-wide text-blue-700 uppercase">
          STATION LOCKED
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Masukkan kredensial otoritas untuk mengaktifkan stasiun scanner.
        </p>

        <form onSubmit={onUnlock} className="space-y-5 text-left">
          {/* INPUT USERNAME */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Username / Email Admin
            </label>
            <input
              ref={usernameInputRef}
              type="text"
              required
              placeholder="Cth: admin@jiu.ac.id"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={unlocking}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>

          {/* INPUT PIN 6 KOTAK INDIVIDU */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              6-Digit PIN Rekening Stasiun
            </label>
            <div
              className="flex justify-between gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {Array.from({ length: pinLength }).map((_, i) => (
                <input
                  key={i}
                  // @ts-ignore
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={passcode[i] || ""}
                  onChange={(e) => handlePinChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  disabled={unlocking}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-2xl font-bold bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all shadow-inner"
                />
              ))}
            </div>
          </div>

          {lockError && (
            <p className="text-xs font-bold text-rose-600 text-center animate-pulse pt-1">
              {lockError}
            </p>
          )}

          <button
            type="submit"
            disabled={unlocking || passcode.length < pinLength}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 mt-2"
          >
            {unlocking ? "Memverifikasi PIN..." : "Aktifkan Scanner Presensi"}
          </button>
        </form>
      </div>
    </main>
  );
}
