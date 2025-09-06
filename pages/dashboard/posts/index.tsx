import React, { useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, GridActionsCellItem, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { getJSON } from "@/lib/api";
import moment from "moment";

type Post = { id: number; title: string; published: boolean; created: string };
type PostsResp = { posts: Post[] };

export default function PostsPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<PostsResp>("/api/admin/posts", getJSON);
  const rows = useMemo(() => data?.posts || [], [data]);

  async function confirmAndDelete(id: number, title?: string) {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "Delete post?",
      text: title ? `This will remove "${title}".` : "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "Failed", text: await res.text() });
      return;
    }
    await mutate();
    await Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
  }

  const columns: GridColDef[] = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 220 },
    { field: "published", headerName: "Status", minWidth: 120, renderCell: p => <Chip label={p.value ? "Published" : "Draft"} color={p.value ? "success" : "default"} size="small" /> },
    { field: "created", headerName: "Created", minWidth: 160, renderCell: p => moment(p.value).isValid() ? moment(p.value).format("D, MMM YYYY") : "" },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      getActions: params => [
        <GridActionsCellItem key="edit" icon={<EditIcon fontSize="small" />} label="Edit" onClick={() => router.push(`/dashboard/posts/${params.id}`)} showInMenu={false} />,
        <GridActionsCellItem key="delete" icon={<DeleteIcon fontSize="small" />} label="Delete" onClick={() => confirmAndDelete(Number(params.id), (params.row as any)?.title)} showInMenu={false} />,
      ],
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>Posts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/dashboard/posts/new")}>Add Post</Button>
      </Box>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          pageSizeOptions={[5, 10, 25, 50]}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
        />
      </Paper>
    </DashboardLayout>
  );
}

