const btn = document.getElementById("btn");
const status = document.getElementById("status");

/**
 * 🔥 MOSTRA RAW EXATO
 */
function set(obj) {
  status.innerText =
    typeof obj === "string"
      ? obj
      : JSON.stringify(obj, null, 2);
}

/**
 * 🔥 BACKEND CALL
 */
async function sendToBackend(ticket, randstr) {

  const res = await fetch("/api/captcha/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ticket, randstr })
  });

  const data = await res.json();

  console.log("[BACKEND RAW]", data);

  /**
   * 🔥 EXIBIR EXATAMENTE COMO TENCENT
   */
  set({
    "[CAPTCHA] Tencent Response": data.Response
  });

}

btn.onclick = function () {

  const container = document.createElement("div");

  /**
   * 🔥 FIX CRÍTICO: força comportamento de modal centralizado
   */
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

      console.log("CAPTCHA RESPONSE:", res);

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