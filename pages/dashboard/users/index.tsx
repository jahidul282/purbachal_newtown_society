import React, { useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, GridActionsCellItem, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { getJSON } from "@/lib/api";
import moment from "moment";

type MgmtUser = {
  id: number;
  photoUrl?: string | null;
  name: string;
  phone: string;
  address?: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  email: string;
  title?: string | null;
  created: string;
};

type UsersResp = { users: MgmtUser[] };

export default function UsersPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<UsersResp>("/api/admin/users", getJSON);
  const rows = useMemo(() => data?.users || [], [data]);

  const [roleDlgOpen, setRoleDlgOpen] = React.useState(false);
  const [roleUser, setRoleUser] = React.useState<{ id: number; name?: string; role: "ADMIN" | "EDITOR" | "VIEWER" } | null>(null);
  const [roleValue, setRoleValue] = React.useState<"ADMIN" | "EDITOR" | "VIEWER">("VIEWER");

  const openRoleDialog = (row: any) => {
    const current = String(row.role || "VIEWER").toUpperCase() as any;
    setRoleUser({ id: Number(row.id), name: row.name, role: current });
    setRoleValue(current);
    setRoleDlgOpen(true);
  };

  const saveRole = async () => {
    if (!roleUser) return;
    try {
      const res = await fetch(`/api/admin/users/${roleUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleValue }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRoleDlgOpen(false);
      setRoleUser(null);
      await mutate();
    } catch (e: any) {
      alert(e?.message || "Failed to update role");
    }
  };

  async function confirmAndDelete(id: number, name?: string) {
    try {
      const Swal = (await import("sweetalert2")).default;
      const result = await Swal.fire({
        title: "Delete user?",
        text: name ? `This will remove ${name}.` : "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;

      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await mutate();
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
    } catch (e: any) {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({ icon: "error", title: "Failed", text: e?.message || "Unable to delete" });
    }
  }

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
    { field: "phone", headerName: "Phone", minWidth: 140 },
    { field: "title", headerName: "Title", minWidth: 140 },
    {
      field: "role",
      headerName: "Role",
      minWidth: 120,
      renderCell: (p) => {
        const v = String(p.value || "").toUpperCase();
        const color = v === "ADMIN" ? "primary" : v === "EDITOR" ? "warning" : "default";
        return <Chip label={v} size="small" color={color as any} />;
      },
    },
    {
      field: "created",
      headerName: "Created",
      minWidth: 160,
      renderCell: (params) => {
        const v = params?.row?.created;
        const d = moment(v);
        return d.isValid() ? d.format("D, MMM YYYY") : "";
      },
      sortable: true,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      getActions: params => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon fontSize="small" />}
          label="Edit"
          onClick={() => router.push(`/dashboard/users/${params.id}`)}
          showInMenu={false}
        />, 
        <GridActionsCellItem
          key="role"
          icon={<ManageAccountsIcon fontSize="small" />}
          label="Change role"
          onClick={() => openRoleDialog(params.row)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon fontSize="small" />}
          label="Delete"
          onClick={() => confirmAndDelete(Number(params.id), (params.row as any)?.name)}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <>
    <DashboardLayout>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/dashboard/users/add-user")}>
          Add User
        </Button>
      </Box>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
        />
      </Paper>
    </DashboardLayout>
    <Dialog open={roleDlgOpen} onClose={() => setRoleDlgOpen(false)}>
      <DialogTitle>Update Role {roleUser?.name ? `— ${roleUser.name}` : ""}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mt: 1, minWidth: 220 }}>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select labelId="role-select-label" label="Role" value={roleValue} onChange={e => setRoleValue(e.target.value as any)}>
            <MenuItem value="ADMIN">ADMIN</MenuItem>
            <MenuItem value="EDITOR">EDITOR</MenuItem>
            <MenuItem value="VIEWER">VIEWER</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={() => setRoleDlgOpen(false)}>Cancel</MuiButton>
        <MuiButton variant="contained" onClick={saveRole}>Save</MuiButton>
      </DialogActions>
    </Dialog>
    </>
  );
}
