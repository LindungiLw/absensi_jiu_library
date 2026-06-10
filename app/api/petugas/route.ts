import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// 1. AMBIL SEMUA DATA PETUGAS KIOSK
export async function GET() {
  // BLOK PELINDUNG KEAMANAN
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Akses Ditolak! Anda tidak memiliki izin (Unauthorized)." },
      { status: 401 },
    );
  }

  try {
    const data = await prisma.petugasKiosk.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memuat data petugas." },
      { status: 500 },
    );
  }
}

// 2. TAMBAH PETUGAS KIOSK BARU
export async function POST(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Akses Ditolak!" }, { status: 401 });
  }

  try {
    const { username, pin } = await request.json();
    if (!username || pin.length !== 6) {
      return NextResponse.json(
        { error: "Username wajib diisi dan PIN harus 6 digit." },
        { status: 400 },
      );
    }

    const exist = await prisma.petugasKiosk.findUnique({ where: { username } });
    if (exist)
      return NextResponse.json(
        { error: "Username sudah digunakan." },
        { status: 400 },
      );

    const newPetugas = await prisma.petugasKiosk.create({
      data: { username, pin },
    });
    return NextResponse.json({
      success: true,
      message: "Petugas baru didaftarkan!",
      data: newPetugas,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan petugas." },
      { status: 500 },
    );
  }
}

// 3. UPDATE PIN / USERNAME PETUGAS
export async function PUT(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Akses Ditolak!" }, { status: 401 });

  try {
    const { id, username, pin } = await request.json();
    const updated = await prisma.petugasKiosk.update({
      where: { id: Number(id) },
      data: { username, pin },
    });
    return NextResponse.json({
      success: true,
      message: "Kredensial diperbarui!",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui data." },
      { status: 500 },
    );
  }
}

// 4. HAPUS AKUN PETUGAS
export async function DELETE(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Akses Ditolak!" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

    await prisma.petugasKiosk.delete({ where: { id: Number(id) } });
    return NextResponse.json({
      success: true,
      message: "Akses akun petugas resmi dihapus.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus akun." },
      { status: 500 },
    );
  }
}
