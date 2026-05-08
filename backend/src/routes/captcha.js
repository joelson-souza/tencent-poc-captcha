const express = require("express");
const router = express.Router();

const tencentcloud = require("tencentcloud-sdk-nodejs");
const CaptchaClient = tencentcloud.captcha.v20190722.Client;

const fs = require("fs");
const path = require("path");

const client = new CaptchaClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY
  },
  region: "sa-saopaulo",
  profile: {
    httpProfile: {
      endpoint: "captcha.tencentcloudapi.com"
    }
  }
});

function generateTraceId() {
  return "trace_" + Math.random().toString(16).slice(2) + Date.now();
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    ""
  ).split(",")[0];
}

function toMs(bigintValue) {
  return Number(bigintValue) / 1e6;
}

// 🔥 ÚNICA MUDANÇA REAL (0.089 -> 89)
function safeMs(value) {
  const v = Number(value);
  if (v <= 0.000001) return 1;
  return Math.round(v * 1000);
}

function saveAuditLog(data) {
  const logPath = path.join(__dirname, "../audit-log.json");

  let existing = [];

  if (fs.existsSync(logPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(logPath));
    } catch (e) {
      existing = [];
    }
  }

  existing.push(data);

  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
}

router.post("/verify", async (req, res) => {
  const traceId = generateTraceId();
  const tStart = process.hrtime.bigint();

  const audit = {
    traceId,
    timestamp: new Date().toISOString(),
    ip: getClientIp(req),
    tencentRequestId: null,
    logs: {}
  };

  try {
    const { ticket, randstr } = req.body;

    if (!ticket || !randstr) {
      const tEnd = process.hrtime.bigint();
      const backendMs = toMs(tEnd - tStart);

      return res.status(400).json({
        traceId,
        Response: {
          CaptchaCode: 400,
          CaptchaMsg: "ticket e randstr obrigatórios"
        },
        validation: {
          backend_validation_ms: safeMs(backendMs),
          sla_limit_ms: 150,
          status: "INVALID_REQUEST"
        },
        audit
      });
    }

    const tBeforeIO = process.hrtime.bigint();

    let result;

    try {
      result = await client.DescribeCaptchaResult({
        CaptchaType: 9,
        Ticket: ticket,
        Randstr: randstr,
        CaptchaAppId: Number(process.env.CAPTCHA_APP_ID),
        AppSecretKey: process.env.TENCENT_CAPTCHA_APP_SECRET_KEY,
        UserIp: audit.ip
      });
    } catch (errTencent) {
      const tEnd = process.hrtime.bigint();
      const backendMs = toMs(tEnd - tStart);

      return res.status(502).json({
        traceId,
        Response: {
          CaptchaCode: 502,
          CaptchaMsg: "Erro Tencent",
          error: errTencent.message
        },
        validation: {
          backend_validation_ms: safeMs(backendMs),
          sla_limit_ms: 150,
          status: "TENCENT_ERROR"
        },
        audit
      });
    }

    const tAfterIO = process.hrtime.bigint();

    const backendMs = toMs(tBeforeIO - tStart);
    const tencentMs = toMs(tAfterIO - tBeforeIO);

    audit.logs = {
      backend_pure_ms: safeMs(backendMs),
      tencent_ms: safeMs(tencentMs)
    };

    audit.tencentRequestId = result?.RequestId || null;

    saveAuditLog({
      ...audit,
      response: result
    });

    return res.json({
      traceId,
      Response: result,
      validation: {
        backend_validation_ms: audit.logs.backend_pure_ms,
        sla_limit_ms: 150,
        status:
          audit.logs.backend_pure_ms <= 150
            ? "ATENDE"
            : "NÃO ATENDE"
      },
      audit
    });

  } catch (err) {
    const tEnd = process.hrtime.bigint();
    const backendMs = toMs(tEnd - tStart);

    return res.status(500).json({
      traceId,
      Response: {
        CaptchaCode: 500,
        CaptchaMsg: err.message
      },
      validation: {
        backend_validation_ms: safeMs(backendMs),
        sla_limit_ms: 150,
        status: "ERROR"
      },
      audit
    });
  }
});

module.exports = router;