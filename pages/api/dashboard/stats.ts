import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/server/auth";

type Resp = {
  // Membership
  total: number;
  active: number;
  pending: number;
  inactive: number;
  byType: Record<string, number>;
  // Management users
  adminUsers: number;
  // Posts
  postsTotal: number;
  postsPublished: number;
  postsDraft: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (!ensureAdmin(req, res)) return;
  // Membership (Prisma User model)
  const users = await prisma.user.findMany({ select: { status: true } });
  const total = users.length;
  const active = users.filter(u => (u as any).status === "active").length;
  const pending = users.filter(u => (u as any).status === "pending").length;
  const inactive = users.filter(u => (u as any).status === "inactive").length;
  const byType: Record<string, number> = { standard: total };

  // Management users
  const adminUsers = await prisma.managementUser.count();

  // Posts (DB-backed)
  const postsTotal = await prisma.post.count();
  const postsPublished = await prisma.post.count({ where: { published: true } });
  const postsDraft = postsTotal - postsPublished;

  res.status(200).json({ total, active, pending, inactive, byType, adminUsers, postsTotal, postsPublished, postsDraft });
}
