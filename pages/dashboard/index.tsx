import React from "react";
import useSWR from "swr";
import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BlockIcon from "@mui/icons-material/Block";
import DashboardLayout from "@/components/dashboard/Layout";
import { getJSON } from "@/lib/api";

type Stats = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  byType: Record<string, number>;
  adminUsers: number;
  postsTotal: number;
  postsPublished: number;
  postsDraft: number;
};

export default function DashboardPage() {
  const { data } = useSWR<Stats>("/api/dashboard/stats", getJSON);

  const stats = data || { total: 0, active: 0, pending: 0, inactive: 0, byType: {}, adminUsers: 0, postsTotal: 0, postsPublished: 0, postsDraft: 0 };

  return (
    <DashboardLayout>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Overview
      </Typography>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <StatCard title="Total Members" value={stats.total} color="primary" icon={<GroupsIcon />} />
        <StatCard title="Active" value={stats.active} color="success" icon={<CheckCircleIcon />} />
        <StatCard title="Pending" value={stats.pending} color="warning" icon={<HourglassEmptyIcon />} />
        <StatCard title="Inactive" value={stats.inactive} color="error" icon={<BlockIcon />} />
        <StatCard title="Admin Users" value={stats.adminUsers} color="primary" icon={<GroupsIcon />} />
        <StatCard title="Posts" value={stats.postsTotal} color="primary" icon={<GroupsIcon />} />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Membership Types</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {Object.entries(stats.byType).length === 0 && <Typography color="text.secondary">No data yet</Typography>}
          {Object.entries(stats.byType).map(([type, count]) => (
            <Chip key={type} label={`${type}: ${count}`} color="default" />
          ))}
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Posts</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={`Published: ${stats.postsPublished}`} />
          <Chip label={`Drafts: ${stats.postsDraft}`} />
        </Box>
      </Box>
    </DashboardLayout>
  );
}

function StatCard({ title, value, color = "primary", icon }: { title: string; value: number; color?: "primary" | "success" | "warning" | "error"; icon?: React.ReactNode }) {
  const theme = useTheme();
  const pal = theme.palette[color];
  const bg = `linear-gradient(135deg, ${pal.main} 0%, ${pal.dark} 100%)`;
  const contrast = pal.contrastText;
  return (
    <Card elevation={3} sx={{ position: "relative", overflow: "hidden", borderRadius: 3, transition: "transform .2s ease, box-shadow .2s ease", '&:hover': { transform: "translateY(-2px)", boxShadow: 6 } }}>
      {/* Decorative background icon */}
      <Box sx={{ position: "absolute", right: -12, top: -12, opacity: 0.15, color: contrast, transform: "scale(2.4)" }}>
        {icon}
      </Box>
      <Box sx={{ background: bg, color: contrast }}>
        <CardContent sx={{ minHeight: 110, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
            <Box sx={{ color: contrast }}>{icon}</Box>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 0.6 }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
          </Box>
        </CardContent>
      </Box>
    </Card>
  );
}
