import React from "react";

export default function Card3D({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-2xl mx-auto z-10"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative z-10 w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]"
        style={{
          transformStyle: "preserve-3d",
          animation: "float3D 8s ease-in-out infinite",
        }}
      >
        <div className="relative z-30">{children}</div>
      </div>
    </div>
  );
}
