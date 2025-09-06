import type { NextApiRequest, NextApiResponse } from "next";
import { serialize as serializeCookie } from "cookie";

const ADMIN_COOKIE = "admin_token";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const cookie = serializeCookie(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok: true });
}

