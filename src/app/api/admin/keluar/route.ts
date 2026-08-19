import { NextResponse } from "next/server";
import { COOKIE_ADMIN } from "@/lib/admin/sesi";

/** POST /api/admin/keluar — menghapus cookie sesi admin. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_ADMIN,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
