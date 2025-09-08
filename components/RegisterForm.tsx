import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Container,
  Chip,
} from "@mui/material";
import Link from "next/link";
import Head from "next/head";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

// 🖼️ Hero background (internet image)
const HERO_IMG =
  "https://www.hellopurbachal.com/wp-content/uploads/2022/08/Purbachal-300-ft-bridge.jpg";

// 🧾 Constants from the PDF instruction
const MEMBERSHIP_FEE = 1020; // BDT
const BKASH_NUMBER = "01625358082"; // Send Money (personal)
const BANK = {
  name: "Sonali Bank Limited, Purbachal Branch",
  accountName: "Purbachal Newtown Society",
  accountNumber: "4405702001730",
  routingNumber: "200271750",
};

// 🔢 Types
type PaymentMethod = "BKASH" | "BANK";

type FormState = {
  // Plot info
  sectorNumber: string;
  roadNumber: string;
  plotNumber: string;
  plotSize: string;

  // Ownership proof
  ownershipProofType: "LD_TAX_RECEIPT" | "MUTATION_PAPER" | "BDS_KHATIAN";
  ownershipProofFile: File | null;

  // Owner info
  ownerNameEnglish: string;
  ownerNameBangla: string;
  contactNumber: string;
  nidNumber: string;
  presentAddress: string;
  permanentAddress: string;
  email: string;
  ownerPhoto: File | null;

  // Payment
  paymentMethod: PaymentMethod;
  bkashTransactionId: string;
  bkashAccountNumber: string;
  bankAccountNumberFrom: string;
  paymentReceipt: File | null; // bKash screenshot OR bank slip

  // 🔑 New field
  password: string;

  // Consent
  agreeDataUse: boolean;
};

const initialState: FormState = {
  sectorNumber: "",
  roadNumber: "",
  plotNumber: "",
  plotSize: "",
  ownershipProofType: "LD_TAX_RECEIPT",
  ownershipProofFile: null,
  ownerNameEnglish: "",
  ownerNameBangla: "",
  contactNumber: "",
  nidNumber: "",
  presentAddress: "",
  permanentAddress: "",
  email: "",
  ownerPhoto: null,
  paymentMethod: "BKASH",
  bkashTransactionId: "",
  bkashAccountNumber: "",
  bankAccountNumberFrom: "",
  paymentReceipt: null,
  password: "",
  agreeDataUse: false,
};

// ---------- Helpers ----------
const TEN_MB = 10 * 1024 * 1024;
const isPdf = (f: File | null) => !!f && f.type === "application/pdf";
const isImage = (f: File | null) => !!f && f.type.startsWith("image/");
const nonEmpty = (s: string) => !!s && s.trim().length > 0;
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const phoneOk = (s: string) => /^[0-9+\-\s]{8,20}$/.test(s);
const nidOk = (s: string) => /^[0-9]{8,20}$/.test(s.replace(/\s/g, ""));
function validateSize(f: File | null) {
  if (!f) return true;
  return f.size <= TEN_MB;
}

// ---------- Layout helpers (TOP-LEVEL!) ----------
type RowProps = { gap?: number; children: React.ReactNode };
const Row: React.FC<RowProps> = ({ children, gap = 2 }) => (
  <Box
    sx={{ display: "flex", flexWrap: "wrap", gap, alignItems: "flex-start" }}
  >
    {children}
  </Box>
);

type ColProps = { basis?: number; children: React.ReactNode };
const Col: React.FC<ColProps> = ({ children, basis = 280 }) => (
  <Box sx={{ flex: `1 1 ${basis}px`, minWidth: basis }}>{children}</Box>
);

