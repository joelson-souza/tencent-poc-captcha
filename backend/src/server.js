require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const captchaRoutes = require("./routes/captcha");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, "../../frontend");

app.use(express.static(frontendPath));

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

app.use("/api/captcha", captchaRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});