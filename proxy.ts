import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Fungsi Proxy Next.js 16.2+
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("admin_token")?.value;

  const isAuthPage = path === "/login";
  const isAdminRoute = path.startsWith("/admin");
  const isApiRoute = path.startsWith("/api/");

  // =========================================================
  // JALUR VIP (Boleh diakses TANPA Login)
  // Tambahkan /api/auth/logout agar proses pembersihan token tidak terblokir saat expired
  // =========================================================
  const isPublicApi =
    path === "/api/auth/login" ||
    path === "/api/auth/logout" || // 銆 SEKARANG AMAN: Logout bisa diakses kapan saja untuk bersihkan token
    path === "/api/absensi" ||
    (path === "/api/libur" && request.method === "GET");

  const isProtectedApi = isApiRoute && !isPublicApi;

  // =========================================================
  // PROSES VERIFIKASI JWT MENGGUNAKAN SECRET DARI .ENV
  // =========================================================
  let isVerified = false;
  if (token) {
    try {
      const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, SECRET_KEY);
      isVerified = true;
    } catch (error) {
      isVerified = false;
    }
  }

  // SKENARIO 1: Mencoba masuk /admin tapi token tidak ada atau tidak valid
  if (isAdminRoute && !isVerified) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // SKENARIO 2: Akses API Admin tanpa Token Valid (Postman/Insomnia Blocker)
  if (isProtectedApi && !isVerified) {
    return NextResponse.json(
      { error: "Akses Ditolak: Anda tidak memiliki izin Admin." },
      { status: 401 },
    );
  }

  // SKENARIO 3: Sudah login (token valid), tapi iseng buka halaman /login lagi
  if (isAuthPage && isVerified) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // =========================================================
  // 馃敵 OPTIMASI KIOSK: Tambah Anti-Cache Headers ke halaman /admin yang lolos verifikasi
  // Mencegah browser menyimpan screenshot visual halaman admin saat tombol Back ditekan
  // =========================================================
  const response = NextResponse.next();

  if (isAdminRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  // PASTIKAN /api/ MASUK KE DALAM MATCHER AGAR DIPANTAU OLEH PROXY
  matcher: ["/admin/:path*", "/login", "/api/:path*"],
};
