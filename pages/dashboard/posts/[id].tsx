import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Box, Button, Card, CardContent, CardHeader, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import RichText from "@/components/dashboard/RichText";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = router.query;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [published, setPublished] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const p = data.post;
        setTitle(p.title || "");
        setContent(p.content || "<p></p>");
        setCoverUrl(p.coverUrl || "");
        setPublished(Boolean(p.published));
      } catch (e: any) {
        alert(e?.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== "string") return;
    if (!title.trim() || !content.trim()) return alert("Title and content required");
    try {
      setBusy(true);
      let finalCover = coverUrl || null;
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error(await up.text());
        const { url } = await up.json();
        finalCover = url;
      }
      const res = await fetch(`/api/admin/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, coverUrl: finalCover, published }) });
      if (!res.ok) throw new Error(await res.text());
      await router.push("/dashboard/posts");
    } catch (e: any) {
      alert(e?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Edit Post</Typography>
      </Box>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardHeader title="Post Details" subheader="Update your content" />
        <CardContent>
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth required size="small" />
              <Stack spacing={1}>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={e => {
                    const f = e.target.files?.[0] || null;
                    if (!f) return;
                    setCoverFile(f);
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCoverPreview(URL.createObjectURL(f));
                    e.currentTarget.value = "";
                  }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button variant="outlined" size="small" onClick={() => fileRef.current?.click()}>{coverUrl || coverPreview ? "Change Cover Image" : "Choose Cover Image"}</Button>
                  <Typography variant="caption" color="text.secondary">JPG/PNG up to 10MB</Typography>
                </Stack>
                {(coverPreview || coverUrl) && (
                  <Box sx={{ width: "100%", maxWidth: 560, height: 200, borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.divider}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(coverPreview || coverUrl) as string} alt="cover preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </Box>
                )}
              </Stack>
              <RichText value={content} onChange={setContent} />
              <FormControlLabel control={<Checkbox checked={published} onChange={e => setPublished(e.target.checked)} />} label="Published" />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button type="submit" variant="contained" disabled={busy || loading}>Update</Button>
                <Button variant="outlined" onClick={() => router.push("/dashboard/posts")}>Cancel</Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Live preview below the form */}
      <Box sx={{ mt: 3 }}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardHeader title="Live Preview" subheader="This is how your post will look" />
          <CardContent>
            <Stack spacing={2}>
              {(coverPreview || coverUrl) && (
                <Box sx={{ width: "100%", maxWidth: 760, height: 260, borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.divider}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(coverPreview || coverUrl) as string} alt="cover preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </Box>
              )}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{title || "(Untitled)"}</Typography>
              <Box sx={{ '& img': { maxWidth: '100%' } }} dangerouslySetInnerHTML={{ __html: content }} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