// ---------- FilePicker with PDF preview ----------
function FilePicker({
  label,
  onChange,
  accept = "image/*,application/pdf",
  helper,
  required,
  file,
  errorText,
}: {
  label: string;
  accept?: string;
  onChange: (f: File | null) => void;
  helper?: string;
  required?: boolean;
  file: File | null;
  errorText?: string;
}) {
  const [localName, setLocalName] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && isPdf(file)) {
      const obj = URL.createObjectURL(file);
      setUrl(obj);
      return () => URL.revokeObjectURL(obj);
    } else {
      setUrl(null);
    }
  }, [file]);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadFileIcon />}
          fullWidth
          size="small"
          sx={{ justifyContent: "flex-start" }}
        >
          {file ? `${label}: ${localName || file.name}` : label}
          <input
            type="file"
            hidden
            accept={accept}
            onChange={e => {
              const f = e.target.files?.[0] || null;
              setLocalName(f?.name || "");
              onChange(f);
            }}
          />
        </Button>

        {file && isPdf(file) && url && (
          <Button
            onClick={() => setOpen(true)}
            size="small"
            variant="text"
            sx={{ whiteSpace: "nowrap" }}
          >
            Preview PDF
          </Button>
        )}
      </Stack>

      {(helper || errorText) && (
        <FormHelperText error={!!errorText} sx={{ ml: 1, mt: 0.5 }}>
          {required ? "* " : ""}
          {errorText || helper}
        </FormHelperText>
      )}

      {/* Preview dialog for PDF */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6 }}>
          {localName || file?.name || "Preview"}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: "80vh" }}>
          {url ? (
            <object
              data={url}
              type="application/pdf"
              width="100%"
              height="100%"
            >
              <Box p={2}>
                <Typography>
                  PDF preview is not available in this browser. You can download
                  and open it locally.
                </Typography>
                <Button
                  href={url}
                  target="_blank"
                  rel="noopener"
                  sx={{ mt: 1 }}
                >
                  Open PDF in new tab
                </Button>
              </Box>
            </object>
          ) : (
            <Box p={2}>No preview available.</Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// ---------- Labels for error summary ----------
type Key = keyof FormState;
const LABELS: Record<Key, string> = {
  sectorNumber: "Sector number",
  roadNumber: "Road number",
  plotNumber: "Plot number",
  plotSize: "Plot size",
  ownershipProofType: "Document type",
  ownershipProofFile: "Ownership proof file",
  ownerNameEnglish: "Owner name (English)",
  ownerNameBangla: "Owner name (Bangla)",
  contactNumber: "Contact number",
  nidNumber: "NID number",
  presentAddress: "Present address",
  permanentAddress: "Permanent address",
  email: "Email address",
  ownerPhoto: "Owner photo",
  paymentMethod: "Payment method",
  bkashTransactionId: "bKash transaction ID",
  bkashAccountNumber: "bKash account number used",
  bankAccountNumberFrom: "Bank account number (sender)",
  paymentReceipt: "Payment receipt/screenshot",
  agreeDataUse: "Consent to data use",
  password: "Password",
};

// ---------- Validation helpers (per-field + all) ----------
function validateField(key: Key, v: FormState): string | undefined {
  switch (key) {
    case "sectorNumber":
    case "roadNumber":
    case "plotNumber":
    case "plotSize":
      if (!nonEmpty((v as any)[key])) return `${LABELS[key]} is required`;
      return;
    case "ownerNameEnglish":
    case "ownerNameBangla":
    case "presentAddress":
      if (!nonEmpty((v as any)[key])) return `${LABELS[key]} is required`;
      return;
    case "password":
      if (!nonEmpty(v.password) || v.password.length < 8)
        return "Password must be at least 8 characters";
      return;
    case "permanentAddress":
      if (!nonEmpty((v as any)[key])) return `${LABELS[key]} is required`;
      return;
    case "contactNumber":
      if (!nonEmpty(v.contactNumber) || !phoneOk(v.contactNumber))
        return "Enter a valid phone number";
      return;
    case "nidNumber":
      if (!nonEmpty(v.nidNumber) || !nidOk(v.nidNumber))
        return "Enter a valid numeric NID (8–20 digits)";
      return;
    case "email":
      if (!nonEmpty(v.email) || !emailOk(v.email))
        return "Enter a valid email address";
      return;
    case "ownershipProofFile":
      if (!v.ownershipProofFile) return "Ownership proof file is required";
      if (!validateSize(v.ownershipProofFile))
        return "Ownership proof must be ≤ 10MB";
      return;
    case "ownerPhoto":
      if (!v.ownerPhoto) return "Owner photo is required";
      if (!validateSize(v.ownerPhoto)) return "Photo must be ≤ 10MB";
      if (!isImage(v.ownerPhoto)) return "Photo must be an image file";
      return;
    case "bkashTransactionId":
      if (v.paymentMethod === "BKASH" && !nonEmpty(v.bkashTransactionId))
        return "bKash transaction ID is required";
      return;
    case "bkashAccountNumber":
      if (v.paymentMethod === "BKASH" && !nonEmpty(v.bkashAccountNumber))
        return "bKash account number used is required";
      return;
    case "bankAccountNumberFrom":
      if (v.paymentMethod === "BANK" && !nonEmpty(v.bankAccountNumberFrom))
        return "Bank account number (sender) is required";
      return;
    case "paymentReceipt":
      if (!v.paymentReceipt) return "Payment receipt/screenshot is required";
      if (!validateSize(v.paymentReceipt)) return "Receipt must be ≤ 10MB";
      return;
    case "agreeDataUse":
      if (!v.agreeDataUse) return "You must agree to the data use notice";
      return;
    case "paymentMethod":
    case "ownershipProofType":
      // Always valid as they have defaults, but we keep for completeness
      if (!v[key]) return `${LABELS[key]} is required`;
      return;
    default:
      return;
  }
}

const ALL_KEYS: Key[] = [
  "sectorNumber",
  "roadNumber",
  "plotNumber",
  "plotSize",
  "ownershipProofType",
  "ownershipProofFile",
  "ownerNameEnglish",
  "ownerNameBangla",
  "contactNumber",
  "nidNumber",
  "presentAddress",
  "permanentAddress",
  "email",
  "ownerPhoto",
  "paymentMethod",
  "bkashTransactionId",
  "bkashAccountNumber",
  "bankAccountNumberFrom",
  "paymentReceipt",
  "agreeDataUse",
  "password",
];

function validateAll(v: FormState): Partial<Record<Key, string>> {
  const e: Partial<Record<Key, string>> = {};
  for (const k of ALL_KEYS) {
    const msg = validateField(k, v);
    if (msg) e[k] = msg;
  }
  return e;
}

export default function PnsMembershipForm() {
  const [v, setV] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  // const [doneId, setDoneId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error" | "info" | "warning";
  }>({ open: false, msg: "", sev: "success" });

  // ---- unified setters for live validation ----
  function markTouched<K extends Key>(key: K) {
    setTouched(t => ({ ...t, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: validateField(key, v) }));
  }

  function setField<K extends Key>(key: K, value: FormState[K]) {
    const next = { ...v, [key]: value } as FormState;
    setV(next);
    setTouched(t => ({ ...t, [key]: true }));
    // For dependent logic (e.g., switching payment method), revalidate all
    if (key === "paymentMethod") {
      setErrors(validateAll(next));
    } else {
      const msg = validateField(key, next);
      setErrors(e => ({ ...e, [key]: msg }));
    }
  }

  // ✅ Lightweight readiness check (kept from your logic)
  const canSubmit = useMemo(() => {
    const baseOk =
      nonEmpty(v.sectorNumber) &&
      nonEmpty(v.roadNumber) &&
      nonEmpty(v.plotNumber) &&
      nonEmpty(v.plotSize) &&
      v.ownershipProofFile &&
      nonEmpty(v.ownerNameEnglish) &&
      nonEmpty(v.ownerNameBangla) &&
      nonEmpty(v.contactNumber) &&
      phoneOk(v.contactNumber) &&
      nonEmpty(v.nidNumber) &&
      nidOk(v.nidNumber) &&
      nonEmpty(v.presentAddress) &&
      nonEmpty(v.permanentAddress) &&
      nonEmpty(v.email) &&
      emailOk(v.email) &&
      nonEmpty(v.password) && v.password.length >= 8 &&
      v.ownerPhoto &&
      v.paymentReceipt &&
      v.agreeDataUse &&
      validateSize(v.ownershipProofFile) &&
      validateSize(v.ownerPhoto) &&
      validateSize(v.paymentReceipt);

    const paymentOk =
      v.paymentMethod === "BKASH"
        ? nonEmpty(v.bkashTransactionId) && nonEmpty(v.bkashAccountNumber)
        : nonEmpty(v.bankAccountNumberFrom);

    return Boolean(baseOk && paymentOk);
  }, [v]);

  // Live “why disabled” reasons
  const liveErrors = validateAll(v);
  const blocking = Object.entries(liveErrors).filter(([, msg]) => !!msg) as [
    Key,
    string
  ][];

  // 👉 Build FormData for API
  function toFormData(data: FormState): FormData {
    const fd = new FormData();
    fd.append("password", data.password.trim());

    // Simple fields
    fd.append("sectorNumber", data.sectorNumber.trim());
    fd.append("roadNumber", data.roadNumber.trim());
    fd.append("plotNumber", data.plotNumber.trim());
    fd.append("plotSize", data.plotSize.trim());

    fd.append("ownershipProofType", data.ownershipProofType);
    fd.append("ownerNameEnglish", data.ownerNameEnglish.trim());
    fd.append("ownerNameBangla", data.ownerNameBangla.trim());
    fd.append("contactNumber", data.contactNumber.trim());
    fd.append("nidNumber", data.nidNumber.trim());
    fd.append("presentAddress", data.presentAddress.trim());
    fd.append("permanentAddress", data.permanentAddress.trim());
    fd.append("email", data.email.trim());

    fd.append("paymentMethod", data.paymentMethod);
    if (data.paymentMethod === "BKASH") {
      fd.append("bkashTransactionId", data.bkashTransactionId.trim());
      fd.append("bkashAccountNumber", data.bkashAccountNumber.trim());
    } else {
      fd.append("bankAccountNumberFrom", data.bankAccountNumberFrom.trim());
    }

    // Files
    if (data.ownershipProofFile)
      fd.append("ownershipProofFile", data.ownershipProofFile);
    if (data.ownerPhoto) fd.append("ownerPhoto", data.ownerPhoto);
    if (data.paymentReceipt) fd.append("paymentReceipt", data.paymentReceipt);

    // Extras
    fd.append("membershipFee", String(MEMBERSHIP_FEE));
    fd.append("agreeDataUse", String(data.agreeDataUse));

    return fd;
  }

  function validateBeforeSubmit(): boolean {
    const e = validateAll(v);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedOnce(true);

    if (!validateBeforeSubmit()) {
      setToast({
        open: true,
        msg: "Please fix the highlighted fields.",
        sev: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = toFormData(v);

      const res = await axios.post("/api/auth/register", formData, {
        timeout: 60_000,
      });

      const data = res.data ?? {};
      setToast({
        open: true,
        msg: data.message || "Submitted successfully.",
        sev: "success",
      });

      // Optionally reset
      setV(initialState);
      setErrors({});
      setTouched({});
      setSubmittedOnce(false);
    } catch (err: unknown) {
      const msg = ((): string => {
        if (axios.isAxiosError(err)) {
          const d = err.response?.data as any;
          if (typeof d === "string") return d;
          if (d?.message) return d.message;
          if (d?.error) return d.error;
          return err.message;
        }
        return (err as Error).message;
      })();

      console.error(err);
      setToast({ open: true, msg, sev: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const paymentInfo = (
    <Alert severity="info" sx={{ borderRadius: 2 }}>
      <Typography fontWeight={600} gutterBottom>
        Membership Registration Fee: BDT {MEMBERSHIP_FEE}
      </Typography>
      <Typography variant="body2" gutterBottom>
        Pay via <b>bKash Send Money</b> to <b>{BKASH_NUMBER}</b> (personal){" "}
        <i>or</i> deposit to <b>{BANK.name}</b> — A/C{" "}
        <b>{BANK.accountNumber}</b>, A/C Name <b>{BANK.accountName}</b>, Routing{" "}
        <b>{BANK.routingNumber}</b>. Attach a receipt/screenshot before
        submitting.
      </Typography>
    </Alert>
  );

  // Helper to show error only when touched or after first submit attempt
  const showErr = (key: Key) =>
    !!errors[key] && (touched[key] || submittedOnce) ? errors[key] : "";

  return (
    <>
      <Head>
        <title>Membership Registration | Purbachal Newtown Society</title>
        <meta
          name="description"
          content="Register for Purbachal Newtown Society membership and submit your ownership details and payment receipt."
        />
      </Head>
      {/* 🔹 HERO with overlay */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 180, md: 260 },
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
        {/* soft vignette bottom */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(120% 60% at 50% 100%, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <Container maxWidth="lg">
          <Stack spacing={1} sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textShadow: "0 2px 12px rgba(0,0,0,.4)",
                fontSize: { xs: 28, md: 40 },
              }}
            >
              Purbachal Newtown Society
            </Typography>
            <Typography
              variant="h6"
              sx={{ opacity: 0.95, fontWeight: 500, letterSpacing: 0.2 }}
            >
              Membership Registration
            </Typography>

            {/* quick callouts */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ pt: 1 }}
            >
              <Chip
                label={`Fee: BDT ${MEMBERSHIP_FEE}`}
                variant="filled"
                color="success"
              />
              <Chip
                label={`bKash: ${BKASH_NUMBER}`}
                variant="filled"
                sx={{ bgcolor: '#fde7f2', color: '#b31259', borderColor: 'transparent' }}
              />
              <Chip
                label={`Bank: ${BANK.accountNumber}`}
                variant="filled"
                sx={{ bgcolor: '#e8f0fe', color: '#0b3d91', borderColor: 'transparent' }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* 🔹 Floating header card (overlaps hero bottom slightly) */}
      <Container maxWidth="lg" sx={{ transform: "translateY(-32px)" }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            boxShadow: "0 12px 30px rgba(0,0,0,.15)",
            backdropFilter: "blur(2px)",
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                Fill the form accurately. Fields marked with * are required.
              </Typography>
              <Typography variant="body2">
                Already a member? <Link href="/auth/login">Login</Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      {/* 🔹 Main form */}
      <Container maxWidth="lg" sx={{ pt: 2, pb: { xs: 4, md: 6 } }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {/* Plot Information */}
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
              <CardHeader
                title="Plot information"
                subheader="Sector, Road, Plot, Size"
              />
              <CardContent>
                <Row>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Sector number"
                      value={v.sectorNumber}
                      onChange={e => setField("sectorNumber", e.target.value)}
                      onBlur={() => markTouched("sectorNumber")}
                      error={!!showErr("sectorNumber")}
                      helperText={showErr("sectorNumber")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Road number"
                      value={v.roadNumber}
                      onChange={e => setField("roadNumber", e.target.value)}
                      onBlur={() => markTouched("roadNumber")}
                      error={!!showErr("roadNumber")}
                      helperText={showErr("roadNumber")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Plot number"
                      value={v.plotNumber}
                      onChange={e => setField("plotNumber", e.target.value)}
                      onBlur={() => markTouched("plotNumber")}
                      error={!!showErr("plotNumber")}
                      helperText={showErr("plotNumber")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Plot size"
                      placeholder="e.g., 3 Katha / 1800 sft"
                      value={v.plotSize}
                      onChange={e => setField("plotSize", e.target.value)}
                      onBlur={() => markTouched("plotSize")}
                      error={!!showErr("plotSize")}
                      helperText={showErr("plotSize")}
                      fullWidth
                    />
                  </Col>
                </Row>
              </CardContent>
            </Card>

            {/* Ownership Proof */}
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
              <CardHeader
                title="Ownership proof"
                subheader="Attach exactly ONE document"
              />
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel id="proof-type">Document type</InputLabel>
                    <Select
                      labelId="proof-type"
                      label="Document type"
                      value={v.ownershipProofType}
                      onChange={e =>
                        setField(
                          "ownershipProofType",
                          e.target.value as FormState["ownershipProofType"]
                        )
                      }
                      onBlur={() => markTouched("ownershipProofType")}
                    >
                      <MenuItem value="LD_TAX_RECEIPT">
                        LD tax receipt (with plot details)
                      </MenuItem>
                      <MenuItem value="MUTATION_PAPER">
                        Mutation paper (RAJUK/AC land)
                      </MenuItem>
                      <MenuItem value="BDS_KHATIAN">BDS Khatian</MenuItem>
                    </Select>
                    <FormHelperText>
                      Select the one you will upload
                    </FormHelperText>
                  </FormControl>

                  <FilePicker
                    required
                    label="Upload ownership proof (PDF/JPG/PNG)"
                    file={v.ownershipProofFile}
                      onChange={f => {
                        // setField already marks touched and validates
                        setField("ownershipProofFile", f);
                      }}
                    helper={"Max ~10MB. Clear scan or photo."}
                    errorText={showErr("ownershipProofFile")}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
              <CardHeader title="Plot owner's information" />
              <CardContent>
                <Row>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Owner's name (English) — as per land document"
                      value={v.ownerNameEnglish}
                      onChange={e =>
                        setField("ownerNameEnglish", e.target.value)
                      }
                      onBlur={() => markTouched("ownerNameEnglish")}
                      error={!!showErr("ownerNameEnglish")}
                      helperText={showErr("ownerNameEnglish")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="মালিকের নাম (বাংলা)"
                      value={v.ownerNameBangla}
                      onChange={e =>
                        setField("ownerNameBangla", e.target.value)
                      }
                      onBlur={() => markTouched("ownerNameBangla")}
                      error={!!showErr("ownerNameBangla")}
                      helperText={showErr("ownerNameBangla")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Contact number"
                      value={v.contactNumber}
                      onChange={e => setField("contactNumber", e.target.value)}
                      onBlur={() => markTouched("contactNumber")}
                      error={!!showErr("contactNumber")}
                      helperText={showErr("contactNumber")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="NID number"
                      value={v.nidNumber}
                      onChange={e => setField("nidNumber", e.target.value)}
                      onBlur={() => markTouched("nidNumber")}
                      error={!!showErr("nidNumber")}
                      helperText={showErr("nidNumber")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      type="email"
                      label="Email address"
                      value={v.email}
                      onChange={e => setField("email", e.target.value)}
                      onBlur={() => markTouched("email")}
                      error={!!showErr("email")}
                      helperText={showErr("email")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      type="password"
                      label="Password"
                      value={v.password}
                      onChange={e => setField("password", e.target.value)}
                      onBlur={() => markTouched("password")}
                      error={!!showErr("password")}
                      helperText={showErr("password")}
                      fullWidth
                    />
                  </Col>

                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Present address"
                      value={v.presentAddress}
                      onChange={e => setField("presentAddress", e.target.value)}
                      onBlur={() => markTouched("presentAddress")}
                      error={!!showErr("presentAddress")}
                      helperText={showErr("presentAddress")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <TextField
                      size="small"
                      required
                      label="Permanent address"
                      value={v.permanentAddress}
                      onChange={e =>
                        setField("permanentAddress", e.target.value)
                      }
                      onBlur={() => markTouched("permanentAddress")}
                      error={!!showErr("permanentAddress")}
                      helperText={showErr("permanentAddress")}
                      fullWidth
                    />
                  </Col>
                  <Col>
                    <FilePicker
                      required
                      label="Upload owner's photo (JPG/PNG)"
                      accept="image/*"
                      file={v.ownerPhoto}
                      onChange={f => {
                        // setField already marks touched and validates
                        setField("ownerPhoto", f);
                      }}
                      helper={"Clear passport-style photo preferred (≤10MB)."}
                      errorText={showErr("ownerPhoto")}
                    />
                  </Col>
                </Row>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
              <CardHeader
                title="Payment"
                subheader="Attach receipt and fill relevant fields"
              />
              <CardContent>
                <Stack spacing={2}>
                  {paymentInfo}

                  <Row>
                    <Col>
                      <FormControl fullWidth size="small">
                        <InputLabel id="pay-method">Payment method</InputLabel>
                        <Select
                          labelId="pay-method"
                          label="Payment method"
                          value={v.paymentMethod}
                          onChange={e =>
                            setField(
                              "paymentMethod",
                              e.target.value as PaymentMethod
                            )
                          }
                          onBlur={() => markTouched("paymentMethod")}
                        >
                          <MenuItem value="BKASH">bKash</MenuItem>
                          <MenuItem value="BANK">
                            Bank deposit/transfer
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Col>

                    {v.paymentMethod === "BKASH" ? (
                      <>
                        <Col>
                          <TextField
                            size="small"
                            required
                            label="bKash transaction ID"
                            value={v.bkashTransactionId}
                            onChange={e =>
                              setField("bkashTransactionId", e.target.value)
                            }
                            onBlur={() => markTouched("bkashTransactionId")}
                            error={!!showErr("bkashTransactionId")}
                            helperText={showErr("bkashTransactionId")}
                            fullWidth
                          />
                        </Col>
                        <Col>
                          <TextField
                            size="small"
                            required
                            label="bKash account number used"
                            value={v.bkashAccountNumber}
                            onChange={e =>
                              setField("bkashAccountNumber", e.target.value)
                            }
                            onBlur={() => markTouched("bkashAccountNumber")}
                            error={!!showErr("bkashAccountNumber")}
                            helperText={showErr("bkashAccountNumber")}
                            fullWidth
                          />
                        </Col>
                      </>
                    ) : (
                      <Col>
                        <TextField
                          size="small"
                          required
                          label="Bank account number (sender)"
                          value={v.bankAccountNumberFrom}
                          onChange={e =>
                            setField("bankAccountNumberFrom", e.target.value)
                          }
                          onBlur={() => markTouched("bankAccountNumberFrom")}
                          error={!!showErr("bankAccountNumberFrom")}
                          helperText={showErr("bankAccountNumberFrom")}
                          fullWidth
                        />
                      </Col>
                    )}

                    <Col>
                      <FilePicker
                        required
                        label={
                          v.paymentMethod === "BKASH"
                            ? "Upload bKash receipt/screenshot"
                            : "Upload bank deposit slip/screenshot"
                        }
                        file={v.paymentReceipt}
                        onChange={f => {
                          // setField already marks touched and validates
                          setField("paymentReceipt", f);
                        }}
                        helper={"PDF/JPG/PNG (≤10MB)"}
                        errorText={showErr("paymentReceipt")}
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={v.agreeDataUse}
                        onChange={e =>
                          setField("agreeDataUse", e.target.checked)
                        }
                        onBlur={() => markTouched("agreeDataUse")}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree that my personal data and documents will be used
                        for PNS membership registration, identity verification,
                        and administration. I consent to collection &amp; secure
                        storage.
                      </Typography>
                    }
                  />
                  {showErr("agreeDataUse") && (
                    <FormHelperText error sx={{ ml: 1 }}>
                      {showErr("agreeDataUse")}
                    </FormHelperText>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Submit */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
            >
              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={submitting || !canSubmit}
                startIcon={
                  submitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CheckCircleOutlineIcon />
                  )
                }
              >
                {submitting ? "Submitting…" : "Submit application"}
              </Button>

              {!canSubmit && (
                <Typography variant="body2" color="text.secondary">
                  {`Complete all required fields to enable submit. (${blocking.length} issues)`}
                </Typography>
              )}
            </Stack>

            {/* Compact live error summary when disabled */}
            {!canSubmit && blocking.length > 0 && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Please fix the following:
                </Typography>
                <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                  {blocking.slice(0, 5).map(([k, msg]) => (
                    <li key={k}>
                      <Typography variant="body2">
                        <b>{LABELS[k]}:</b> {msg}
                      </Typography>
                    </li>
                  ))}
                </ul>
                {blocking.length > 5 && (
                  <Typography variant="caption" color="text.secondary">
                    +{blocking.length - 5} more…
                  </Typography>
                )}
              </Alert>
            )}
          </Stack>

          <Snackbar
            open={toast.open}
            autoHideDuration={4000}
            onClose={() => setToast({ ...toast, open: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setToast({ ...toast, open: false })}
              severity={toast.sev}
              variant="filled"
              sx={{ width: "100%" }}
            >
              {toast.msg}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </>
  );
}
