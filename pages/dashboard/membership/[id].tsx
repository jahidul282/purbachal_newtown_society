import React from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Link as MLink,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import DashboardLayout from "@/components/dashboard/Layout";
import { getJSON } from "@/lib/api";
import EditIcon from "@mui/icons-material/Edit";

const HERO_IMG =
  "https://www.hellopurbachal.com/wp-content/uploads/2022/08/Purbachal-300-ft-bridge.jpg";

type Member = {
  id: number;
  sectorNumber: string;
  roadNumber: string;
  plotNumber: string;
  plotSize: string;
  ownershipProofType: string;
  ownershipProofFile?: string | null;
  ownerNameEnglish: string;
  ownerNameBangla: string;
  contactNumber: string;
  nidNumber: string;
  presentAddress: string;
  permanentAddress: string;
  email: string;
  ownerPhoto?: string | null;
  paymentMethod: string;
  bkashTransactionId?: string | null;
  bkashAccountNumber?: string | null;
  bankAccountNumberFrom?: string | null;
  paymentReceipt?: string | null;
  membershipFee: number;
  agreeDataUse: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function MemberDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data, isLoading, error, mutate } = useSWR<{ member: Member }>(id ? `/api/memberships/${id}` : null, getJSON);
  const p = data?.member;

  async function onChangeStatus() {
    const result = await Swal.fire({
      title: "Update status",
      input: "select",
      inputOptions: {
        active: "Active",
        pending: "Pending",
        inactive: "Inactive",
      },
      inputValue: p?.status || "pending",
      showCancelButton: true,
      confirmButtonText: "Update",
    });
    if (!result.isConfirmed) return;
    const next = result.value as string;
    try {
      const res = await fetch(`/api/memberships/${id}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      await mutate();
      Swal.fire({ icon: "success", title: "Status updated", timer: 1200, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Failed", text: e?.message || "Could not update status" });
    }
  }

  async function onDelete() {
    const result = await Swal.fire({
      title: "Delete member?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await Swal.fire({ title: "Deleted", text: "Member removed successfully.", icon: "success", timer: 1400, showConfirmButton: false });
      router.push("/dashboard/membership");
    } catch (e: any) {
      Swal.fire({ title: "Failed", text: e?.message || "Could not delete member.", icon: "error" });
    }
  }

  return (
    <DashboardLayout>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Alert severity="warning">Failed to load member</Alert>
        </Container>
      ) : !p ? (
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Alert severity="info">No member data found.</Alert>
        </Container>
      ) : (
        <>
          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 180, md: 240 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              textAlign: "center",
              backgroundImage: `linear-gradient( to bottom, rgba(0,0,0,.45), rgba(0,0,0,.55) ), url(${HERO_IMG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              overflow: "hidden",
            }}
          >
            <Container maxWidth="lg">
              <Stack spacing={1} sx={{ position: "relative", zIndex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, textShadow: "0 2px 12px rgba(0,0,0,.4)", fontSize: { xs: 28, md: 36 } }}>
                  Member Profile
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Registration details overview
                </Typography>
              </Stack>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ transform: "translateY(-24px)" }}>
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Review the membership registration information below.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => router.back()}>
                      Back
                    </Button>
                    <Button size="small" color="error" variant="contained" onClick={onDelete}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Container>

          <Container maxWidth="lg" sx={{ pt: 2, pb: { xs: 4, md: 6 } }}>
            <Stack spacing={3}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
                <CardHeader
                  avatar={
                    p.ownerPhoto ? (
                      <Avatar src={p.ownerPhoto} sx={{ width: 56, height: 56 }} />
                    ) : (
                      <Avatar sx={{ width: 56, height: 56 }}>
                        {p.ownerNameEnglish?.[0]?.toUpperCase() || p.email?.[0]?.toUpperCase()}
                      </Avatar>
                    )
                  }
                  title={p.ownerNameEnglish || "Member"}
                  subheader={p.email}
                  action={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                      <Chip size="small" label={p.status} color={p.status === "active" ? "success" : p.status === "pending" ? "warning" : "default"} />
                      <Tooltip title="Update status">
                        <IconButton size="small" onClick={onChangeStatus}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />
                <CardContent>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Section title="Plot Information">
                        <KV label="Sector" value={p.sectorNumber} />
                        <KV label="Road" value={p.roadNumber} />
                        <KV label="Plot" value={p.plotNumber} />
                        <KV label="Size" value={p.plotSize} />
                      </Section>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Section title="Ownership Proof">
                        <KV label="Type" value={p.ownershipProofType} />
                        <KV
                          label="Document"
                          value={
                            p.ownershipProofFile ? (
                              <MLink component={Link} href={p.ownershipProofFile} target="_blank">View file</MLink>
                            ) : (
                              "—"
                            )
                          }
                        />
                      </Section>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Section title="Owner Information">
                        <KV label="Name (English)" value={p.ownerNameEnglish} />
                        <KV label="Name (Bangla)" value={p.ownerNameBangla} />
                        <KV label="Contact" value={p.contactNumber} />
                        <KV label="NID" value={p.nidNumber} />
                        <KV label="Present Address" value={p.presentAddress} />
                        <KV label="Permanent Address" value={p.permanentAddress} />
                      </Section>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Section title="Payment">
                        <KV label="Method" value={p.paymentMethod} />
                        {p.paymentMethod === "BKASH" ? (
                          <>
                            <KV label="bKash Txn ID" value={p.bkashTransactionId || "—"} />
                            <KV label="bKash Account" value={p.bkashAccountNumber || "—"} />
                          </>
                        ) : (
                          <KV label="Bank Account (Sender)" value={p.bankAccountNumberFrom || "—"} />
                        )}
                        <KV
                          label="Receipt"
                          value={
                            p.paymentReceipt ? (
                              <MLink component={Link} href={p.paymentReceipt} target="_blank">View receipt</MLink>
                            ) : (
                              "—"
                            )
                          }
                        />
                        <KV label="Fee" value={`BDT ${p.membershipFee}`} />
                      </Section>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Section title="Meta">
                        <KV label="Agree to Data Use" value={p.agreeDataUse ? "Yes" : "No"} />
                        <KV label="Created" value={new Date(p.createdAt).toLocaleString()} />
                        <KV label="Updated" value={new Date(p.updatedAt).toLocaleString()} />
                      </Section>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Container>
        </>
      )}
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Stack spacing={0.5}>{children}</Stack>
    </Box>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value ?? "—"}</Typography>
    </Stack>
  );
}
