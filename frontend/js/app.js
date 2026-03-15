(function () {
  var form = document.getElementById("churn-form");
  var resultCard = document.getElementById("result-card");
  var resultContent = document.getElementById("result-content");
  var errorBox = document.getElementById("error-box");
  var submitBtn = document.getElementById("submit-btn");
  var metricsBtn = document.getElementById("metrics-btn");
  var modalOverlay = document.getElementById("modal-overlay");
  var modalClose = document.getElementById("modal-close");
  var modalBody = document.getElementById("modal-body");

  function getApiBase() {
    if (typeof window.API_BASE !== "undefined") return window.API_BASE;
    return window.location.origin;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.removeAttribute("hidden");
    resultCard.setAttribute("hidden", "");
  }

  function showResult(data) {
    errorBox.setAttribute("hidden", "");
    resultCard.removeAttribute("hidden");

    var riskClass = "risk-low";
    if (data.risk_level === "Medium Risk") riskClass = "risk-medium";
    if (data.risk_level === "High Risk") riskClass = "risk-high";

    var probPct = (data.churn_probability * 100).toFixed(2);

    resultContent.innerHTML =
      '<span class="risk-badge ' + riskClass + '">' + escapeHtml(data.risk_level) + "</span>" +
      '<p class="prob">Churn probability: ' + probPct + "%</p>" +
      '<p class="meta">Prediction: ' + (data.prediction === 1 ? "Churn" : "No churn") + "</p>";
  }

  function showMetrics(data) {
    var cm = data.confusion_matrix;
    var cr = data.classification_report;

    modalBody.innerHTML =
      '<div class="metrics-grid">' +
        '<div class="metric-item"><span class="metric-label">ROC-AUC</span><span class="metric-value">' + (data.roc_auc * 100).toFixed(2) + "%</span></div>" +
        '<div class="metric-item"><span class="metric-label">Accuracy</span><span class="metric-value">' + (cr.accuracy * 100).toFixed(2) + "%</span></div>" +
        '<div class="metric-item"><span class="metric-label">Threshold</span><span class="metric-value">' + data.threshold + "</span></div>" +
      "</div>" +

      "<h3>Classification report</h3>" +
      '<table class="metrics-table">' +
        "<thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-score</th><th>Support</th></tr></thead>" +
        "<tbody>" +
          "<tr><td>No churn</td><td>" + (cr["0"].precision * 100).toFixed(1) + "%</td><td>" + (cr["0"].recall * 100).toFixed(1) + "%</td><td>" + (cr["0"]["f1-score"] * 100).toFixed(1) + "%</td><td>" + cr["0"].support + "</td></tr>" +
          "<tr><td>Churn</td><td>" + (cr["1"].precision * 100).toFixed(1) + "%</td><td>" + (cr["1"].recall * 100).toFixed(1) + "%</td><td>" + (cr["1"]["f1-score"] * 100).toFixed(1) + "%</td><td>" + cr["1"].support + "</td></tr>" +
        "</tbody>" +
      "</table>" +

      "<h3>Confusion matrix</h3>" +
      '<table class="metrics-table confusion-matrix">' +
        "<thead><tr><th></th><th>Predicted No</th><th>Predicted Yes</th></tr></thead>" +
        "<tbody>" +
          "<tr><td><strong>Actual No</strong></td><td class='cm-tn'>" + cm[0][0] + "</td><td class='cm-fp'>" + cm[0][1] + "</td></tr>" +
          "<tr><td><strong>Actual Yes</strong></td><td class='cm-fn'>" + cm[1][0] + "</td><td class='cm-tp'>" + cm[1][1] + "</td></tr>" +
        "</tbody>" +
      "</table>" +

      "<h3>Key features correlated with churn</h3>" +
      '<ul class="insights-list">' +
        '<li><span class="insight-feature">Satisfaction Score <span class="insight-corr negative">−0.562</span></span>' +
        '<span class="insight-desc">Most important factor. The lower the satisfaction, the higher the churn probability.</span></li>' +
        '<li><span class="insight-feature">Complain <span class="insight-corr positive">+0.335</span></span>' +
        '<span class="insight-desc">Customers who file complaints have a strong tendency to leave the bank.</span></li>' +
        '<li><span class="insight-feature">Age <span class="insight-corr positive">+0.127</span></span>' +
        '<span class="insight-desc">Older customers show a higher chance of churning.</span></li>' +
        '<li><span class="insight-feature">IsActiveMember <span class="insight-corr negative">−0.119</span></span>' +
        '<span class="insight-desc">Inactive members are more likely to leave.</span></li>' +
      "</ul>";
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }


  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.setAttribute("hidden", "");

    var formData = new FormData(form);
    var payload = {};
    formData.forEach(function (value, key) {
      payload[key] = value === "" ? value : (isNaN(value) ? value : Number(value));
    });

    submitBtn.disabled = true;
    submitBtn.textContent = "Predicting…";

    fetch(getApiBase() + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok) {
            var msg = body.detail || "Request failed";
            if (typeof msg === "object" && msg.msg) msg = msg.msg;
            throw new Error(Array.isArray(msg) ? msg.join(" ") : msg);
          }
          return body;
        });
      })
      .then(showResult)
      .catch(function (err) { showError("Error: " + err.message); })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Predict churn";
      });
  });

  
  metricsBtn.addEventListener("click", function () {
    modalOverlay.removeAttribute("hidden");
    modalBody.textContent = "Loading…";

    fetch(getApiBase() + "/metrics")
      .then(function (r) { return r.json(); })
      .then(showMetrics)
      .catch(function () { modalBody.textContent = "Failed to load metrics."; });
  });

  modalClose.addEventListener("click", function () {
    modalOverlay.setAttribute("hidden", "");
  });

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) modalOverlay.setAttribute("hidden", "");
  });
})();