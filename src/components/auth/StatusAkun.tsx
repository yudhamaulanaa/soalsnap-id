"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Pengguna {
  id: string;
  email: string;
  nama: string | null;
}

/**
 * Status masuk di header.
 *
 * Datanya diambil sendiri, bukan dioper dari tiap halaman: header dipakai di
 * banyak layar, dan menambahkan prop wajib ke semuanya hanya untuk satu tautan
 * tidak sepadan.
 */
export function StatusAkun() {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch("/api/auth/saya")
      .then((r) => r.json())
      .then((d: { pengguna: Pengguna | null }) => {
        if (batal) return;
        setPengguna(d.pengguna);
        setSelesai(true);
      })
      .catch(() => !batal && setSelesai(true));
    return () => {
      batal = true;
    };
  }, []);

  // Selama status belum diketahui, tidak ada yang ditampilkan — tautan "Masuk"
  // yang berkedip lalu berganti nama akun lebih mengganggu daripada menunggu.
  if (!selesai) return null;

  if (!pengguna) {
    return (
      <Link
        href="/masuk"
        className="rounded-full px-3 py-2 text-sm font-semibold text-ink-2 no-underline transition-colors hover:text-teal hover:no-underline"
      >
        Masuk
      </Link>
    );
  }

  return (
    <Link
      href="/soal-saya"
      title={pengguna.email}
      className="rounded-full px-3 py-2 text-sm font-semibold text-ink-2 no-underline transition-colors hover:text-teal hover:no-underline"
    >
      Soal Saya
    </Link>
  );
}
