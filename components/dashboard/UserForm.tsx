import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Slider,
  IconButton,
  Avatar,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export type ManagementUserInput = {
  photoUrl?: string | null;
  name: string;
  phone: string;
  address?: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  email: string;
  title?: string | null;
  password?: string; // only used on create or when changing
};

export default function UserForm({
  title = "Add User",
  subheader = "Create or update a management user",
  initial,
  submitLabel = "Create",
  busy = false,
  onSubmit,
}: {
  title?: string;
  subheader?: string;
  initial?: Partial<ManagementUserInput>;
  submitLabel?: string;
  busy?: boolean;
  // onSubmit now receives optional photo file
  onSubmit: (
    data: ManagementUserInput,
    photoFile?: File | null
  ) => Promise<void> | void;
}) {
  const [values, setValues] = useState<ManagementUserInput>({
    photoUrl: initial?.photoUrl ?? "",
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    role: (initial?.role as any) ?? "VIEWER",
    email: initial?.email ?? "",
    title: initial?.title ?? "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    initial?.photoUrl || undefined
  );

  // Crop dialog state
  const [cropOpen, setCropOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [imgUrl, previewUrl]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!values.name) e.name = "Required";
    if (!values.phone) e.phone = "Required";
    if (!values.email) e.email = "Required";
    if (!values.role) e.role = "Required";
    if (!values.password) {
      e.password = "Password is required";
    } else if (values.password.length < 6) {
      e.password = "Min 6 characters";
    }
    if (!confirm) {
      e.confirm = "Confirm password is required";
    } else if (values.password && values.password !== confirm) {
      e.confirm = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange =
    (field: keyof ManagementUserInput) =>
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const v = ev.target.value;
      setValues(prev => ({ ...prev, [field]: v }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: ManagementUserInput = {
      ...values,
      photoUrl: values.photoUrl || null,
      address: values.address || null,
      title: values.title || null,
    } as any;
    await onSubmit(payload, photoFile);
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
      <CardHeader title={title} subheader={subheader} />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "flex-start" }}
            >
              <Stack spacing={2} flex={1}>
                <TextField
                  size="small"
                  fullWidth
                  label="Name"
                  value={values.name}
                  onChange={handleChange("name")}
                  error={!!errors.name}
                  helperText={errors.name || " "}
                  required
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                  helperText={errors.email || " "}
                  required
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Phone"
                  value={values.phone}
                  onChange={handleChange("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone || " "}
                  required
                />
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Role"
                  value={values.role}
                  onChange={handleChange("role")}
                >
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                  <MenuItem value="EDITOR">EDITOR</MenuItem>
                  <MenuItem value="VIEWER">VIEWER</MenuItem>
                </TextField>
                {errors.role && (
                  <Typography variant="caption" color="error.main">
                    {errors.role}
                  </Typography>
                )}
                <TextField
                  size="small"
                  fullWidth
                  label="Title"
                  value={values.title || ""}
                  onChange={handleChange("title")}
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Address"
                  value={values.address || ""}
                  onChange={handleChange("address")}
                />

                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" size="small" component="label">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => {
                          const f = e.target.files?.[0] || null;
                          if (!f) return;
                          setPhotoFile(f);
                          const url = URL.createObjectURL(f);
                          setImgUrl(url);
                          setScale(1);
                          setPos({ x: 0, y: 0 });
                          setCropOpen(true);
                        }}
                      />
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      disabled={!photoFile}
                      onClick={() => photoFile && setCropOpen(true)}
                    >
                      Crop
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Upload and crop an image. Square crop recommended.
                  </Typography>
                </Stack>

                <TextField
                  size="small"
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={values.password || ""}
                  onChange={handleChange("password")}
                  error={!!errors.password}
                  helperText={errors.password || "At least 6 characters"}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(s => !s)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  error={!!errors.confirm}
                  helperText={errors.confirm || "Re-enter password"}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirm(s => !s)}
                          edge="end"
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Stack
                width={{ xs: "100%", md: 280 }}
                alignItems="center"
                spacing={1}
                sx={{ height: "100%", justifyContent: "center" }}
              >
                <Avatar
                  variant="rounded"
                  src={previewUrl || values.photoUrl || undefined}
                  sx={{ width: 120, height: 120 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Profile preview
                </Typography>
              </Stack>
            </Stack>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={busy}
                startIcon={busy ? <CircularProgress size={18} /> : undefined}
              >
                {submitLabel}
              </Button>
            </Box>
          </Stack>
        </Box>
      </CardContent>

      {/* Crop dialog */}
      <Dialog
        open={cropOpen}
        onClose={() => setCropOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Crop Photo
          <IconButton
            onClick={() => setCropOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                width: "100%",
                aspectRatio: "1 / 1",
                backgroundColor: "#111",
                borderRadius: 2,
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
              }}
              onPointerDown={e => {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setDrag({
                  active: true,
                  startX: e.clientX,
                  startY: e.clientY,
                  origX: pos.x,
                  origY: pos.y,
                });
              }}
              onPointerMove={e => {
                if (!drag.active) return;
                const dx = e.clientX - drag.startX;
                const dy = e.clientY - drag.startY;
                setPos({ x: drag.origX + dx, y: drag.origY + dy });
              }}
              onPointerUp={() => setDrag(d => ({ ...d, active: false }))}
            >
              {imgUrl && (
                // Using native <img> for direct canvas interactions
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt="to-crop"
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    userSelect: "none",
                    pointerEvents: "none",
                    maxWidth: "none",
                  }}
                />
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </Box>
            <Box px={1}>
              <Typography variant="caption">Zoom</Typography>
              <Slider
                min={1}
                max={3}
                step={0.01}
                value={scale}
                onChange={(_, v) => setScale(v as number)}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={() => setCropOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  const container = (e => e?.parentElement)(
                    imgRef.current as unknown as HTMLElement | null
                  ) as HTMLElement | null;
                  const size = container
                    ? Math.min(container.clientWidth, container.clientHeight)
                    : 300;
                  const canvas =
                    canvasRef.current || document.createElement("canvas");
                  canvas.width = size;
                  canvas.height = size;
                  const ctx = canvas.getContext("2d");
                  const img = imgRef.current;
                  if (!ctx || !img) return;
                  // Calculate draw size
                  const iw = img.naturalWidth;
                  const ih = img.naturalHeight;
                  const dw = iw * scale;
                  const dh = ih * scale;
                  // Image center aligned to container center + pos offset
                  const x = size / 2 + pos.x - dw / 2;
                  const y = size / 2 + pos.y - dh / 2;
                  ctx.clearRect(0, 0, size, size);
                  ctx.imageSmoothingQuality = "high";
                  ctx.drawImage(img, x, y, dw, dh);
                  canvas.toBlob(
                    b => {
                      if (!b) return;
                      const file = new File([b], "avatar.jpg", {
                        type: b.type || "image/jpeg",
                      });
                      setPhotoFile(file);
                      const url = URL.createObjectURL(b);
                      setPreviewUrl(url);
                      setCropOpen(false);
                    },
                    "image/jpeg",
                    0.92
                  );
                }}
              >
                Crop & Use
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
