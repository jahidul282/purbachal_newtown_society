import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type DbPost = {
  id: number;
  title: string;
  content: string | null;
  coverImage: string | null;
  published: boolean;
  createdAt: Date;
};

type UiPost = { id: number; title: string; content?: string | null; coverUrl?: string | null; published: boolean; created: string };

function mapToUi(p: DbPost): UiPost {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    coverUrl: p.coverImage,
    published: p.published,
    created: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  };
}

async function getDefaultAuthorId(): Promise<number> {
  // Prefer first existing User as author
  const first = await prisma.user.findFirst({ select: { id: true }, orderBy: { id: "asc" } });
  if (first) return first.id;
  // Otherwise create a placeholder system author
  const password = await bcrypt.hash("SystemAuthor#123", 10);
  const u = await prisma.user.create({
    data: {
      sectorNumber: "NA",
      roadNumber: "NA",
      plotNumber: "NA",
      plotSize: "NA",
      ownershipProofType: "LD_TAX_RECEIPT" as any,
      ownerNameEnglish: "System Author",
      ownerNameBangla: "System Author",
      contactNumber: "0000000000",
      nidNumber: "NA",
      presentAddress: "NA",
      permanentAddress: "NA",
      email: "system.author@example.com",
      ownerPhoto: null,
      password,
      paymentMethod: "BKASH" as any,
      membershipFee: 0,
      agreeDataUse: false,
      status: "APPROVED" as any,
    },
  });
  return u.id;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;

  if (req.method === "GET") {
    const items = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
    return res.status(200).json({ posts: items.map(mapToUi) });
  }

  if (req.method === "POST") {
    try {
      const { title, content, coverUrl, published } = req.body || {};
      if (!title || !content) return res.status(400).json({ error: "title and content are required" });
      const authorId = await getDefaultAuthorId();
      const created = await prisma.post.create({
        data: {
          title: String(title),
          content: String(content),
          coverImage: coverUrl || null,
          published: Boolean(published),
          authorId,
        },
      });
      return res.status(201).json({ ok: true, post: mapToUi(created as unknown as DbPost) });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to create" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}
