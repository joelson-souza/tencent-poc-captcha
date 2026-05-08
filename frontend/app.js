const btn = document.getElementById("btn");
const status = document.getElementById("status");

function setStatus(text) {
  status.innerText = text;
}

async function sendToBackend(ticket, randstr) {

  try {

    const res = await fetch("/api/captcha/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ticket,
        randstr
      })
    });

    const data = await res.json();

    if (data?.Response?.CaptchaCode === 1) {

      setStatus("✅ Captcha validado com sucesso!");

    } else {

      setStatus("❌ Falha na validação do Captcha");

    }

  } catch (err) {

    setStatus("Erro ao validar captcha");

  }
}

btn.onclick = function () {

  const container = document.createElement("div");

  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.zIndex = "999999";

  document.body.appendChild(container);

  const captcha = new TencentCaptcha(
    container,
    "CAPTCHA_APP_ID",

    function (res) {

      container.remove();

      if (res.ret === 0) {

        setStatus("Validando...");

        sendToBackend(
          res.ticket,
          res.randstr
        );

      } else {

        setStatus("Captcha cancelado");

      }
    },

    {}
  );

  captcha.show();
};