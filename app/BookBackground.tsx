"use client";

import React, { useMemo, useState, useEffect } from "react";

export default function BookBackground() {
  // TRIK ANTI HYDRATION ERROR: Menahan render acak sampai di Client (Browser)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. DATA KATA-KATA & WARNA
  const subjects = [
    { word: "Psychology", color: "rgba(192, 132, 252, 0.6)" },
    { word: "English", color: "rgba(125, 211, 252, 0.6)" },
    { word: "Art", color: "rgba(251, 113, 133, 0.6)" },
    { word: "Novel", color: "rgba(251, 191, 36, 0.6)" },
    { word: "Dream Blue Library", color: "rgba(56, 189, 248, 0.8)" },
    { word: "JIU", color: "rgba(59, 130, 246, 0.8)" },
    { word: "Bible", color: "rgba(250, 204, 21, 0.7)" },
    { word: "Technology", color: "rgba(45, 212, 191, 0.6)" },
    { word: "Sciences", color: "rgba(52, 211, 153, 0.6)" },
    { word: "Accounting", color: "rgba(148, 163, 184, 0.7)" },
    { word: "Information System", color: "rgba(129, 140, 248, 0.6)" },
    { word: "Japanese", color: "rgba(248, 113, 113, 0.6)" },
    { word: "Education", color: "rgba(96, 165, 250, 0.6)" },
    { word: "Coding", color: "rgba(74, 222, 128, 0.65)" },
    { word: "Management", color: "rgba(156, 163, 175, 0.6)" },
    { word: "Algorithms", color: "rgba(167, 139, 250, 0.6)" },
    { word: "UI/UX Design", color: "rgba(232, 121, 249, 0.6)" },
    { word: "Business", color: "rgba(16, 185, 129, 0.6)" },
    { word: "Cyber Security", color: "rgba(239, 68, 68, 0.6)" },
    { word: "Data Science", color: "rgba(34, 211, 238, 0.6)" },
  ];

  const floatingWords = useMemo(() => {
    return subjects.map((subj, i) => ({
      id: `word-${i}`,
      word: subj.word,
      color: subj.color,
      left: `${Math.random() * 85 + 5}%`,
      top: `${Math.random() * 85 + 5}%`,
      fontSize: `${Math.random() * 6 + 10}px`,
      delayFloat: `${Math.random() * -20}s`,
      delayType: `${Math.random() * -15}s`,
      duration: `${Math.random() * 6 + 10}s`,
    }));
  }, []);

  const floatingIcons = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: `icon-${i}`,
      left: `${Math.random() * 90}%`,
      delay: `${Math.random() * -25}s`,
      duration: `${Math.random() * 15 + 20}s`,
      type: i % 4,
    }));
  }, []);

  return (
    <div className="bb-scene">
      {/* RENDER ACAK HANYA JIKA SUDAH DI BROWSER (Mencegah Error)  */}

      {isMounted && (
        <>
          {/* A. Teks Mengetik (Typewriter) */}
          {floatingWords.map((item) => (
            <div
              key={item.id}
              className="bg-knowledge-word"
              style={{
                left: item.left,
                top: item.top,
                fontSize: item.fontSize,
                animationDelay: item.delayFloat,
                // @ts-ignore
                "--word-color": item.color,
              }}
            >
              <span
                className="typewriter-inner"
                style={{
                  animationDelay: item.delayType,
                  animationDuration: item.duration,
                }}
              >
                {item.word}
              </span>
            </div>
          ))}

          {/* B. Ikon Melayang (Pesawat, Penggaris, Math, Atom) */}
          {floatingIcons.map((item) => (
            <div
              key={item.id}
              className="bg-knowledge-icon"
              style={{
                left: item.left,
                animationDelay: item.delay,
                animationDuration: item.duration,
              }}
            >
              {item.type === 0 && (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
              {item.type === 1 && (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.17 3.25a2.5 2.5 0 0 0-3.54 0L3.25 17.63a2.5 2.5 0 0 0 3.54 3.54L21.17 6.79a2.5 2.5 0 0 0 0-3.54z" />
                  <path d="M6 14l2 2" />
                  <path d="M9 11l2 2" />
                  <path d="M12 8l2 2" />
                  <path d="M15 5l2 2" />
                </svg>
              )}
              {item.type === 2 && (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <ellipse
                    cx="12"
                    cy="12"
                    rx="11"
                    ry="4"
                    transform="rotate(45 12 12)"
                  />
                  <ellipse
                    cx="12"
                    cy="12"
                    rx="11"
                    ry="4"
                    transform="rotate(-45 12 12)"
                  />
                </svg>
              )}
              {item.type === 3 && (
                <span className="font-serif italic font-bold text-xl tracking-widest">
                  ∫ f(x) = y
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {/* BUKU HOLOGRAPHIC (Dirender dari awal tanpa masalah)       */}

      <div
        style={{
          transform: "scale(1.6) translateY(5%)",
          transformOrigin: "center center",
        }}
      >
        <div className="bb-book-wrap">
          <div className="bb-book">
            <div className="bb-spine"></div>
            <div className="bb-ghost"></div>

            <div className="bb-page bb-page-left">
              <div className="bb-page-surface">
                <div className="bb-page-header">JIU // ARCHIVE</div>
                <div className="bb-page-text bb-text-right">
                  <span className="bb-wl">Establishing connection...</span>
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "1s" }}>
                    Network: SECURE
                  </span>
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "2s" }}>
                    Syncing database.
                  </span>
                  <br />
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "3.5s" }}>
                    DREAM BLUE LIBRARY
                  </span>
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "4.5s" }}>
                    Knowledge is Power.
                  </span>
                  <br />
                </div>
              </div>
            </div>

            <div className="bb-page bb-page-right">
              <div className="bb-page-surface">
                <div className="bb-page-header">SCAN // PROTOCOL</div>
                <div className="bb-page-text bb-text-left">
                  <span className="bb-wl" style={{ animationDelay: "1.5s" }}>
                    System monitoring.
                  </span>
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "2.5s" }}>
                    Waiting for RFID...
                  </span>
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "3.5s" }}>
                    Validating member.
                  </span>
                  <br />
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "4.5s" }}>
                    Please tap card.
                  </span>
                  <br />
                  <span className="bb-wl" style={{ animationDelay: "6.5s" }}>
                    STATUS: LISTENING
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
