// pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

function getTokenFromCookie(req: NextApiRequest): string | null {
  const cookie = req.headers.cookie || "";
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === "pns_token") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const token = getTokenFromCookie(req);
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const secret = process.env.JWT_SECRET || "dev-secret";
    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = Number(payload?.sub);
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Return all registration-time fields (exclude password)
    const profile = {
      id: user.id,
      sectorNumber: user.sectorNumber,
      roadNumber: user.roadNumber,
      plotNumber: user.plotNumber,
      plotSize: user.plotSize,
      ownershipProofType: user.ownershipProofType,
      ownershipProofFile: user.ownershipProofFile,
      ownerNameEnglish: user.ownerNameEnglish,
      ownerNameBangla: user.ownerNameBangla,
      contactNumber: user.contactNumber,
      nidNumber: user.nidNumber,
      presentAddress: user.presentAddress,
      permanentAddress: user.permanentAddress,
      email: user.email,
      ownerPhoto: user.ownerPhoto,
      paymentMethod: user.paymentMethod,
      bkashTransactionId: user.bkashTransactionId,
      bkashAccountNumber: user.bkashAccountNumber,
      bankAccountNumberFrom: user.bankAccountNumberFrom,
      paymentReceipt: user.paymentReceipt,
      membershipFee: user.membershipFee,
      agreeDataUse: user.agreeDataUse,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({ ok: true, profile });
  } catch (e: any) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Server error", detail: e?.message ?? String(e) });
  }
}

