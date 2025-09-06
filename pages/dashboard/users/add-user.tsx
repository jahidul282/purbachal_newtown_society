import React, { useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/Layout";
import UserForm, { ManagementUserInput } from "@/components/dashboard/UserForm";
import { Box, Card, CardContent, Container, Typography } from "@mui/material";

export default function AddUserPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (
    data: ManagementUserInput,
    photoFile?: File | null
  ) => {
    try {
      setBusy(true);
      // Upload photo if provided
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        if (!up.ok) throw new Error(await up.text());
        const { url } = await up.json();
        data.photoUrl = url;
      }
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      await router.push("/dashboard/users");
    } catch (e: any) {
      alert(e?.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Add User
          </Typography>
        </Box>
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Fill in user details. Role and password are required.
            </Typography>
          </CardContent>
        </Card>
        <UserForm
          title="New Management User"
          subheader="Provide basic information and role"
          submitLabel="Create"
          onSubmit={handleSubmit}
          busy={busy}
        />
      </Container>
    </DashboardLayout>
  );
}
