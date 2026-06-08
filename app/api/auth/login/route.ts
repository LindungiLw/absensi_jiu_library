import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "../../../lib/prisma";

// 🛡️ MEMORI RATE LIMITER (Proteksi dari Spam Kiosk di Area Publik)
// Mencatat jumlah percobaan salah berdasarkan kombinasi IP / Username
const rateLimitMap = new Map<string, { count: number; lockUntil: number }>();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Ambil IP atau identifier request (bisa dimaksimalkan lewat header)
    const ip = request.headers.get("x-forwarded-for") || "local_kiosk";
    const limitKey = `${ip}_${email}`;

    // 1. Periksa apakah akun ini sedang diblokir karena salah PIN berkali-kali
    const currentLimit = rateLimitMap.get(limitKey);
    if (currentLimit && currentLimit.lockUntil > Date.now()) {
      const remainingTime = Math.ceil(
        (currentLimit.lockUntil - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan. Akses dikunci, coba lagi dalam ${remainingTime} detik.`,
        },
        { status: 429 }, // 429 Too Many Requests
      );
    }

    const TRUE_PASSWORD = process.env.ADMIN_PASSWORD;
    const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];

    // DELAY PER REQUEST FIXED
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let userRole = "";
    let userEmail = email;
    let divisi = "";

    // JALUR 1: Superadmin (.env)
    const isSuperadminEmail = allowedEmails.includes(email);
    const isSuperadminPassword = password === TRUE_PASSWORD;

    if (isSuperadminEmail && isSuperadminPassword) {
      userRole = "superadmin";
      divisi = "Perpustakaan JIU";
    } else {
      // JALUR 2: Cek ke Database Petugas Kiosk (Real-time)
      const petugas = await prisma.petugasKiosk.findUnique({
        where: { username: email },
      });

      // PENCATATAN AMAN: Jika Anda sudah beralih ke hash PIN, gunakan perbandingan hash di sini
      if (petugas && petugas.pin === password) {
        userRole = "petugas_kiosk";
        userEmail = petugas.username;
        divisi = "Stasiun Presensi Kiosk";

        await prisma.petugasKiosk.update({
          where: { username: email },
          data: { lastOpenedAt: new Date() },
        });
      }
    }

    // JIKA LOGIN GAGAL: Catat ke dalam memori Rate Limiter
    if (!userRole) {
      const failedAttempts = (currentLimit?.count || 0) + 1;

      if (failedAttempts >= 5) {
        // Jika salah sebanyak 5 kali berturut-turut, KUNCI selama 5 menit (300.000 ms)
        rateLimitMap.set(limitKey, {
          count: 0,
          lockUntil: Date.now() + 300000,
        });
      } else {
        rateLimitMap.set(limitKey, { count: failedAttempts, lockUntil: 0 });
      }

      return NextResponse.json(
        { error: "Kredensial tidak valid atau akses ditolak." },
        { status: 401 },
      );
    }

    // JIKA LOGIN SUKSES: Bersihkan riwayat kesalahan percobaan PIN
    rateLimitMap.delete(limitKey);

    // 4. BUAT TOKEN JWT (Masa aktif dibedakan demi keamanan stasiun publik)
    const isKiosk = userRole === "petugas_kiosk";
    const tokenLifespan = isKiosk ? "4h" : "24h"; // Token Kiosk mati otomatis dalam 4 jam jika petugas lupa logout

    const token = await new SignJWT({
      role: userRole,
      email: userEmail,
      divisi: divisi,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(tokenLifespan)
      .sign(SECRET_KEY);

    const response = NextResponse.json({
      success: true,
      message: "Login Berhasil",
    });

    // 5. SET COOKIE SUPER AMAN
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: isKiosk ? 60 * 60 * 4 : 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memproses login server." },
      { status: 500 },
    );
  }
}
