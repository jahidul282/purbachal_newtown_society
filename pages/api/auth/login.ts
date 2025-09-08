// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize as serializeCookie } from "cookie";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, password } = req.body || {};

    const rawEmail = String(email || "")
      .trim()
      .toLowerCase();
    const rawPassword = String(password || "").trim();

    if (!rawEmail || !rawPassword) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (!user || !user.password) {
      // Avoid leaking which part failed
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = bcrypt.compareSync(rawPassword, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Minimal payload (no sensitive fields)
    const payload = {
      id: user.id,
      email: user.email,
      name: user.ownerNameEnglish,
      status: user.status,
    };

    // Issue JWT and set HttpOnly cookie
    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });
    const host = req.headers.host || "";
    const isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    const cookie = serializeCookie("pns_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // In production over HTTP (localhost), avoid Secure so browser accepts it
      secure: !isLocalhost && process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    res.setHeader("Set-Cookie", cookie);
    const accepts = String(req.headers.accept || "");
    const ctype = String((req.headers as any)["content-type"] || "");
    const wantsHtml = accepts.includes("text/html") || ctype.includes("application/x-www-form-urlencoded");
    if (wantsHtml) {
      res.statusCode = 303;
      res.setHeader("Location", "/profile");
      return res.end();
    }

    return res.status(200).json({ ok: true, user: payload });
  } catch (e: any) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Server error", detail: e?.message ?? String(e) });
  }
}
