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
const RAW_ALLOWED_ORIGINS = [
  process.env.CORS_ALLOW_ORIGIN,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : undefined,
].filter(Boolean) as string[];

const ALLOWED_ORIGINS = RAW_ALLOWED_ORIGINS
  .flatMap(value => value.split(","))
  .map(value => value.trim())
  .filter(Boolean);

const ALLOW_ANY_ORIGIN =
  ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes("*");

const BLOB_UPLOAD_PREFIX = process.env.BLOB_UPLOAD_PREFIX || "pns-membership";
const BLOB_ACCESS_LEVEL =
  process.env.BLOB_ACCESS_LEVEL === "private" ? "private" : "public";
const IS_VERCEL = Boolean(process.env.VERCEL);
const HAS_BLOB_TOKEN = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function resolveAllowedOrigin(originHeader?: string | null): string {
  if (ALLOW_ANY_ORIGIN) {
    return originHeader ?? "*";
  }

  if (originHeader && ALLOWED_ORIGINS.includes(originHeader)) {
    return originHeader;
  }

  return ALLOWED_ORIGINS[0] ?? originHeader ?? "*";
}

function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const originHeader = req.headers.origin ?? null;
  const origin = resolveAllowedOrigin(originHeader);

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", process.env.CORS_ALLOW_HEADERS || "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// normalize: File | File[] | undefined  -> single file or null
function pickFile(f: any): any | null {
  if (!f) return null;
  return Array.isArray(f) ? (f.length ? f[0] : null) : f;
}

// Persist upload either locally (dev) or to Vercel Blob in production
async function persistFile(input: any, fieldName: string): Promise<string | null> {
  const f = pickFile(input);
  if (!f) return null;

  const ext = path.extname(f.originalFilename || "");
  const base = (f.originalFilename || "file")
    .toString()
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const tmp: string | undefined = (f as any).filepath || (f as any).path;
  const mimetype: string | undefined = (f as any).mimetype || (f as any).type;

  if (!tmp || typeof tmp !== "string") {
    return null;
  }

  if (HAS_BLOB_TOKEN) {
    const key = `${BLOB_UPLOAD_PREFIX}/${Date.now()}-${fieldName}-${base}${ext}`.replace(/\+/g, "/");
    const uploadUrl = `https://blob.vercel-storage.com/${key}?access=${BLOB_ACCESS_LEVEL}`;
    const fileBuffer = fs.readFileSync(tmp);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": mimetype || "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Failed to upload ${fieldName} to blob storage (${response.status}): ${detail}`
      );
    }

    const data = (await response.json()) as { url?: string };
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore cleanup errors
    }
    if (!data?.url) {
      throw new Error(`Blob upload for ${fieldName} did not return a URL.`);
    }
    return data.url;
  }

  if (IS_VERCEL) {
    throw new Error(
      "File uploads require BLOB_READ_WRITE_TOKEN when running on Vercel. Configure Vercel Blob and set the token."
    );
  }

  ensureUploadsDir();

  const safeName = `${Date.now()}-${fieldName}-${base}${ext}`;
  const dest = path.join(UPLOAD_DIR, safeName);

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
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
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
    const ownershipProofUrl = await persistFile(
      files?.ownershipProofFile,
      "ownershipProof"
    );
    const ownerPhotoUrl = await persistFile(files?.ownerPhoto, "ownerPhoto");
    const paymentReceiptUrl = await persistFile(
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
