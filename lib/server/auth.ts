import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export type AdminJwt = { sub: number; email: string; role?: string; iat?: number; exp?: number };

export function getCookie(req: NextApiRequest, name: string): string | null {
  const raw = req.headers.cookie || "";
  const found = raw.split(/;\s*/).map(p => p.split("=")).find(([k]) => k === name)?.[1];
  return found ? decodeURIComponent(found) : null;
}

export function ensureAdmin(req: NextApiRequest, res: NextApiResponse): AdminJwt | null {
  try {
    const token = getCookie(req, "admin_token");
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret) as unknown as AdminJwt;
    if (!payload?.sub) throw new Error("Invalid token payload");
    return payload;
  } catch {
    try { res.status(401).json({ error: "Unauthorized" }); } catch {}
    return null;
  }
}
