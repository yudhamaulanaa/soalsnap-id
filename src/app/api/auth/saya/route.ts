import { NextResponse } from "next/server";
import { penggunaSaatIni } from "@/lib/auth/sesi";

/** GET /api/auth/saya — status masuk untuk header. */
export async function GET() {
  const pengguna = await penggunaSaatIni();
  return NextResponse.json(
    { pengguna },
    // Status masuk tidak boleh mengendap di cache bersama.
    { headers: { "Cache-Control": "no-store" } },
  );
}
