// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PaymentsIcon from "@mui/icons-material/Payments";
import SecurityIcon from "@mui/icons-material/Security";
import ArticleIcon from "@mui/icons-material/Article";
import InfoIcon from "@mui/icons-material/Info";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { keyframes } from "@mui/system";

type Slide = {
  src: string;
  alt: string;
};

// ---------- HeroBanner-like animation tuning ----------
const DRIFT_DURATION = 16;
const ZOOM_DURATION = 6;
const SCALE_MIN = 1.0;
const SCALE_MAX = 1.06;
const MASK =
  "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 45%, rgba(0,0,0,0.16) 70%, rgba(0,0,0,0) 100%)";

const driftUp = keyframes`
  from { transform: translateY(10px); }
  to   { transform: translateY(-10px); }
`;
const zoomInOut = keyframes`
  0%   { transform: scale(${SCALE_MIN}); }
  50%  { transform: scale(${SCALE_MAX}); }
  100% { transform: scale(${SCALE_MIN}); }
`;

export default function HomePage() {
  const slides: Slide[] = useMemo(
    () => [
      {
        src: "https://www.hellopurbachal.com/wp-content/uploads/2022/08/Purbachal-300-ft-lake-road.jpg",
        alt: "Purbachal Expressway, September 2024 (29)",
      },
      {
        src: "https://www.hellopurbachal.com/wp-content/uploads/2022/08/Purbachal-300-ft-bridge.jpg",
        alt: "Purbachal Expressway, September 2024 (25)",
      },
      {
        src: "https://www.hellopurbachal.com/wp-content/uploads/2022/08/Purbachal-300-lake.jpg",
        alt: "Purbachal Expressway (11)",
      },
    ],
    []
  );

  // --- Membership constants ---
  const MEMBERSHIP_FEE = 1020; // BDT
  const BKASH_NUMBER = "01625358082";
  const BANK = {
    name: "Sonali Bank Limited, Purbachal Branch",
    accountName: "Purbachal Newtown Society",
    accountNumber: "4405702001730",
    routingNumber: "200271750",
  };

  // --- Slider state & autoplay ---
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const len = slides.length;
  const reduce = useReducedMotion();

  const go = useCallback((next: number, direction: 1 | -1) => {
    setDir(direction);
    setIndex(((next % len) + len) % len);
  }, [len]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => go(index + 1, 1), 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, len, go]);

  const pause = () => timerRef.current && clearInterval(timerRef.current);
  const resume = () =>
    (timerRef.current = setInterval(() => go(index + 1, 1), 4500));

  // --- Page-wide reveal variants ---
  const _reveal = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
  };

  return (
    <>
      <Head>
        <title>Purbachal Newtown Society — Membership</title>
        <meta
          name="description"
          content="Join PNS — a community of Purbachal New Town plot owners building a safer, better neighborhood."
        />
      </Head>

      {/* PAGE WRAPPER with initial fade-in */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* HERO SLIDER */}
        <Box
          sx={{
            position: "relative",
            height: { xs: 520, md: 640 },
            overflow: "hidden",
          }}
        >
          {/* Slide with HeroBanner-like drift + zoom + mask */}
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              initial={{
                opacity: 0,
                scale: 1.04,
                x: dir > 0 ? 40 : -40,
              }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.02, x: dir > 0 ? -40 : 40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
              }}
              onMouseEnter={pause}
              onMouseLeave={resume}
            >
              {/* MASK layer */}
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  WebkitMaskImage: MASK,
                  maskImage: MASK,
                  pointerEvents: "none",
                }}
              >
                {/* DRIFT layer */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    transformOrigin: "center bottom",
                    willChange: "transform",
                    animation: reduce
                      ? "none"
                      : `${driftUp} ${DRIFT_DURATION}s ease-in-out infinite alternate`,
                  }}
                >
                  {/* ZOOM layer */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      transformOrigin: "center 85%",
                      willChange: "transform",
                      animation: reduce
                        ? "none"
                        : `${zoomInOut} ${ZOOM_DURATION}s ease-in-out infinite`,
                    }}
                  >
                    {/* The actual image */}
                    <Image
                      src={slides[index].src}
                      alt={slides[index].alt}
                      fill
                      priority
                      sizes="100vw"
                      style={{ objectFit: "cover", filter: "brightness(0.85)" }}
                    />
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </AnimatePresence>

          {/* overlay gradient for text readability */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.55) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* HERO CONTENT (glass) */}
          <Container
            maxWidth="lg"
            sx={{ position: "relative", zIndex: 1, height: "100%" }}
          >
            <Stack justifyContent="center" sx={{ height: "100%" }} spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  maxWidth: 820,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.14)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.28)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={800}
                  lineHeight={1.1}
                  gutterBottom
                >
                  Join the Purbachal Community
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.95, mb: 2 }}>
                  PNS is a volunteer-run community of Purbachal New Town plot
                  owners. সদস্যপদ গ্রহণ করে উন্নয়নে অংশ নিন।
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    component={Link}
                    href="/auth/register"
                    size="large"
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleOutlineIcon />}
                  >
                    Register Now
                  </Button>
                  <Button
                    component="a"
                    href="#about-purbachal"
                    size="large"
                    variant="outlined"
                    color="inherit"
                  >
                    Learn about Purbachal
                  </Button>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ mt: 2 }}
                >
                  <Chip
                    icon={<PaymentsIcon />}
                    label={`Membership Fee: BDT ${MEMBERSHIP_FEE}`}
                  />
                  <Chip
                    icon={<SecurityIcon />}
                    label="Your data stays private"
                    variant="outlined"
                  />
                  <Chip
                    icon={<ArticleIcon />}
                    label="Simple paperwork"
                    variant="outlined"
                  />
                </Stack>
              </Paper>
            </Stack>
          </Container>

          {/* ARROWS */}
          <IconButton
            aria-label="Previous"
            onClick={() => go(index - 1, -1)}
            onMouseEnter={pause}
            onMouseLeave={resume}
            sx={{
              position: "absolute",
              top: "50%",
              left: 12,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0,0,0,0.35)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
              zIndex: 2,
            }}
          >
            <ArrowBackIosNew fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Next"
            onClick={() => go(index + 1, 1)}
            onMouseEnter={pause}
            onMouseLeave={resume}
            sx={{
              position: "absolute",
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0,0,0,0.35)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
              zIndex: 2,
            }}
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>

          {/* DOTS */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          >
            {slides.map((_, i) => (
              <Box
                key={i}
                onClick={() => go(i, i > index ? 1 : -1)}
                onMouseEnter={pause}
                onMouseLeave={resume}
                sx={{
                  width: i === index ? 18 : 8,
                  height: 8,
                  borderRadius: 999,
                  transition: "all .25s",
                  cursor: "pointer",
                  bgcolor:
                    i === index
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* ABOUT PURBACHAL (scroll-reveal) */}
        <Container
          id="about-purbachal"
          maxWidth="lg"
          sx={{ py: { xs: 6, md: 8 } }}
        >
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
          >
            <Stack spacing={2} sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon color="primary" />
                <Typography variant="h5" fontWeight={800}>
                  About Purbachal New Town
                </Typography>
              </Stack>
              <Typography color="text.secondary">
                Bangladesh’s largest planned township (by RAJUK), connected to
                Dhaka via a ~12.5&nbsp;km expressway (aka “300&nbsp;ft /
                July&nbsp;36 Expressway”).
              </Typography>
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
            >
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Scale & plan"
                    secondary="Master-planned sectors and arterial roads; residential & mixed-use zones."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Location"
                    secondary="Northeast of Dhaka, spanning Rupganj (Narayanganj) & Kaliganj (Gazipur)."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Connectivity"
                    secondary="Fast link to Kuril Flyover and Kanchan Bridge."
                  />
                </ListItem>
              </List>
            </Paper>
          </motion.div>
        </Container>

        {/* HOW TO JOIN (scroll-reveal) */}
        <Box
          sx={{
            backgroundColor: t => t.palette.background.paper,
            py: { xs: 6, md: 8 },
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={4}>
              {[
                {
                  title: "1) Prepare Required Documents",
                  body: "Keep these ready: ONE proof of land ownership (LD tax receipt with plot details OR mutation paper OR BDS khatian) plus NID number and owner’s photo.",
                },
                {
                  title: `2) Pay Membership Fee (BDT ${MEMBERSHIP_FEE})`,
                  body: `bKash (Send Money) ${BKASH_NUMBER} — Reference: your full name. Or transfer to ${BANK.accountName}, A/C ${BANK.accountNumber}, Routing ${BANK.routingNumber} at ${BANK.name}.`,
                },
                {
                  title: "3) Complete the Online Registration",
                  body: "Fill plot details, owner info, NID, contacts & addresses; provide bKash Txn ID / bank details; upload documents and photo.",
                },
              ].map((sec, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                >
                  <Paper
                    variant="outlined"
                    sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
                  >
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {sec.title}
                    </Typography>
                    <Typography color="text.secondary">{sec.body}</Typography>
                    {i === 2 && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ mt: 2 }}
                      >
                        <Button
                          component={Link}
                          href="/auth/register"
                          variant="contained"
                          size="large"
                        >
                          Go to Registration
                        </Button>
                        <Button
                          component="a"
                          href="#faq"
                          variant="outlined"
                          size="large"
                        >
                          Read FAQs
                        </Button>
                      </Stack>
                    )}
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          </Container>
        </Box>

        {/* FAQ (scroll-reveal) */}
        <Container id="faq" maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight={800}>
                Frequently Asked
              </Typography>

              <Paper
                variant="outlined"
                sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
              >
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Is PNS officially registered?
                </Typography>
                <Typography color="text.secondary">
                  PNS is in the process of obtaining legal registration and will
                  launch its official website soon.
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
              >
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  How is my data handled?
                </Typography>
                <Typography color="text.secondary">
                  Your information is used only for membership registration,
                  identity verification, and administration, and is kept
                  confidential and secure.
                </Typography>
              </Paper>
            </Stack>
          </motion.div>
        </Container>

        {/* Final CTA */}
        <Box
          sx={{
            py: { xs: 6, md: 10 },
            backgroundColor: t => t.palette.background.paper,
          }}
        >
          <Container maxWidth="lg">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, md: 5 },
                  borderRadius: 4,
                  textAlign: "center",
                }}
              >
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Ready to become a member?
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Pay the fee, keep documents ready, and complete the quick
                  online form.
                </Typography>
                <Button
                  component={Link}
                  href="/auth/register"
                  size="large"
                  variant="contained"
                >
                  Start Registration
                </Button>
              </Paper>
            </motion.div>
          </Container>
        </Box>
      </motion.main>
    </>
  );
}
