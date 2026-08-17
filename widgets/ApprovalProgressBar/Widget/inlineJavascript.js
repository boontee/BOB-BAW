// ApprovalProgressBar Widget — BAW inline JavaScript
// Confirmed BAW binding shapes (same pattern as ApprovalChain):
//   root.stages (multi):  { items: [{label, status, index}, ...], ... }
//   root.stages (single): { label, status, index }  — object directly
//   root.currentStageIndex, ctaLabel, ctaAction — plain primitives

var stagesEl = this.context.element.querySelector(".apb-stages");
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

// Normalise a list property — handles single-item, {items:[]} wrapper, or plain array
function normaliseList(raw, detectKeys) {
    if (!raw) { return []; }
    if (Array.isArray(raw)) { return raw; }
    if (raw.items && Array.isArray(raw.items)) { return raw.items; }
    // Single item: detect by known field names
    for (var ki = 0; ki < detectKeys.length; ki++) {
        if (raw[detectKeys[ki]] !== undefined) { return [raw]; }
    }
    return [];
}

function render(data) {
    try {
        if (!data) {
            stagesEl.innerHTML = "<p style='padding:16px;color:#525252;font-family:\"IBM Plex Sans\",sans-serif;'>No progress data.</p>";
            return;
        }

        var stages     = normaliseList(data.stages, ["label", "status", "index"]);
        var currentIdx = toNum(data.currentStageIndex);
        var ctaLabel   = toStr(data.ctaLabel);
        var ctaAction  = toStr(data.ctaAction);

        if (stages.length === 0) {
            stages = [
                { label: "起草送件", status: "completed" },
                { label: "簽核路由", status: "current"   },
                { label: "外部簽署", status: "pending"   },
                { label: "完成歸檔", status: "pending"   }
            ];
            currentIdx = 1;
        }

        stagesEl.innerHTML = "";

        // Remove any existing CTA button before re-render
        var existingCta = stagesEl.parentElement.querySelector(".apb-cta-btn");
        if (existingCta) { existingCta.parentElement.removeChild(existingCta); }

        for (var i = 0; i < stages.length; i++) {
            if (i > 0) {
                var connector = document.createElement("div");
                var prevStatus = toStr(stages[i - 1].status) || (i - 1 < currentIdx ? "completed" : "pending");
                connector.className = "apb-connector" + (prevStatus === "completed" ? " completed" : "");
                stagesEl.appendChild(connector);
            }
            var stepDiv   = document.createElement("div");
            stepDiv.className = "apb-stage";
            var nodeDiv   = document.createElement("div");
            nodeDiv.className = "apb-node";
            var circleDiv = document.createElement("div");
            var stageStatus = toStr(stages[i].status) || (i < currentIdx ? "completed" : (i === currentIdx ? "current" : "pending"));
            circleDiv.className = "apb-circle " + stageStatus;
            if (stageStatus === "completed") {
                circleDiv.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 11L2 7l1.4-1.4L6 8.2l6.6-6.6L14 3z"/></svg>';
            } else {
                circleDiv.textContent = String(i + 1);
            }
            nodeDiv.appendChild(circleDiv);
            var labelDiv = document.createElement("div");
            labelDiv.className = "apb-stage-label" + (stageStatus === "current" ? " current" : "");
            labelDiv.textContent = toStr(stages[i].label) || ("Step " + (i + 1));
            nodeDiv.appendChild(labelDiv);
            stepDiv.appendChild(nodeDiv);
            stagesEl.appendChild(stepDiv);
        }

        if (ctaLabel) {
            var ctaBtn = document.createElement("button");
            ctaBtn.className = "apb-cta-btn";
            ctaBtn.textContent = ctaLabel;
            ctaBtn.addEventListener("click", function() {
                me.context.trigger("ctaClicked", ctaAction);
            });
            stagesEl.parentElement.appendChild(ctaBtn);
        }
    } catch(e) {
        stagesEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>ApprovalProgressBar error: " + e.message + "</p>";
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
