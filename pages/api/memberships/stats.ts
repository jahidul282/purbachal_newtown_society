import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;
  const users = await prisma.user.findMany({ select: { status: true } });
  const total = users.length;
  const active = users.filter(u => (u as any).status === "APPROVED").length;
  const pending = users.filter(u => (u as any).status === "PENDING").length;
  const inactive = users.filter(u => (u as any).status === "REJECTED").length;
  const byType: Record<string, number> = { standard: total };
  res.status(200).json({ total, active, pending, inactive, byType });
}
