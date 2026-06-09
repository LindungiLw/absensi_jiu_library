import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers"; // 🛡️ IMPORT KEAMANAN NEXT.JS 15

export const dynamic = "force-dynamic";

export async function GET() {
  // 🛡️ BLOK PELINDUNG KEAMANAN: Mengunci visualisasi grafik dari publik 🔒
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Akses Ditolak! Anda tidak memiliki izin (Unauthorized)." },
      { status: 401 },
    );
  }

  try {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(today.getDate() - 180);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const todayStr = formatDate(today);
    const startStr = formatDate(sixMonthsAgo);

    // 1. DATA KUNJUNGAN HARI INI
    const [totalHadir, hadirMahasiswa] = await Promise.all([
      prisma.kehadiran.count({
        where: { tanggal: todayStr },
      }),
      prisma.kehadiran.count({
        where: {
          tanggal: todayStr,
          anggota: { role: "student" },
        },
      }),
    ]);

    const hadirStaff = totalHadir - hadirMahasiswa;

    // 2. DATA GRAFIK 6 BULAN
    const rekapGrafik = await prisma.kehadiran.groupBy({
      by: ["tanggal"],
      _count: {
        id_anggota: true,
      },
      where: {
        tanggal: {
          gte: startStr,
          lte: todayStr,
        },
      },
    });

    // 3. TOTAL ANGGOTA TERDAFTAR DI DATABASE
    const [totalStudent, totalLecturer, totalStaff] = await Promise.all([
      prisma.anggota.count({ where: { role: "student" } }),
      prisma.anggota.count({ where: { role: "lecturer" } }),
      prisma.anggota.count({ where: { role: "staff" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        hariIni: {
          total: totalHadir,
          mahasiswa: hadirMahasiswa,
          staff: hadirStaff,
        },
        database: {
          student: totalStudent,
          lecturer: totalLecturer,
          staff: totalStaff,
        },
        grafik: rekapGrafik.map((g) => ({
          tanggal: g.tanggal,
          total: g._count.id_anggota,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard" },
      { status: 500 },
    );
  }
}
