"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR yang mengarah ke tautan siswa (FR-SH-2). Ditampilkan besar untuk proyektor. */
export function QrCode({ url, size = 76 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    QRCode.toDataURL(url, {
      margin: 1,
      width: size * 3,
      color: { dark: "#182420", light: "#FFFFFF" },
    })
      .then((data) => {
        if (!batal) setSrc(data);
      })
      .catch(() => {
        if (!batal) setSrc(null);
      });
    return () => {
      batal = true;
    };
  }, [url, size]);

  return (
    <div
      className="shrink-0 overflow-hidden rounded-lg border-[1.5px] border-ink bg-surface"
      style={{ width: size, height: size }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, tanpa optimasi
        <img src={src} alt={`Kode QR untuk ${url}`} width={size} height={size} />
      )}
    </div>
  );
}
