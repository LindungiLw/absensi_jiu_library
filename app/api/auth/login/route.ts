import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Tarik semua data dari brankas .env
    const TRUE_PASSWORD = process.env.ADMIN_PASSWORD;
    const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];

    // 🔥 FITUR DEWA: ANTI-BRUTE FORCE DELAY (Penundaan 1 Detik)
    // Membuat bot hacker frustrasi karena tidak bisa spam ribuan tebakan per detik
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. CEK KREDENSIAL SECARA BERSAMAAN (Mencegah Information Leakage)
    const isEmailValid = allowedEmails.includes(email);
    const isPasswordValid = password === TRUE_PASSWORD;

    if (!isEmailValid || !isPasswordValid) {
      //  PESAN DISAMARKAN: Jangan beri tahu hacker apakah email atau password-nya yang salah
      return NextResponse.json(
        { error: "Kredensial tidak valid atau akses ditolak." },
        { status: 401 },
      );
    }

    // 3. JIKA LOLOS, BUAT TOKEN JWT
    const token = await new SignJWT({
      role: "superadmin",
      email: email,
      divisi: "Perpustakaan JIU",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET_KEY);

    const response = NextResponse.json({
      success: true,
      message: "Login Berhasil",
    });

    // 4. SET COOKIE SUPER AMAN
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 Jam
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
