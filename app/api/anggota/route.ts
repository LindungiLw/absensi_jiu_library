import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

// ==============================================================
// 1. MENGAMBIL DATA ANGGOTA (PAGINASI, SEARCH, & STATISTIK)
// ==============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Ambil parameter dari Frontend (Default: Halaman 1, Limit 50)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const skip = (page - 1) * limit;

    // Filter Pintar di sisi MySQL
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { id_anggota: { contains: search } },
        { nama: { contains: search } },
        { batch: { contains: search } },
        { jurusan: { contains: search } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    // 🔥 PERBAIKAN: Tarik data Anggota + Hitung Total Keseluruhan (Sangat Cepat karena paralel)
    const [
      daftarAnggota,
      totalRecords,
      countStudent,
      countLecturer,
      countStaff,
    ] = await Promise.all([
      prisma.anggota.findMany({
        where: whereClause,
        orderBy: { nama: "asc" }, // Urut Abjad
        skip: skip,
        take: limit, // Batasi jumlah data (50 baris)
        include: {
          _count: {
            select: { kehadiran: true },
          },
        },
      }),
      prisma.anggota.count({
        where: whereClause, // Hitung total seluruh data yang cocok
      }),
      prisma.anggota.count({ where: { role: "student" } }),
      prisma.anggota.count({ where: { role: "lecturer" } }),
      prisma.anggota.count({ where: { role: "staff" } }),
    ]);

    // Format ulang objeknya termasuk kolom negara dan pulau untuk UI
    const dataFormatted = daftarAnggota.map((anggota) => ({
      id_anggota: anggota.id_anggota,
      nama: anggota.nama,
      role: anggota.role,
      jurusan: anggota.jurusan,
      batch: anggota.batch,
      negara: anggota.negara || "ID", // Mengirim data negara ke frontend
      pulau: anggota.pulau || "", // Mengirim data pulau ke frontend
      total_absensi: anggota._count.kehadiran,
    }));

    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      success: true,
      data: dataFormatted,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        // 🔥 Kirim data statistik ke frontend untuk kotak mini dashboard
        stats: {
          student: countStudent,
          lecturer: countLecturer,
          staff: countStaff,
        },
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data anggota:", error);
    return NextResponse.json({ error: "Gagal menarik data" }, { status: 500 });
  }
}

// ==============================================================
// 2. MENAMBAH ANGGOTA (MANUAL DENGAN NEGARA/PULAU & EXCEL MASSAL)
// ==============================================================
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (Array.isArray(payload)) {
      // JALUR EXCEL MASSAL: Otomatis set default Indonesia ("ID")
      const operations = payload.map((item: any) => {
        const cleanId = String(item.id_anggota).trim();
        const cleanNama = String(item.nama).trim();
        return prisma.anggota.upsert({
          where: { id_anggota: cleanId },
          update: {
            nama: cleanNama,
            role: item.role,
            jurusan: item.jurusan ? String(item.jurusan).trim() : null,
            batch: item.batch ? String(item.batch).trim() : null,
          },
          create: {
            id_anggota: cleanId,
            nama: cleanNama,
            role: item.role,
            jurusan: item.jurusan ? String(item.jurusan).trim() : null,
            batch: item.batch ? String(item.batch).trim() : null,
            negara: "ID", // Default Indonesia saat import excel masal
            pulau: null,
          },
        });
      });

      await prisma.$transaction(operations);
      return NextResponse.json({
        success: true,
        message: `${payload.length} data anggota berhasil diproses dengan aman!`,
      });
    } else {
      // JALUR PENDAFTARAN MANUAL
      const cleanId = String(payload.id_anggota).trim();
      const cleanNama = String(payload.nama).trim();

      if (!cleanId || !cleanNama) {
        return NextResponse.json(
          { error: "ID dan Nama wajib di isi!" },
          { status: 400 },
        );
      }

      const cekId = await prisma.anggota.findUnique({
        where: { id_anggota: cleanId },
      });

      if (cekId) {
        return NextResponse.json(
          { error: "ID ini sudah terdaftar!" },
          { status: 400 },
        );
      }

      const anggotaBaru = await prisma.anggota.create({
        data: {
          id_anggota: cleanId,
          nama: cleanNama,
          role: payload.role,
          jurusan: payload.jurusan ? String(payload.jurusan).trim() : null,
          batch: payload.batch ? String(payload.batch).trim() : null,
          negara: payload.negara || "ID", // Menyimpan data negara pilihan admin
          pulau: payload.pulau ? String(payload.pulau).trim() : null, // Menyimpan data pulau pilihan admin
        },
      });

      return NextResponse.json({
        success: true,
        message: "Anggota baru berhasil didaftarkan!",
        data: anggotaBaru,
      });
    }
  } catch (error) {
    console.error("API Anggota Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses data database." },
      { status: 500 },
    );
  }
}

// ==========================================
// 3. MENGHAPUS ANGGOTA (TETAP SAMA)
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_anggota = searchParams.get("id");

    if (!id_anggota) {
      return NextResponse.json(
        { error: "ID anggota tidak ditemukan." },
        { status: 400 },
      );
    }

    await prisma.anggota.delete({
      where: { id_anggota: id_anggota },
    });

    return NextResponse.json({
      success: true,
      message:
        "Data anggota (beserta riwayat absensinya) berhasil dihapus permanen!",
    });
  } catch (error) {
    console.error("API Hapus Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data dari server." },
      { status: 500 },
    );
  }
}

// ==========================================
// 4. MENGUPDATE DATA ANGGOTA (EDIT DATA)
// ==========================================
export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const cleanId = String(payload.id_anggota).trim();
    const cleanNama = String(payload.nama).trim();

    if (!cleanId || !cleanNama) {
      return NextResponse.json(
        { error: "ID dan Nama wajib diisi!" },
        { status: 400 },
      );
    }

    const updatedAnggota = await prisma.anggota.update({
      where: { id_anggota: cleanId },
      data: {
        nama: cleanNama,
        role: payload.role,
        jurusan: payload.jurusan ? String(payload.jurusan).trim() : null,
        batch: payload.batch ? String(payload.batch).trim() : null,
        negara: payload.negara || "ID", // Mengupdate data negara dari admin panel
        pulau: payload.pulau ? String(payload.pulau).trim() : null, // Mengupdate data pulau dari admin panel
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data anggota berhasil diperbarui!",
      data: updatedAnggota,
    });
  } catch (error) {
    console.error("API Update Error:", error);
    return NextResponse.json(
      {
        error:
          "Gagal memperbarui data. ID tidak ditemukan atau terjadi kesalahan server.",
      },
      { status: 500 },
    );
  }
}
