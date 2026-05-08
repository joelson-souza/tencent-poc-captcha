require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const captchaRoutes = require("./routes/captcha");

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * 🔥 LOG HTTP
 */
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // console.log("[HTTP]", {
    //   method: req.method,
    //   path: req.path,
    //   status: res.statusCode,
    //   duration_ms: Math.round(durationMs)
    // });
  });

  next();
});

app.use(cors());
app.use(express.json());

/**
 * 🔥 TRACE HEADER
 */
app.use((req, res, next) => {
  res.setHeader("x-trace-mode", "poc");
  next();
});

const frontendPath = path.join(__dirname, "../../frontend");

/**
 * 🔥 STATIC FRONTEND
 */
app.use(express.static(frontendPath));

/**
 * 💥 FIX CRÍTICO: ROTA /dashboard
 */
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

/**
 * API
 */
app.use("/api/captcha", captchaRoutes);

/**
 * HEALTHCHECK
 */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * START SERVER
 */
app.listen(PORT, () => {
  console.log("🚀 Rodando na porta", PORT);
});