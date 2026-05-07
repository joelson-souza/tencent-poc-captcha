require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const captchaRoutes = require("./routes/captcha");

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * 🔥 MIDDLEWARE: tracing simples
 */
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    console.log("[HTTP]", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Math.round(durationMs)
    });
  });

  next();
});

app.use(cors());
app.use(express.json());

/**
 * 🔥 HEADER de tracing leve (POC TJPR)
 */
app.use((req, res, next) => {
  res.setHeader("x-trace-mode", "poc");
  next();
});

const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

app.use("/api/captcha", captchaRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log("🚀 Rodando na porta", PORT);
});