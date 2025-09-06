import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

function mapToUi(p: any) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    coverUrl: p.coverImage,
    published: p.published,
    created: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "Invalid id" });
  const pid = Number(id);
  if (Number.isNaN(pid)) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    const p = await prisma.post.findUnique({ where: { id: pid } });
    if (!p) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ post: mapToUi(p) });
  }

  if (req.method === "PATCH") {
    try {
      const { title, content, coverUrl, published } = req.body || {};
      const updated = await prisma.post.update({
        where: { id: pid },
        data: {
          ...(title !== undefined ? { title: String(title) } : {}),
          ...(content !== undefined ? { content: String(content) } : {}),
          ...(coverUrl !== undefined ? { coverImage: coverUrl || null } : {}),
          ...(published !== undefined ? { published: Boolean(published) } : {}),
        },
      });
      return res.status(200).json({ ok: true, post: mapToUi(updated) });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to update" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.post.delete({ where: { id: pid } });
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to delete" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).end("Method Not Allowed");
}
