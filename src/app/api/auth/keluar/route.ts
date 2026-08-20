import { NextResponse } from "next/server";
import { COOKIE_SESI } from "@/lib/auth/sesi";

/** POST /api/auth/keluar — menghapus cookie sesi pengguna. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_SESI,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
