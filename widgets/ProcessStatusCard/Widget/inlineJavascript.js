// ProcessStatusCard Widget — BAW inline JavaScript
//
// BAW BO binding shapes (all plain primitives — no list properties):
//   root.routeType, submittedAt, estimatedCompletion, aiScore, aiMaxScore,
//   aiSuggestionLabel, aiSuggestionAction
//
// All fixes applied:
//   FIX 8:  "Submitted"       label → "送審時間"
//   FIX 9:  "Est. Completion" label → "預計完成"
//   FIX 10: fallback labels        → "送審時間" / "預計完成"
//   FIX 11: "AI Risk Score"   label → "AI 審查結果"

var bannerEl = this.context.element.querySelector(".psc-route-banner");
var bodyEl   = this.context.element.querySelector(".psc-body");
var me = this;

function toStr(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "string") { return v; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    return "";
}

function toNum(v) {
    if (typeof v === "number") { return v; }
    var n = parseInt(String(v), 10);
    return isNaN(n) ? 0 : n;
}

function createMetaItem(label, value) {
    var item = document.createElement("div");
    item.className = "psc-meta-item";
    var lbl = document.createElement("div");
    lbl.className = "psc-meta-label";
    lbl.textContent = label;
    var val = document.createElement("div");
    val.className = "psc-meta-value";
    val.textContent = value;
    item.appendChild(lbl);
    item.appendChild(val);
    return item;
}

function render(data) {
    try {
        if (!data) {
            bodyEl.innerHTML = "<p style='padding:16px;color:#525252;font-family:\"IBM Plex Sans\",sans-serif;'>暫無流程狀態資料。</p>";
            return;
        }

        var routeType           = toStr(data.routeType);
        var submittedAt         = toStr(data.submittedAt);
        var estimatedCompletion = toStr(data.estimatedCompletion);
        var aiScore             = toNum(data.aiScore);
        var aiMaxScore          = toNum(data.aiMaxScore) || 100;
        var aiSuggestionLabel   = toStr(data.aiSuggestionLabel);
        var aiSuggestionAction  = toStr(data.aiSuggestionAction);

        if (routeType) {
            bannerEl.style.display = "";
            bannerEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink:0"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 10.5H7v-5h2v5zm0-7H7V2.5h2V4.5z"/></svg> ';
            var routeText = document.createElement("span");
            routeText.textContent = routeType;
            bannerEl.appendChild(routeText);
        } else {
            bannerEl.style.display = "none";
        }

        bodyEl.innerHTML = "";

        var metaRow = document.createElement("div");
        metaRow.className = "psc-meta-row";

        // FIX 8: "送審時間" | FIX 9: "預計完成"
        if (submittedAt)         { metaRow.appendChild(createMetaItem("送審時間", submittedAt)); }
        if (estimatedCompletion) { metaRow.appendChild(createMetaItem("預計完成", estimatedCompletion)); }
        // FIX 10: fallback labels in Chinese
        if (!submittedAt && !estimatedCompletion) {
            metaRow.appendChild(createMetaItem("送審時間", "—"));
            metaRow.appendChild(createMetaItem("預計完成", "—"));
        }
        bodyEl.appendChild(metaRow);

        if (aiMaxScore > 0) {
            var divider = document.createElement("div");
            divider.className = "psc-divider";
            bodyEl.appendChild(divider);

            var aiSection = document.createElement("div");
            aiSection.className = "psc-ai-section";

            // FIX 11: "AI 審查結果" label
            var aiLabel = document.createElement("div");
            aiLabel.className = "psc-ai-label";
            aiLabel.textContent = "AI 審查結果";
            aiSection.appendChild(aiLabel);

            var gaugeTrack = document.createElement("div");
            gaugeTrack.className = "psc-ai-gauge-track";
            var gaugeFill = document.createElement("div");
            gaugeFill.className = "psc-ai-gauge-fill";
            var pct = Math.min(100, Math.round((aiScore / aiMaxScore) * 100));
            gaugeFill.style.width = pct + "%";
            if (pct >= 70)      { gaugeFill.style.background = "#da1e28"; }
            else if (pct >= 40) { gaugeFill.style.background = "#f1c21b"; }
            gaugeTrack.appendChild(gaugeFill);
            aiSection.appendChild(gaugeTrack);

            var scoreText = document.createElement("div");
            scoreText.className = "psc-ai-score-text";
            scoreText.textContent = aiScore + " / " + aiMaxScore;
            aiSection.appendChild(scoreText);

            if (aiSuggestionLabel) {
                var suggBtn = document.createElement("button");
                suggBtn.className = "psc-ai-suggestion";
                suggBtn.textContent = aiSuggestionLabel;
                suggBtn.addEventListener("click", function() {
                    me.context.trigger("aiSuggestionClicked", aiSuggestionAction);
                });
                aiSection.appendChild(suggBtn);
            }
            bodyEl.appendChild(aiSection);
        }
    } catch(e) {
        bodyEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>ProcessStatusCard error: " + e.message + "</p>";
    }
}

// ── data binding ───────────────────────────────────────────────────────────
var bound = false;

if (this.context && this.context.binding && typeof this.context.binding.connect === "function") {
    this.context.binding.connect(function(val) { bound = true; render(val); });
}

if (!bound) {
    var d = this.getData ? this.getData() : null;
    if (d) { render(d); bound = true; }
}

if (!bound) {
    setTimeout(function() {
        try { var bv = me.context.binding.get("value"); if (bv) { render(bv); bound = true; } } catch(e) {}
        if (!bound) { render(null); }
    }, 300);
}
