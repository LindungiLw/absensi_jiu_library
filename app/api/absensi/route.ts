import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers"; // 🛡️ IMPORT KEAMANAN

export async function POST(request: Request) {
  // 🛡️ BLOK PELINDUNG KEAMANAN (Next.js 15 Await Fix)
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Akses Ditolak! Scanner belum diaktifkan oleh petugas." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const rawId = body.nim || body.id;
    if (!rawId) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    const cleanId = String(rawId).trim();

    const wibTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );
    const hari = wibTime.getDay();

    const hh = String(wibTime.getHours()).padStart(2, "0");
    const mmWaktu = String(wibTime.getMinutes()).padStart(2, "0");
    const currentHHMM = `${hh}:${mmWaktu}`;

    const yyyy = wibTime.getFullYear();
    const mm = String(wibTime.getMonth() + 1).padStart(2, "0");
    const dd = String(wibTime.getDate()).padStart(2, "0");
    const tanggalHariIni = `${yyyy}-${mm}-${dd}`;

    const [pengaturansRaw, anggota] = await Promise.all([
      prisma.pengaturanSesi.findMany(),
      prisma.anggota.findUnique({ where: { id_anggota: cleanId } }),
    ]);

    let pengaturans = pengaturansRaw;
    if (pengaturans.length === 0) {
      pengaturans = [
        {
          id: 1,
          nama_sesi: "Morning",
          jam_mulai: "08:00",
          jam_selesai: "11:59",
        },
        {
          id: 2,
          nama_sesi: "Afternoon",
          jam_mulai: "13:00",
          jam_selesai: "16:59",
        },
        {
          id: 3,
          nama_sesi: "Evening",
          jam_mulai: "18:00",
          jam_selesai: "20:59",
        },
      ];
    }

    let sesiSaatIni = "Luar Jam";
    for (const sesi of pengaturans) {
      if (currentHHMM >= sesi.jam_mulai && currentHHMM <= sesi.jam_selesai) {
        if (sesi.nama_sesi === "Malam" && (hari === 0 || hari === 6)) continue;
        sesiSaatIni = sesi.nama_sesi;
        break;
      }
    }

    if (sesiSaatIni === "Luar Jam") {
      return NextResponse.json(
        {
          error:
            "Library is currently closed or on break. Please return during operating hours.",
        },
        { status: 403 },
      );
    }

    if (!anggota) {
      return NextResponse.json(
        {
          error: `ID (${cleanId}) is not registered. Please contact the librarian!`,
        },
        { status: 404 },
      );
    }

    const sudahAbsenDiSesiIni = await prisma.kehadiran.findFirst({
      where: {
        id_anggota: cleanId,
        sesi: sesiSaatIni,
        tanggal: tanggalHariIni,
      },
    });

    if (sudahAbsenDiSesiIni) {
      return NextResponse.json(
        {
          error: `You have already checked in for the ${sesiSaatIni} session!`,
        },
        { status: 403 },
      );
    }

    let updatedAnggota;
    try {
      const transactionResult = await prisma.$transaction([
        prisma.kehadiran.create({
          data: {
            id_anggota: anggota.id_anggota,
            sesi: sesiSaatIni,
            tanggal: tanggalHariIni,
          },
        }),
        prisma.anggota.update({
          where: { id_anggota: anggota.id_anggota },
          data: { total_kunjungan: { increment: 1 } },
        }),
      ]);
      updatedAnggota = transactionResult[1];
    } catch (error: any) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: `Hold on! You have already checked in for this session.`,
          },
          { status: 403 },
        );
      }
      throw error;
    }

    // ==============================================================
    //  LOGIKA BARU: DETEKSI SEMESTER BERSIH BERDASARKAN KALENDER (JAN-JUN & JUL-DES)
    // ==============================================================
    const currentMonth = wibTime.getMonth() + 1; // 1 s.d 12
    const currentYearNum = wibTime.getFullYear();
    let semStartDate = "";
    let semEndDate = "";

    if (currentMonth >= 1 && currentMonth <= 6) {
      // Semester 1 (Awal Tahun): 1 Januari s.d 30 Juni
      semStartDate = `${currentYearNum}-01-01`;
      semEndDate = `${currentYearNum}-06-30`;
    } else {
      // Semester 2 (Akhir Tahun): 1 Juli s.d 31 Desember
      semStartDate = `${currentYearNum}-07-01`;
      semEndDate = `${currentYearNum}-12-31`;
    }

    // 1. Hitung berapa kali SAYA sudah berkunjung di SEMESTER KALENDER INI
    const myCurrentSemesterVisits = await prisma.kehadiran.count({
      where: {
        id_anggota: anggota.id_anggota,
        tanggal: {
          gte: semStartDate,
          lte: semEndDate,
        },
      },
    });

    // 2. Ambil statistik kunjungan SEMUA ORANG dengan role yang sama khusus di SEMESTER INI
    const groupResults = await prisma.kehadiran.groupBy({
      by: ["id_anggota"],
      where: {
        tanggal: {
          gte: semStartDate,
          lte: semEndDate,
        },
        anggota: {
          role: anggota.role,
        },
      },
      _count: {
        id_anggota: true,
      },
    });

    // 3. Kalkulasi Ranking secara real-time di memori server
    let orangLebihRajin = 0;
    let orangPoinSamaLebihSenior = 0;

    groupResults.forEach((g) => {
      if (g.id_anggota === anggota.id_anggota) return;

      const totalKunjunganSmtIni = g._count.id_anggota;

      if (totalKunjunganSmtIni > myCurrentSemesterVisits) {
        orangLebihRajin++;
      } else if (
        totalKunjunganSmtIni === myCurrentSemesterVisits &&
        g.id_anggota < anggota.id_anggota
      ) {
        orangPoinSamaLebihSenior++;
      }
    });

    const rankingSaatIni = orangLebihRajin + orangPoinSamaLebihSenior + 1;
    // ==============================================================

    return NextResponse.json({
      success: true,
      nim: anggota.id_anggota,
      nama: anggota.nama,
      role: anggota.role,
      sesi: sesiSaatIni,
      waktu: currentHHMM,
      negara: anggota.negara || "ID",
      pulau: anggota.pulau || "",
      ranking: rankingSaatIni,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process attendance on the server." },
      { status: 500 },
    );
  }
}
