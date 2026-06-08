import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // ==============================================================
    // 1. DATA KUNJUNGAN HARI INI (Hanya narik data 1 hari, sangat ringan)
    // ==============================================================
    const [totalHadir, hadirMahasiswa] = await Promise.all([
      prisma.kehadiran.count({
        where: { tanggal: todayStr },
      }),
      prisma.kehadiran.count({
        where: {
          tanggal: todayStr,
          anggota: { role: "student" }, // Langsung filter dari database!
        },
      }),
    ]);

    const hadirStaff = totalHadir - hadirMahasiswa;

    // ==============================================================
    // 2. DATA GRAFIK 6 BULAN (Super Kilat pakai GROUP BY Database)
    // ==============================================================
    const rekapGrafik = await prisma.kehadiran.groupBy({
      by: ["tanggal"],
      _count: {
        id_anggota: true, // Hanya menghitung jumlah baris, bukan menarik isi datanya
      },
      where: {
        tanggal: {
          gte: startStr,
          lte: todayStr,
        },
      },
    });

    // ==============================================================
    // 3. TOTAL ANGGOTA TERDAFTAR DI DATABASE (Berjalan Paralel)
    // ==============================================================
    const [totalStudent, totalLecturer, totalStaff] = await Promise.all([
      prisma.anggota.count({ where: { role: "student" } }),
      prisma.anggota.count({ where: { role: "lecturer" } }),
      prisma.anggota.count({ where: { role: "staff" } }),
    ]);

    // Kembalikan JSON berukuran sangat kecil (hanya beberapa Kilobyte)
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
