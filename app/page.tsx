"use client";

import { useState, useRef, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./animations.css";
import Card3D from "./Card3D";
import BookBackground from "./BookBackground";
import { HandTapIcon, CrownIcon } from "./components/icons/LibraryIcons";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const VALUES_TEXT = ["Love", "Integrity", "Faithfulness", "Excellence"];

const CONFETTI_COLORS = [
  "bg-blue-500",
  "bg-sky-400",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-amber-400",
  "bg-emerald-400",
];

// Perhitungan Confetti ditaruh di luar (Sudah benar! Mencegah lag saat render)
const CONFETTI_PARTICLES = Array.from({ length: 60 }).map(() => {
  const angle = Math.random() * Math.PI * 2;
  const velocity = 150 + Math.random() * 350;
  const tx = Math.cos(angle) * velocity;
  const ty = Math.sin(angle) * velocity - 80;
  const rot = Math.random() * 360 + 180;
  const color =
    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const delay = Math.random() * 0.1;
  const size = Math.floor(Math.random() * 8) + 6;
  const isCircle = Math.random() > 0.5;

  return {
    tx: `${tx}px`,
    ty: `${ty}px`,
    rot: `${rot}deg`,
    color,
    delay: `${delay}s`,
    size,
    isCircle,
  };
});

export default function HalamanAbsensi() {
  const [inputID, setInputID] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [logTerakhir, setLogTerakhir] = useState<any | null>(null);
  const [isLibur, setIsLibur] = useState(false);
  const [ketLibur, setKetLibur] = useState("");

  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const notifTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/libur?today=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.isLibur) {
          setIsLibur(true);
          setKetLibur(data.keterangan);
        } else {
          inputRef.current?.focus();
        }
      });
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (window.getSelection()?.toString() === "") {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("click", handleGlobalClick);
    inputRef.current?.focus();
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const showNotification = (type: "success" | "error", msg: string) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setNotif({ type, msg });
    notifTimeoutRef.current = setTimeout(() => setNotif(null), 3000);
  };

  const triggerFastConfetti = () => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    setShowSuccessAnim(true);
    animTimeoutRef.current = setTimeout(() => setShowSuccessAnim(false), 1200);
  };

  const handleProsesAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    const scannedID = inputID.trim();
    if (loading || !scannedID || isLibur) return;

    setLoading(true);
    setNotif(null);
    setShowSuccessAnim(false);
    setLogTerakhir(null);
    setInputID(""); // Kosongkan input agar siap (Mencegah tampilan nge-lag)

    try {
      const response = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: scannedID }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        let sapaan = `Hello, ${data.nama}! 👋 Have a great day!`;

        if (data.negara === "KR")
          sapaan = `안녕하세요, ${data.nama}! 👋 Have a great day!`;
        else if (data.negara === "JP")
          sapaan = `こんにちは, ${data.nama}! 👋 Have a great day!`;
        else if (data.negara === "AF")
          sapaan = `سلام, ${data.nama}! 👋 Have a great day!`;
        else if (data.negara === "ID") {
          if (data.pulau === "Sumatera")
            sapaan = `Horas! Hello, ${data.nama}! 👋 Have a great day!`;
          else if (data.pulau === "Jawa")
            sapaan = `Sugeng rawuh! Hello, ${data.nama}! 👋 Have a great day!`;
          else if (data.pulau === "Sulawesi")
            sapaan = `Aga kareba? Hello, ${data.nama}! 👋 Have a great day!`;
          else if (data.pulau === "Papua")
            sapaan = `Halo Pace/Mace ${data.nama}! 👋 Have a great day!`;
          else if (data.pulau === "Nias")
            sapaan = `Ya'ahowu! Hello, ${data.nama}! 👋 Have a great day!`;
          else sapaan = `Hello, ${data.nama}! 👋 Welcome to the library!`;
        }

        showNotification("success", sapaan);

        setLogTerakhir({
          nim: data.nim,
          nama: data.nama,
          role: data.role,
          sesi: data.sesi,
          waktu: data.waktu,
          ranking: data.ranking,
        });

        triggerFastConfetti();
      } else {
        showNotification("error", data.error || "Failed to process data.");
      }
    } catch (err) {
      showNotification("error", "Campus internet connection issue");
    } finally {
      setLoading(false);

      // Jika tidak ada setTimeout, kursor bisa hilang dan scanner macet!
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  if (isLibur) {
    return (
      <main
        className={`${plusJakartaSans.className} min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden`}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-100 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="w-full max-w-2xl bg-white border border-rose-200 rounded-3xl shadow-xl p-10 text-center z-10 relative">
          <div className="flex justify-center mb-6">
            <img
              src="/JIU Library.png"
              alt="JIU Library Logo"
              className="h-20 md:h-24 w-auto object-contain grayscale opacity-50"
            />
          </div>
          <div className="text-6xl mb-4">⛔</div>
          <h1 className="text-4xl font-black text-rose-600 mb-2 tracking-widest">
            LIBRARY CLOSED
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            The attendance system is disabled today.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${plusJakartaSans.className} min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none`}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.11) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[10%] left-[12%] w-80 h-80 bg-blue-100/55 rounded-full blur-[110px] animate-pulse"
          style={{ animationDuration: "5s" }}
        />
        <div
          className="absolute bottom-[15%] right-[12%] w-72 h-72 bg-sky-100/55 rounded-full blur-[110px] animate-pulse"
          style={{ animationDuration: "7s" }}
        />
      </div>

      <BookBackground />

      {showSuccessAnim && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none overflow-hidden">
          {CONFETTI_PARTICLES.map((p, i) => (
            <div
              key={i}
              className={`absolute ${p.color} ${p.isCircle ? "rounded-full" : "rounded-sm"} shadow-sm`}
              style={
                {
                  width: p.size,
                  height: p.size,
                  "--tx": p.tx,
                  "--ty": p.ty,
                  "--rot": p.rot,
                  animation:
                    "confettiFirework 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards",
                  animationDelay: p.delay,
                  opacity: 0,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-5 inset-x-0 z-20 flex justify-center pointer-events-none select-none">
        <div className="relative h-4 w-52">
          {VALUES_TEXT.map((word, i) => (
            <span
              key={word}
              className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400"
              style={{
                animation: "cycleWord 20s ease-in-out infinite",
                animationDelay: `${i * 5}s`,
                opacity: 0,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <Card3D>
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-5">
            <img
              src="/JIU Library.png"
              alt="JIU Library Logo"
              className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 hover:scale-105"
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 bg-clip-text text-transparent tracking-tight">
            DREAM BLUE LIBRARY
          </h1>

          <p className="text-slate-500 text-sm font-medium flex items-center justify-center gap-1">
            Please tap your ID card on the scanner
          </p>
          <div className="text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
            Please tap your ID card on the scanner
            <HandTapIcon className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        <form
          onSubmit={handleProsesAbsen}
          className="space-y-4 flex flex-col items-center relative z-20"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputID}
            onChange={(e) => setInputID(e.target.value)}
            disabled={loading}
            placeholder="Scan / Type your ID..."
            autoComplete="off" // Mencegah browser mikir keras mencari riwayat
            autoCorrect="off" // Mencegah HP/Tablet mengoreksi otomatis
            spellCheck="false" // Mencegah garis merah di bawah teks
            autoFocus // Langsung fokus sejak halaman dimuat
            className="w-full max-w-md bg-white/90 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl px-6 py-4 text-center font-mono text-xl tracking-widest outline-none text-slate-800 placeholder:text-slate-400 transition-all duration-300 shadow-inner hover:border-slate-300"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-md py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-blue-500/30 active:scale-[0.98] overflow-hidden relative"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              "Check In"
            )}
          </button>
        </form>

        <div className="min-h-[70px] flex items-center justify-center w-full max-w-md mx-auto my-4 relative z-20">
          {notif && (
            <div
              className={`w-full p-4 text-center font-bold rounded-2xl text-base border-2 transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-top-2 shadow-lg ${notif.type === "success" ? "bg-emerald-50/90 backdrop-blur-sm border-emerald-300 text-emerald-800 shadow-emerald-200/50" : "bg-rose-50/90 backdrop-blur-sm border-rose-300 text-rose-800 shadow-rose-200/50"}`}
            >
              {notif.msg}
            </div>
          )}
        </div>

        <div className="w-full max-w-md mx-auto relative z-20">
          {logTerakhir ? (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex flex-col items-center justify-center mb-5">
                <div className="flex items-center gap-1.5 opacity-90">
                  <div className="flex items-center gap-1.5 opacity-90">
                    <CrownIcon className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] drop-shadow-sm mt-0.5">
                      {logTerakhir.role} RANK
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] drop-shadow-sm mt-0.5">
                    {logTerakhir.role} RANK
                  </span>
                </div>
                <span
                  className="text-7xl font-black text-amber-500 leading-none drop-shadow-lg mt-1"
                  style={{ textShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
                >
                  {logTerakhir.ranking}
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-lg overflow-hidden">
                <div className="flex justify-between items-center px-5 py-3 hover:bg-white/90 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-base font-bold text-blue-700 border border-blue-200 shadow-inner">
                      {logTerakhir.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">
                        {logTerakhir.nama}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {logTerakhir.nim}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[9px] uppercase font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                      {logTerakhir.sesi}
                    </span>
                    <span className="text-xs font-mono text-blue-600 font-bold tracking-tight">
                      {logTerakhir.waktu}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-2 text-center italic tracking-wide">
              Waiting for card scan...
            </p>
          )}
        </div>
      </Card3D>
    </main>
  );
}
