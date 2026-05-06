const express = require("express");
const router = express.Router();

const tencentcloud = require("tencentcloud-sdk-nodejs");
const CaptchaClient = tencentcloud.captcha.v20190722.Client;

const client = new CaptchaClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY
  },
  region: "ap-guangzhou",
  profile: {
    httpProfile: {
      endpoint: "captcha.tencentcloudapi.com"
    }
  }
});

router.post("/verify", async (req, res) => {

  try {

    const { ticket, randstr } = req.body;

    if (!ticket || !randstr) {
      return res.status(400).json({
        Response: {
          CaptchaCode: 400,
          CaptchaMsg: "ticket e randstr obrigatórios"
        },
        retcode: 400,
        retmsg: "error"
      });
    }

    const result = await client.DescribeCaptchaResult({
      CaptchaType: 9,
      Ticket: ticket,
      Randstr: randstr,
      CaptchaAppId: Number(process.env.CAPTCHA_APP_ID),
      AppSecretKey: process.env.TENCENT_CAPTCHA_APP_SECRET_KEY,
      UserIp: req.headers["x-forwarded-for"] || req.socket.remoteAddress
    });

    console.log("[CAPTCHA] Tencent Response:", result);

    return res.json({
      Response: result,
      retcode: 0,
      retmsg: "success"
    });

  } catch (err) {

    console.error("[CAPTCHA ERROR]", err);

    return res.status(500).json({
      Response: {
        CaptchaCode: 500,
        CaptchaMsg: err.message
      },
      retcode: 500,
      retmsg: "error"
    });

  }

});

module.exports = router;