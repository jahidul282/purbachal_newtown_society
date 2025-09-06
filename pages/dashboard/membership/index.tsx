import React, { useMemo, useRef } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Chip,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DashboardLayout from "@/components/dashboard/Layout";
import { getJSON, postJSON } from "@/lib/api";
import { useXlsx } from "@/lib/useXlsx";
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import moment from "moment";

type Member = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  membershipType?: string;
  status: "active" | "pending" | "inactive";
  joinedAt: string;
};

type MembersResp = { members: Member[] };

export default function MembershipPage() {
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR<MembersResp>("/api/memberships", getJSON);
  const { ready, parseFile } = useXlsx();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const rows = useMemo(() => data?.members || [], [data?.members]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseFile(file);
      // Expect columns: name, email, phone, membershipType, status, joinedAt
      const normalized = rows.map((r: any) => ({
        name: String(r.name || r.Name || "").trim(),
        email: String(r.email || r.Email || "").trim() || undefined,
        phone: String(r.phone || r.Phone || "").trim() || undefined,
        membershipType: String(r.membershipType || r.MembershipType || r.Type || "standard").trim(),
        status: (String(r.status || r.Status || "active").toLowerCase() as Member["status"]) || "active",
        joinedAt: r.joinedAt || r.JoinedAt || r.Joined || new Date().toISOString(),
      }));
      await postJSON("/api/memberships", normalized);
      await mutate();
    } catch (err) {
      console.error(err);
      alert("Failed to import. Ensure the file is a valid .xlsx with proper headers.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "phone", headerName: "Phone", minWidth: 140 },
    { field: "membershipType", headerName: "Type", minWidth: 120 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      renderCell: (params: any) => (
        <Chip
          label={params.value}
          color={params.value === "active" ? "success" : params.value === "pending" ? "warning" : "default"}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      ),
      sortable: true,
    },
    {
      field: "joinedAt",
      headerName: "Joined",
      minWidth: 140,
      sortable: true,
      renderCell: (params: any) => {
        const v = params?.row?.joinedAt;
        if (!v) return "";
        const d = moment(v);
        return d.isValid() ? d.format("D, MMM YYYY") : "";
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      getActions: params => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon fontSize="small" />}
          label="View"
          onClick={() => router.push(`/dashboard/membership/${params.id}`)}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>Membership</Typography>
        <input ref={inputRef} hidden type="file" accept=".xlsx,.xls" onChange={handleImport} />
        <Tooltip title={ready ? "Import from XLSX" : "Loading XLSX parser..."}>
          <span>
            <Button variant="contained" startIcon={<UploadFileIcon />} disabled={!ready} onClick={() => inputRef.current?.click()}>
              Import XLSX
            </Button>
          </span>
        </Tooltip>
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
  );
}
