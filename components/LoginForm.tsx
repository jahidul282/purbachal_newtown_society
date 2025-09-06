import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  Container,
} from "@mui/material";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";

const HERO_IMG =
  "https://www.hellopurbachal.com/wp-content/uploads/2022/08/Purbachal-300-ft-bridge.jpg";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error" | "info" | "warning";
  }>({ open: false, msg: "", sev: "success" });

  const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk(email) || password.trim().length < 6) {
      setToast({ open: true, msg: "Enter valid credentials", sev: "error" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.post(
        "/api/auth/login",
        {
          email: email.trim(),
          password: password.trim(),
        },
        { withCredentials: true }
      );
      if (res.data?.ok) {
        setToast({ open: true, msg: "Login successful", sev: "success" });
        // Force a hard navigation to ensure cookie is applied
        if (typeof window !== "undefined") {
          window.location.assign("/profile");
        } else {
          try {
            router.replace("/profile");
          } catch {
            // no-op
          }
        }
      } else {
        throw new Error("Login failed");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setToast({ open: true, msg, sev: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Hero to match register page */}
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
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textShadow: "0 2px 12px rgba(0,0,0,.4)",
                fontSize: { xs: 28, md: 36 },
              }}
            >
              Purbachal Newtown Society
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 500 }}>
              Member Login
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Floating helper card */}
      <Container maxWidth="lg" sx={{ transform: "translateY(-24px)" }}>
        <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                Enter your email and password to continue.
              </Typography>
              <Typography variant="body2">
                Don’t have an account?{" "}
                <Link href="/auth/register">Register</Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      {/* Main login card */}
      <Container maxWidth="sm" sx={{ pt: 2, pb: { xs: 4, md: 6 } }}>
        <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
          <CardHeader title="Login" subheader="Sign in to your account" />
          <CardContent>
            <Box component="form" onSubmit={onSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  size="small"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={!!email && !emailOk(email)}
                  helperText={
                    !!email && !emailOk(email) ? "Enter a valid email" : " "
                  }
                  fullWidth
                  required
                />
                <TextField
                  label="Password"
                  size="small"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  helperText={
                    password && password.length < 6 ? "Min 6 characters" : " "
                  }
                  error={!!password && password.length < 6}
                  fullWidth
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    submitting || !emailOk(email) || password.length < 6
                  }
                  startIcon={
                    submitting ? <CircularProgress size={18} /> : undefined
                  }
                >
                  {submitting ? "Signing in…" : "Login"}
                </Button>

                <Typography variant="body2" color="text.secondary">
                  New here? <Link href="/auth/register">Create an account</Link>
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
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
    </>
  );
}
