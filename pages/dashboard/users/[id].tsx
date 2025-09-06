import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/Layout";
import UserForm, { ManagementUserInput } from "@/components/dashboard/UserForm";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [initial, setInitial] = useState<Partial<ManagementUserInput> | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const u = data.user;
        setInitial({
          photoUrl: u.photoUrl || "",
          name: u.name,
          phone: u.phone,
          address: u.address || "",
          role: u.role,
          email: u.email,
          title: u.title || "",
        });
      } catch (e: any) {
        alert(e?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const handleSubmit = async (data: ManagementUserInput, photoFile?: File | null) => {
    try {
      if (!id || typeof id !== "string") return;
      setBusy(true);
      const payload: any = { ...data };
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error(await up.text());
        const { url } = await up.json();
        payload.photoUrl = url;
      }
      if (!payload.password) delete payload.password; // don't send empty password
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await router.push("/dashboard/users");
    } catch (e: any) {
      alert(e?.message || "Failed to update user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>Edit User</Typography>
        {loading && <CircularProgress size={18} />}
      </Box>
      {initial && (
        <UserForm title="Update Management User" initial={initial} submitLabel="Update" onSubmit={handleSubmit} busy={busy} />
      )}
    </DashboardLayout>
  );
}
