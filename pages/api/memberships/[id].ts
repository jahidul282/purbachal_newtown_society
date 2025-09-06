import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/server/auth";

function mapUserFull(m: any) {
  return {
    id: m.id,
    sectorNumber: m.sectorNumber,
    roadNumber: m.roadNumber,
    plotNumber: m.plotNumber,
    plotSize: m.plotSize,
    ownershipProofType: m.ownershipProofType,
    ownershipProofFile: m.ownershipProofFile,
    ownerNameEnglish: m.ownerNameEnglish,
    ownerNameBangla: m.ownerNameBangla,
    contactNumber: m.contactNumber,
    nidNumber: m.nidNumber,
    presentAddress: m.presentAddress,
    permanentAddress: m.permanentAddress,
    email: m.email,
    ownerPhoto: m.ownerPhoto,
    paymentMethod: m.paymentMethod,
    bkashTransactionId: m.bkashTransactionId,
    bkashAccountNumber: m.bkashAccountNumber,
    bankAccountNumberFrom: m.bankAccountNumberFrom,
    paymentReceipt: m.paymentReceipt,
    membershipFee: m.membershipFee,
    agreeDataUse: m.agreeDataUse,
    status: m.status,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "Invalid id" });
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({ where: { id: numericId } });
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ member: mapUserFull(user) });
  }

  if (req.method === "PATCH") {
    try {
      const { status } = req.body as { status?: string };
      const allowed = new Set(["active", "pending", "inactive"]);
      if (!status || !allowed.has(String(status))) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      const mapFromUiToDb: Record<string, any> = {
        active: "APPROVED",
        pending: "PENDING",
        inactive: "REJECTED",
      };
      const updated = await prisma.user.update({ where: { id: numericId }, data: { status: mapFromUiToDb[String(status)] } });
      return res.status(200).json({ ok: true, member: mapUserFull(updated) });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "Failed to update" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Clean up related posts (if any) before deleting the user
      await prisma.$transaction([
        prisma.post.deleteMany({ where: { authorId: numericId } }),
        prisma.user.delete({ where: { id: numericId } }),
      ]);
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "Failed to delete" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).end("Method Not Allowed");
}
