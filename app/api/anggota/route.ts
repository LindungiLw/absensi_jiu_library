import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers"; // 🛡️ IMPORT KEAMANAN

export const dynamic = "force-dynamic";

// ==============================================================
// 1. MENGAMBIL DATA ANGGOTA (SEKARANG AMAN 🔒)
// ==============================================================
export async function GET(request: Request) {
  // 🛡️ BLOK PELINDUNG KEAMANAN
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Akses Ditolak! Anda tidak memiliki izin (Unauthorized)." },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const skip = (page - 1) * limit;

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

    const [
      daftarAnggota,
      totalRecords,
      countStudent,
      countLecturer,
      countStaff,
    ] = await Promise.all([
      prisma.anggota.findMany({
        where: whereClause,
        orderBy: { nama: "asc" },
        skip: skip,
        take: limit,
        include: { _count: { select: { kehadiran: true } } },
      }),
      prisma.anggota.count({ where: whereClause }),
      prisma.anggota.count({ where: { role: "student" } }),
      prisma.anggota.count({ where: { role: "lecturer" } }),
      prisma.anggota.count({ where: { role: "staff" } }),
    ]);

    const dataFormatted = daftarAnggota.map((anggota) => ({
      id_anggota: anggota.id_anggota,
      nama: anggota.nama,
      role: anggota.role,
      jurusan: anggota.jurusan,
      batch: anggota.batch,
      negara: anggota.negara || "ID",
      pulau: anggota.pulau || "",
      total_absensi: anggota._count.kehadiran,
    }));

    return NextResponse.json({
      success: true,
      data: dataFormatted,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords: totalRecords,
        stats: {
          student: countStudent,
          lecturer: countLecturer,
          staff: countStaff,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menarik data" }, { status: 500 });
  }
}

// ==============================================================
// 2. MENAMBAH ANGGOTA
// ==============================================================
export async function POST(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await request.json();
    if (Array.isArray(payload)) {
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
            negara: "ID",
            pulau: null,
          },
        });
      });
      await prisma.$transaction(operations);
      return NextResponse.json({
        success: true,
        message: `${payload.length} data anggota diproses!`,
      });
    } else {
      const cleanId = String(payload.id_anggota).trim();
      const cleanNama = String(payload.nama).trim();
      if (!cleanId || !cleanNama)
        return NextResponse.json(
          { error: "ID dan Nama wajib diisi!" },
          { status: 400 },
        );

      const cekId = await prisma.anggota.findUnique({
        where: { id_anggota: cleanId },
      });
      if (cekId)
        return NextResponse.json(
          { error: "ID ini sudah terdaftar!" },
          { status: 400 },
        );

      const anggotaBaru = await prisma.anggota.create({
        data: {
          id_anggota: cleanId,
          nama: cleanNama,
          role: payload.role,
          jurusan: payload.jurusan ? String(payload.jurusan).trim() : null,
          batch: payload.batch ? String(payload.batch).trim() : null,
          negara: payload.negara || "ID",
          pulau: payload.pulau ? String(payload.pulau).trim() : null,
        },
      });
      return NextResponse.json({
        success: true,
        message: "Anggota baru didaftarkan!",
        data: anggotaBaru,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses." }, { status: 500 });
  }
}

// ==========================================
// 3. MENGHAPUS ANGGOTA
// ==========================================
export async function DELETE(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id_anggota = searchParams.get("id");
    if (!id_anggota)
      return NextResponse.json(
        { error: "ID tidak ditemukan." },
        { status: 400 },
      );

    await prisma.anggota.delete({ where: { id_anggota: id_anggota } });
    return NextResponse.json({
      success: true,
      message: "Data anggota berhasil dihapus!",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus data." },
      { status: 500 },
    );
  }
}

// ==========================================
// 4. MENGUPDATE DATA ANGGOTA
// ==========================================
export async function PUT(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await request.json();
    const cleanId = String(payload.id_anggota).trim();
    const cleanNama = String(payload.nama).trim();

    if (!cleanId || !cleanNama)
      return NextResponse.json(
        { error: "ID dan Nama wajib diisi!" },
        { status: 400 },
      );

    const updatedAnggota = await prisma.anggota.update({
      where: { id_anggota: cleanId },
      data: {
        nama: cleanNama,
        role: payload.role,
        jurusan: payload.jurusan ? String(payload.jurusan).trim() : null,
        batch: payload.batch ? String(payload.batch).trim() : null,
        negara: payload.negara || "ID",
        pulau: payload.pulau ? String(payload.pulau).trim() : null,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Data anggota diperbarui!",
      data: updatedAnggota,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui data." },
      { status: 500 },
    );
  }
}
