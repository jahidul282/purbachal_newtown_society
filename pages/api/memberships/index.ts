import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/server/auth";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

type UiMember = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  membershipType?: string | null;
  status: string;
  joinedAt: string; // ISO
};

function mapUserToUi(m: any): UiMember {
  const toUiStatus: Record<string, string> = {
    APPROVED: "active",
    PENDING: "pending",
    REJECTED: "inactive",
  };
  return {
    id: String(m.id),
    name: m.ownerNameEnglish || m.ownerNameBangla || "Unnamed",
    email: m.email ?? null,
    phone: m.contactNumber ?? null,
    membershipType: "standard",
    status: toUiStatus[String(m.status)] || "pending",
    joinedAt: (m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt) || new Date().toISOString(),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ensureAdmin(req, res)) return;
  if (req.method === "GET") {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    const members: UiMember[] = users.map(mapUserToUi);
    return res.status(200).json({ members });
  }

  if (req.method === "POST") {
    try {
      const body = req.body;
      const rows: Array<any> = Array.isArray(body) ? body : [body];
      const created = [] as any[];
      const fromUiStatus: Record<string, any> = {
        active: "APPROVED",
        pending: "PENDING",
        inactive: "REJECTED",
      };
      for (const r of rows) {
        const email = (r.email && String(r.email).trim()) || `imported+${randomUUID()}@example.com`;
        const password = await bcrypt.hash(randomUUID(), 8);
        const user = await prisma.user.create({
          data: {
            sectorNumber: "NA",
            roadNumber: "NA",
            plotNumber: "NA",
            plotSize: "NA",
            ownershipProofType: "LD_TAX_RECEIPT",
            ownerNameEnglish: String(r.name || "Unnamed"),
            ownerNameBangla: String(r.name || "Unnamed"),
            contactNumber: String(r.phone || ""),
            nidNumber: "NA",
            presentAddress: "NA",
            permanentAddress: "NA",
            email,
            password,
            paymentMethod: "BKASH",
            membershipFee: 1020,
            agreeDataUse: false,
            status: fromUiStatus[String(r.status || "active")] || "APPROVED",
            createdAt: r.joinedAt ? new Date(r.joinedAt) : undefined,
          },
        });
        created.push(user);
      }
      return res.status(200).json({ ok: true, count: created.length });
    } catch (e: any) {
      return res.status(400).json({ ok: false, error: e?.message || "Invalid payload" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}
