const form = document.getElementById("fraudForm");
const demo = document.getElementById("demoBtn");
const empty = document.getElementById("emptyState");
const verdict = document.getElementById("verdict");
const panel = document.getElementById("resultPanel");

const n = (id) => Number(document.getElementById(id).value);

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

demo.addEventListener("click", () => {
  document.getElementById("type").value = "CASH_OUT";
  document.getElementById("amount").value = 850000;
  document.getElementById("oldbalanceOrg").value = 850000;
  document.getElementById("newbalanceOrig").value = 0;
  document.getElementById("oldbalanceDest").value = 150000;
  document.getElementById("newbalanceDest").value = 1000000;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = form.querySelector(".scan");
  const original = button.innerHTML;

  button.disabled = true;
  button.innerHTML = "<span>ANALYZING...</span><b>◌</b>";

  const payload = {
    type: document.getElementById("type").value,
    amount: n("amount"),
    oldbalanceOrg: n("oldbalanceOrg"),
    newbalanceOrig: n("newbalanceOrig"),
    oldbalanceDest: n("oldbalanceDest"),
    newbalanceDest: n("newbalanceDest")
  };

  if (
    Object.values(payload).some((value) => value === "" || Number.isNaN(value)) ||
    payload.amount < 0 ||
    payload.oldbalanceOrg < 0 ||
    payload.newbalanceOrig < 0 ||
    payload.oldbalanceDest < 0 ||
    payload.newbalanceDest < 0
  ) {
    alert("Please enter valid transaction values.");
    button.disabled = false;
    button.innerHTML = original;
    return;
  }

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Prediction failed");
    }

    renderResult(data, payload);
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

function renderResult(data, payload) {
  empty.classList.add("hidden");
  verdict.classList.remove("hidden");

  panel.classList.remove("alert", "warn");

  if (data.prediction === 1) {
    panel.classList.add(data.risk === "CRITICAL" ? "alert" : "warn");
  }

  document.getElementById("verdictLabel").textContent = data.label;
  document.getElementById("riskChip").textContent = data.risk;
  document.getElementById("probability").textContent =
    `${data.fraud_probability}%`;

  document.getElementById("meterFill").style.width =
    `${Math.max(0, Math.min(100, data.fraud_probability))}%`;

  document.getElementById("outType").textContent = payload.type;
  document.getElementById("outAmount").textContent = money(payload.amount);
  document.getElementById("outStatus").textContent =
    data.prediction === 1 ? "REVIEW" : "CLEAR";

  const message = document.getElementById("verdictMessage");

  if (data.prediction === 1) {
    if (data.risk === "CRITICAL") {
      message.textContent =
        "🚨 Yeah… this one is giving SUS. High-risk fraud signal detected.";
    } else {
      message.textContent =
        "⚠️ Hmm… the transaction is looking kinda sus. The model picked up a fraud signal — worth a closer look.";
    }
  } else {
    message.textContent =
      "✓ We’re good. No sus activity detected — this transaction looks clean.";
  }
}
