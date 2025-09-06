import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize as serializeCookie } from "cookie";
import { prisma } from "@/lib/prisma";

const ADMIN_COOKIE = "admin_token";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight on Vercel if any proxy triggers OPTIONS
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { email, password } = req.body || {};
    const rawEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "").trim();
    if (!rawEmail || !rawPassword) return res.status(400).json({ error: "Email and password are required" });

    const admin = await prisma.managementUser.findUnique({ where: { email: rawEmail } });
    if (!admin) return res.status(401).json({ error: "Invalid email or password" });
    const ok = bcrypt.compareSync(rawPassword, (admin as any).password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, secret, { expiresIn: "7d" });

    const host = req.headers.host || "";
    const isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    const cookie = serializeCookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: !isLocalhost && process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ ok: true, admin: { id: admin.id, email: admin.email, name: (admin as any).name, role: admin.role } });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Server error", detail: e?.message || "" });
  }
}
