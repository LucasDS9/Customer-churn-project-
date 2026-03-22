(function () {
  var form          = document.getElementById("churn-form");
  var resultCard    = document.getElementById("result-card");
  var resultContent = document.getElementById("result-content");
  var errorBox      = document.getElementById("error-box");
  var submitBtn     = document.getElementById("submit-btn");
  var metricsBtn    = document.getElementById("metrics-btn");
  var modalOverlay  = document.getElementById("modal-overlay");
  var modalClose    = document.getElementById("modal-close");
  var modalBody     = document.getElementById("modal-body");
  var thresholdSlider  = document.getElementById("threshold-slider");
  var thresholdDisplay = document.getElementById("threshold-display");
  var thresholdDesc    = document.getElementById("threshold-desc");
  var tooltipBox       = document.getElementById("tooltip-box");

  function getApiBase() {
    if (typeof window.API_BASE !== "undefined") return window.API_BASE;
    return window.location.origin;
  }

  function getThreshold() {
    return parseInt(thresholdSlider.value) / 100;
  }

  var thresholdDescs = {
    low:  "Modo agressivo — captura mais churns mas gera mais alertas falsos. Use quando o custo de perder um cliente for alto.",
    mid:  "Padrão recomendado — equilibra detecção de churn e falsos positivos neste dataset desbalanceado.",
    high: "Modo conservador — só alerta churns com alta certeza. Use quando campanhas de retenção forem caras."
  };

  thresholdSlider.addEventListener("input", function () {
    var v = parseInt(this.value);
    thresholdDisplay.textContent = (v / 100).toFixed(2);
    document.getElementById("tb-low").className  = "tbadge" + (v <= 25 ? " active" : "");
    document.getElementById("tb-mid").className  = "tbadge" + (v > 25 && v < 50 ? " active" : "");
    document.getElementById("tb-high").className = "tbadge" + (v >= 50 ? " active" : "");
    thresholdDesc.textContent = v <= 25 ? thresholdDescs.low : v < 50 ? thresholdDescs.mid : thresholdDescs.high;
  });

  document.querySelectorAll(".tooltip-anchor").forEach(function (el) {
    el.addEventListener("mouseenter", function (e) {
      tooltipBox.textContent = el.getAttribute("data-tip");
      tooltipBox.classList.add("visible");
    });
    el.addEventListener("mousemove", function (e) {
      tooltipBox.style.left = (e.pageX + 12) + "px";
      tooltipBox.style.top  = (e.pageY - 8)  + "px";
    });
    el.addEventListener("mouseleave", function () {
      tooltipBox.classList.remove("visible");
    });
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.removeAttribute("hidden");
    resultCard.setAttribute("hidden", "");
  }

  function showLoading() {
    errorBox.setAttribute("hidden", "");
    resultCard.removeAttribute("hidden");
    resultContent.innerHTML =
      '<p style="color:#71717a;font-style:italic;">⏳ Analisando perfil com IA, aguarde...</p>';
  }

  function buildShapHtml(shap_values) {
    if (!shap_values || shap_values.length === 0) return "";
    var max = Math.max.apply(null, shap_values.map(function (d) { return Math.abs(d.value); }));
    var rows = shap_values.map(function (d) {
      var pct   = max > 0 ? Math.round(Math.abs(d.value) / max * 100) : 0;
      var color = d.value > 0 ? "#ef4444" : "#22c55e";  // vermelho = aumenta risco, verde = reduz risco
      var sign  = d.value > 0 ? "+" : "−";
      return (
        '<div class="shap-row">' +
          '<span class="shap-name">' + escapeHtml(d.feature) + '</span>' +
          '<div class="shap-bar-wrap"><div class="shap-bar" style="width:' + pct + '%;background:' + color + '"></div></div>' +
          '<span class="shap-val">' + sign + Math.abs(d.value).toFixed(3) + '</span>' +
        '</div>'
      );
    }).join("");

    return (
      '<div class="shap-section">' +
        '<div class="shap-label">Impacto por variável (SHAP)</div>' +
        rows +
        '<div class="shap-legend">' +
          '<span><span class="shap-dot" style="background:#ef4444"></span>aumenta risco de churn</span>' +
          '<span><span class="shap-dot" style="background:#22c55e"></span>reduz risco de churn</span>' +
        '</div>' +
      '</div>'
    );
  }

  function showResult(data) {
    errorBox.setAttribute("hidden", "");
    resultCard.removeAttribute("hidden");

    var riskClass = "risk-low";
    if (data.risk_level === "Medium Risk") riskClass = "risk-medium";
    if (data.risk_level === "High Risk")   riskClass = "risk-high";

    var riskPt = { "Low Risk": "Baixo Risco", "Medium Risk": "Risco Moderado", "High Risk": "Alto Risco" };
    var probPct = (data.churn_probability * 100).toFixed(2);

    var shapHtml = buildShapHtml(data.shap_values);

    var explanationHtml = "";
    if (data.explanation) {
      explanationHtml =
        '<div class="explanation-box">' +
          "<h3>Análise do agente</h3>" +
          "<p>" + escapeHtml(data.explanation).replace(/\n/g, "<br>") + "</p>" +
        "</div>";
    }

    resultContent.innerHTML =
      '<span class="risk-badge ' + riskClass + '">' + escapeHtml(riskPt[data.risk_level] || data.risk_level) + "</span>" +
      '<p class="prob">Probabilidade de churn: ' + probPct + "%</p>" +
      '<p class="meta">Predição: ' + (data.prediction === 1 ? "Churn" : "Sem churn") + "</p>" +
      shapHtml +
      explanationHtml;
  }

  function showMetrics(data) {
    var cm = data.confusion_matrix;
    var cr = data.classification_report;

    modalBody.innerHTML =
      '<div class="metrics-grid">' +
        '<div class="metric-item"><span class="metric-label">ROC-AUC</span><span class="metric-value">'   + (data.roc_auc * 100).toFixed(2)  + "%</span></div>" +
        '<div class="metric-item"><span class="metric-label">Acurácia</span><span class="metric-value">'  + (cr.accuracy * 100).toFixed(2)   + "%</span></div>" +
        '<div class="metric-item"><span class="metric-label">Threshold</span><span class="metric-value">' + data.threshold                    + "</span></div>" +
      "</div>" +

      "<h3>Relatório de classificação</h3>" +
      '<table class="metrics-table">' +
        "<thead><tr><th>Classe</th><th>Precisão</th><th>Recall</th><th>F1-score</th><th>Suporte</th></tr></thead>" +
        "<tbody>" +
          "<tr><td>Sem churn</td><td>" + (cr["0"].precision * 100).toFixed(1) + "%</td><td>" + (cr["0"].recall * 100).toFixed(1) + "%</td><td>" + (cr["0"]["f1-score"] * 100).toFixed(1) + "%</td><td>" + cr["0"].support + "</td></tr>" +
          "<tr><td>Churn</td><td>"     + (cr["1"].precision * 100).toFixed(1) + "%</td><td>" + (cr["1"].recall * 100).toFixed(1) + "%</td><td>" + (cr["1"]["f1-score"] * 100).toFixed(1) + "%</td><td>" + cr["1"].support + "</td></tr>" +
        "</tbody>" +
      "</table>" +

      "<h3>Matriz de confusão</h3>" +
      '<table class="metrics-table confusion-matrix">' +
        "<thead><tr><th></th><th>Previsto: Não</th><th>Previsto: Sim</th></tr></thead>" +
        "<tbody>" +
          "<tr><td><strong>Real: Não</strong></td><td class='cm-tn'>"  + cm[0][0] + "</td><td class='cm-fp'>" + cm[0][1] + "</td></tr>" +
          "<tr><td><strong>Real: Sim</strong></td><td class='cm-fn'>" + cm[1][0] + "</td><td class='cm-tp'>" + cm[1][1] + "</td></tr>" +
        "</tbody>" +
      "</table>" +

      "<h3>Principais fatores de churn</h3>" +
      '<ul class="insights-list">' +
        '<li><span class="insight-feature">Score de satisfação <span class="insight-corr negative">−0.562</span></span><span class="insight-desc">Fator mais importante. Quanto menor a satisfação, maior a probabilidade de churn.</span></li>' +
        '<li><span class="insight-feature">Reclamação <span class="insight-corr positive">+0.335</span></span><span class="insight-desc">Clientes que reclamaram têm forte tendência de abandonar o banco.</span></li>' +
        '<li><span class="insight-feature">Idade <span class="insight-corr positive">+0.127</span></span><span class="insight-desc">Clientes mais velhos apresentam maior chance de churn.</span></li>' +
        '<li><span class="insight-feature">Membro ativo <span class="insight-corr negative">−0.119</span></span><span class="insight-desc">Membros inativos têm mais probabilidade de sair.</span></li>' +
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
    var payload  = {};
    formData.forEach(function (value, key) {
      payload[key] = value === "" ? value : (isNaN(value) ? value : Number(value));
    });

    submitBtn.disabled    = true;
    submitBtn.textContent = "Analisando…";
    showLoading();

    fetch(getApiBase() + "/predict?threshold=" + getThreshold(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok) {
            var msg = body.detail || "Erro na requisição";
            if (typeof msg === "object" && msg.msg) msg = msg.msg;
            throw new Error(Array.isArray(msg) ? msg.join(" ") : msg);
          }
          return body;
        });
      })
      .then(showResult)
      .catch(function (err) { showError("Erro: " + err.message); })
      .finally(function () {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Analisar perfil";
      });
  });

  metricsBtn.addEventListener("click", function () {
    modalOverlay.removeAttribute("hidden");
    modalBody.textContent = "Carregando…";

    fetch(getApiBase() + "/metrics")
      .then(function (r) { return r.json(); })
      .then(showMetrics)
      .catch(function () { modalBody.textContent = "Falha ao carregar métricas."; });
  });

  modalClose.addEventListener("click", function () {
    modalOverlay.setAttribute("hidden", "");
  });

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) modalOverlay.setAttribute("hidden", "");
  });
})();