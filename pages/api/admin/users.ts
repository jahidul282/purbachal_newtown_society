import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureAdmin } from "@/lib/server/auth";

function safeUser(u: any) {
  if (!u) return u;
  const { password: _omit, ...rest } = u;
  return rest;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Require admin auth for all methods
  const me = ensureAdmin(req, res);
  if (!me) return;
  // Support listing and creation on the same endpoint
  if (req.method === "GET") {
    try {
      const users = await prisma.managementUser.findMany({
        orderBy: { id: "desc" },
      });
      return res.status(200).json({ users: users.map(safeUser) });
    } catch (e: any) {
      return res
        .status(500)
        .json({ error: e?.message || "Failed to load users" });
    }
  }

  if (req.method === "POST") {
    try {
      // Helpful guard if Prisma Client wasn't regenerated after schema change
      const anyPrisma = prisma as any;
      if (!anyPrisma.managementUser) {
        return res.status(500).json({
          ok: false,
          error:
            "ManagementUser model not found in Prisma Client. Run: npx prisma migrate dev && npx prisma generate",
        });
      }

      const { photoUrl, name, phone, address, role, email, title, password } =
        req.body || {};

      const errors: string[] = [];
      if (!name) errors.push("name is required");
      if (!phone) errors.push("phone is required");
      if (!email) errors.push("email is required");
      if (!password) errors.push("password is required");
      if (!role) errors.push("role is required (ADMIN|EDITOR|VIEWER)");
      if (errors.length) return res.status(400).json({ ok: false, errors });

      const normalizedEmail = String(email).trim().toLowerCase();
      const roleUpper = String(role).trim().toUpperCase();
      const allowed = new Set(["ADMIN", "EDITOR", "VIEWER"]);
      if (!allowed.has(roleUpper))
        return res.status(400).json({
          ok: false,
          error: "Invalid role. Use ADMIN, EDITOR or VIEWER.",
        });

      const exists = await prisma.managementUser.findUnique({
        where: { email: normalizedEmail },
      });
      if (exists)
        return res
          .status(409)
          .json({ ok: false, error: "Email already exists" });

      const hash = await bcrypt.hash(String(password), 10);

      const created = await prisma.managementUser.create({
        data: {
          photoUrl: photoUrl || null,
          name: String(name),
          phone: String(phone),
          address: address || null,
          role: roleUpper as any,
          email: normalizedEmail,
          title: title || null,
          password: hash,
        },
      });

      return res.status(201).json({ ok: true, admin: safeUser(created) });
    } catch (e: any) {
      console.error(e);
      return res
        .status(500)
        .json({ ok: false, error: e?.message || "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
