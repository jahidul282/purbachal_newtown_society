import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureAdmin } from "@/lib/server/auth";

function safeUser(u: any) {
  if (!u) return u;
  const { password: _omit, ...rest } = u;
  return rest;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "Invalid id" });
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    try {
      const user = await prisma.managementUser.findUnique({ where: { id: numericId } });
      if (!user) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ user: safeUser(user) });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to load" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { photoUrl, name, phone, address, role, email, title, password } = req.body || {};
      const data: any = {};
      if (photoUrl !== undefined) data.photoUrl = photoUrl || null;
      if (name !== undefined) data.name = String(name);
      if (phone !== undefined) data.phone = String(phone);
      if (address !== undefined) data.address = address || null;
      if (title !== undefined) data.title = title || null;
      if (email !== undefined) data.email = String(email).trim().toLowerCase();
      if (role !== undefined) {
        const allowed = new Set(["ADMIN", "EDITOR", "VIEWER"]);
        const roleUpper = String(role).trim().toUpperCase();
        if (!allowed.has(roleUpper)) return res.status(400).json({ ok: false, error: "Invalid role" });
        data.role = roleUpper as any;
      }
      if (password) data.password = await bcrypt.hash(String(password), 10);

      const updated = await prisma.managementUser.update({ where: { id: numericId }, data });
      return res.status(200).json({ ok: true, user: safeUser(updated) });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "Failed to update" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.managementUser.delete({ where: { id: numericId } });
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "Failed to delete" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).end("Method Not Allowed");
}
