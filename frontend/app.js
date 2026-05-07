const btn = document.getElementById("btn");
const status = document.getElementById("status");

function set(obj) {
  status.innerText =
    typeof obj === "string"
      ? obj
      : JSON.stringify(obj, null, 2);
}

/**
 * 💾 salva histórico local (para dashboard)
 */
function saveToDashboard(data) {
  const history = JSON.parse(localStorage.getItem("captcha_history") || "[]");

  history.unshift({
    ...data,
    savedAt: new Date().toISOString()
  });

  if (history.length > 50) history.pop();

  localStorage.setItem("captcha_history", JSON.stringify(history));
}

async function sendToBackend(ticket, randstr) {
  const res = await fetch("/api/captcha/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ticket, randstr })
  });

  const data = await res.json();

  const payload = {
    captcha_result: data.Response,   // 🔥 CORRETO AGORA
    validation: data.validation,
    audit: {
      traceId: data.audit?.traceId,
      tencent_request_id: data.audit?.tencentRequestId,
      backend_ms: data.validation?.backend_validation_ms
    }
  };

  set(payload);
  saveToDashboard(payload);
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
    "189904786",
    function (res) {
      container.remove();

      if (res.ret === 0) {
        set("Validando backend...");
        sendToBackend(res.ticket, res.randstr);
      } else {
        set("Captcha cancelado");
      }
    },
    {}
  );

  captcha.show();
};