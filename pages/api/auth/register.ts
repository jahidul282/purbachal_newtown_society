// pages/api/auth/register-pns-membership.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const config = {
  api: { bodyParser: false },
};

// ----- uploads dir -----
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// normalize: File | File[] | undefined  -> single file or null
function pickFile(f: any): any | null {
  if (!f) return null;
  return Array.isArray(f) ? (f.length ? f[0] : null) : f;
}

// move temp file to /public/uploads and return public url
function moveToUploads(input: any, fieldName: string): string | null {
  const f = pickFile(input);
  if (!f) return null;

  ensureUploadsDir();

  const ext = path.extname(f.originalFilename || "");
  const base = (f.originalFilename || "file")
    .toString()
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const safeName = `${Date.now()}-${fieldName}-${base}${ext}`;
  const dest = path.join(UPLOAD_DIR, safeName);

  // formidable v2/v3: f.filepath, older: f.path
  const tmp: string | undefined = (f as any).filepath || (f as any).path;
  if (!tmp || typeof tmp !== "string") {
    // Extra guard to avoid undefined oldPath
    return null;
  }

  try {
    fs.renameSync(tmp, dest);
  } catch (err: any) {
    // cross-device move fallback
    if (err?.code === "EXDEV") {
      fs.copyFileSync(tmp, dest);
      fs.unlinkSync(tmp);
    } else {
      throw err;
    }
  }
  return `/uploads/${safeName}`;
}

function parseBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1) parse multipart
    const form = formidable({
      multiples: true, // safe even if single files
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    });

    const { fields, files }: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) =>
        err ? reject(err) : resolve({ fields: flds, files: fls })
      );
    });

    // 2) basic server-side checks
    const rawEmail = String(fields?.email || "")
      .trim()
      .toLowerCase();
    if (!rawEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    // ✅ NEW: password support
    const rawPassword = String(fields?.password || "").trim();
    if (!rawPassword) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (rawPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }
    // Hash (bcryptjs sync is fine for single request)
    const passwordHash = bcrypt.hashSync(rawPassword, 10);

    // 3) save files
    const ownershipProofUrl = moveToUploads(
      files?.ownershipProofFile,
      "ownershipProof"
    );
    const ownerPhotoUrl = moveToUploads(files?.ownerPhoto, "ownerPhoto");
    const paymentReceiptUrl = moveToUploads(
      files?.paymentReceipt,
      "paymentReceipt"
    );

    // 4) map fields
    const ownershipProofType = String(
      fields?.ownershipProofType || "LD_TAX_RECEIPT"
    );
    const paymentMethod = String(fields?.paymentMethod || "BKASH");
    const membershipFee = Number(fields?.membershipFee ?? 1020) || 1020;
    const agreeDataUse = parseBool(fields?.agreeDataUse);

    // 5) prisma create
    const user = await prisma.user.create({
      data: {
        // Plot info
        sectorNumber: String(fields?.sectorNumber || "").trim(),
        roadNumber: String(fields?.roadNumber || "").trim(),
        plotNumber: String(fields?.plotNumber || "").trim(),
        plotSize: String(fields?.plotSize || "").trim(),

        // Ownership proof
        ownershipProofType: ownershipProofType as any,
        ownershipProofFile: ownershipProofUrl,

        // Owner info
        ownerNameEnglish: String(fields?.ownerNameEnglish || "").trim(),
        ownerNameBangla: String(fields?.ownerNameBangla || "").trim(),
        contactNumber: String(fields?.contactNumber || "").trim(),
        nidNumber: String(fields?.nidNumber || "").trim(),
        presentAddress: String(fields?.presentAddress || "").trim(),
        permanentAddress: String(fields?.permanentAddress || "").trim(),
        email: rawEmail,
        ownerPhoto: ownerPhotoUrl,

        // ✅ NEW: save hashed password
        password: passwordHash,

        // Payment
        paymentMethod: paymentMethod as any,
        bkashTransactionId: fields?.bkashTransactionId
          ? String(fields.bkashTransactionId).trim()
          : null,
        bkashAccountNumber: fields?.bkashAccountNumber
          ? String(fields.bkashAccountNumber).trim()
          : null,
        bankAccountNumberFrom: fields?.bankAccountNumberFrom
          ? String(fields.bankAccountNumberFrom).trim()
          : null,
        paymentReceipt: paymentReceiptUrl,

        membershipFee,
        agreeDataUse,
      },
    });

    return res.status(201).json({ id: user.id, ok: true });
  } catch (e: any) {
    if (e?.code === "P2002") {
      // unique constraint (likely email)
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(e);
    return res
      .status(500)
      .json({ error: "Server error", detail: e?.message ?? String(e) });
  }
}
