// pages/api/profile/photo.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const config = {
  api: { bodyParser: false },
};

function ensureUploadsDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function pickFile(f: any): any | null {
  if (!f) return null;
  return Array.isArray(f) ? (f.length ? f[0] : null) : f;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1) Auth via JWT cookie
    const cookie = req.headers.cookie || "";
    const token = cookie
      .split(/;\s*/)
      .map(p => p.split("="))
      .find(([k]) => k === "pns_token")?.[1];
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const secret = process.env.JWT_SECRET || "dev-secret";
    let payload: any;
    try {
      payload = jwt.verify(decodeURIComponent(token), secret);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = Number(payload?.sub);
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    // 2) Parse multipart form
    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    });
    const { files }: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, fls) => (err ? reject(err) : resolve({ files: fls })));
    });

    const f = pickFile(files?.photo);
    if (!f) return res.status(400).json({ error: "No photo uploaded" });

    const mime = (f.mimetype || f.type || "").toString();
    if (!mime.startsWith("image/")) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // 3) Move to /public/uploads
    const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
    ensureUploadsDir(UPLOAD_DIR);
    const ext = path.extname(f.originalFilename || "");
    const safeBase = (f.originalFilename || "avatar")
      .toString()
      .replace(/\s+/g, "_")
      .slice(0, 40);
    const filename = `${Date.now()}-avatar-${safeBase}${ext || ".jpg"}`;
    const dest = path.join(UPLOAD_DIR, filename);
    const tmp: string | undefined = (f as any).filepath || (f as any).path;
    if (!tmp || typeof tmp !== "string") {
      return res.status(400).json({ error: "Invalid upload" });
    }
    try {
      fs.renameSync(tmp, dest);
    } catch (err: any) {
      if (err?.code === "EXDEV") {
        fs.copyFileSync(tmp, dest);
        fs.unlinkSync(tmp);
      } else {
        throw err;
      }
    }
    const publicUrl = `/uploads/${filename}`;

    // 4) Delete old local file if any (only if it's in /uploads)
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { ownerPhoto: true } });
    if (existing?.ownerPhoto && existing.ownerPhoto.startsWith("/uploads/")) {
      const oldPath = path.join(process.cwd(), "public", existing.ownerPhoto.replace(/^\/+/, ""));
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {}
      }
    }

    // 5) Update user
    await prisma.user.update({ where: { id: userId }, data: { ownerPhoto: publicUrl } });

    return res.status(200).json({ ok: true, url: publicUrl });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Server error", detail: e?.message ?? String(e) });
  }
}
