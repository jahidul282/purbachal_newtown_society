// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize as serializeCookie } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const host = req.headers.host || "";
  const isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);

  // Invalidate cookie
  const cookie = serializeCookie("pns_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: !isLocalhost && process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok: true });
}

