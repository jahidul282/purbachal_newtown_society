import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Tooltip, FormControl, InputLabel, Select, MenuItem, Divider } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import LinkIcon from "@mui/icons-material/Link";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import TitleIcon from "@mui/icons-material/Title";

export default function RichText({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [font, setFont] = useState<string>("Default");
  const [foreColor, setForeColor] = useState<string>("#000000");
  const [backColor, setBackColor] = useState<string>("#ffffff");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  function cmd(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tooltip title="Bold"><span><IconButton size="small" onClick={() => cmd("bold")}><FormatBoldIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Italic"><span><IconButton size="small" onClick={() => cmd("italic")}><FormatItalicIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Underline"><span><IconButton size="small" onClick={() => cmd("underline")}><FormatUnderlinedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Heading"><span><IconButton size="small" onClick={() => cmd("formatBlock", "H3")}><TitleIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Bulleted list"><span><IconButton size="small" onClick={() => cmd("insertUnorderedList")}><FormatListBulletedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Numbered list"><span><IconButton size="small" onClick={() => cmd("insertOrderedList")}><FormatListNumberedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Insert link"><span><IconButton size="small" onClick={() => { const url = prompt("Enter URL"); if (url) cmd("createLink", url); }}><LinkIcon fontSize="small" /></IconButton></span></Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        {/* Font family */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="rt-font-label">Font</InputLabel>
          <Select
            labelId="rt-font-label"
            label="Font"
            value={font}
            onChange={(e) => {
              const f = e.target.value;
              setFont(String(f));
              if (f === "Default") {
                cmd("removeFormat");
              } else {
                cmd("fontName", String(f));
              }
            }}
          >
            <MenuItem value="Default">Default</MenuItem>
            <MenuItem value="Arial">Arial</MenuItem>
            <MenuItem value="Georgia">Georgia</MenuItem>
            <MenuItem value="Times New Roman">Times New Roman</MenuItem>
            <MenuItem value="Helvetica">Helvetica</MenuItem>
            <MenuItem value="Courier New">Courier New</MenuItem>
            <MenuItem value="Verdana">Verdana</MenuItem>
            <MenuItem value="Tahoma">Tahoma</MenuItem>
          </Select>
        </FormControl>

        {/* Text color */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
          <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Text</label>
          <input
            type="color"
            value={foreColor}
            onChange={(e) => {
              setForeColor(e.target.value);
              cmd("foreColor", e.target.value);
            }}
            style={{ width: 28, height: 28, border: 'none', background: 'none', padding: 0 }}
          />
        </Box>

        {/* Highlight color */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
          <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Bg</label>
          <input
            type="color"
            value={backColor}
            onChange={(e) => {
              setBackColor(e.target.value);
              // Some browsers prefer 'hiliteColor', others 'backColor'
              if (document.queryCommandSupported('hiliteColor')) {
                cmd('hiliteColor', e.target.value);
              } else {
                cmd('backColor', e.target.value);
              }
            }}
            style={{ width: 28, height: 28, border: 'none', background: 'none', padding: 0 }}
          />
        </Box>
      </Stack>
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        sx={{
          minHeight: 200,
          border: theme => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 1.5,
          '&:focus': { outline: '2px solid', outlineColor: 'primary.main' },
        }}
        data-placeholder={placeholder || "Write something..."}
      />
    </Box>
  );
}
