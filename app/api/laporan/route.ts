import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Mengunci data log presensi dari publik
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Akses Ditolak! Anda tidak memiliki izin (Unauthorized)." },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isExport = searchParams.get("isExport") === "true";

    let whereClause: any = {};

    // 1. Jika minta data untuk 1 HARI SPESIFIK
    if (date) {
      whereClause.tanggal = date;
    }
    // 2. Jika minta data RENTANG WAKTU
    else if (startDate && endDate) {
      whereClause.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 3. LOGIKA PEMBATAS CERDAS (SMART LIMIT)
    const shouldLimit = !date && !isExport && (!startDate || !endDate);

    const dataAbsen = await prisma.kehadiran.findMany({
      where: whereClause,
      orderBy: { waktu: "desc" },
      include: { anggota: true },
      ...(shouldLimit ? { take: 3000 } : {}),
    });

    const dataFormatted = dataAbsen.map((log: any) => ({
      id: log.id,
      id_anggota: log.id_anggota,
      nama: log.anggota?.nama || "Data Terhapus",
      role: log.anggota?.role || "unknown",
      jurusan: log.anggota?.jurusan || "-",
      batch: log.anggota?.batch || "-",
      sesi: log.sesi,
      waktu: log.waktu,
      tanggal: log.tanggal,
    }));

    return NextResponse.json({ success: true, data: dataFormatted });
  } catch (error) {
    console.error("Gagal menarik data laporan:", error);
    return NextResponse.json(
      { error: "Gagal menarik data dari database" },
      { status: 500 },
    );
  }
}
