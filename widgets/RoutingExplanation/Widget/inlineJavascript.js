// RoutingExplanation Widget — BAW inline JavaScript
// Confirmed BAW binding shape (same pattern as ApprovalChain):
//   root.title, explanation, ruleId, triggeredByAmount, threshold, nextAction — all plain primitives

var titleEl = this.context.element.querySelector(".re-header-title");
var iconEl  = this.context.element.querySelector(".re-header-icon");
var bodyEl  = this.context.element.querySelector(".re-body");
var me = this;

function toStr(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "string") { return v; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    return "";
}

function render(data) {
    try {
        iconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 10.5H7v-5h2v5zm0-7H7V2.5h2V4.5z"/></svg>';

        if (!data) {
            titleEl.textContent = "Routing Rule";
            bodyEl.innerHTML = "<p style='padding:16px;color:#525252;font-family:\"IBM Plex Sans\",sans-serif;'>No routing rule data.</p>";
            return;
        }

        var title             = toStr(data.title)             || "Routing Rule";
        var explanation       = toStr(data.explanation);
        var ruleId            = toStr(data.ruleId);
        var triggeredByAmount = toStr(data.triggeredByAmount);
        var threshold         = toStr(data.threshold);
        var nextAction        = toStr(data.nextAction);

        titleEl.textContent = title;
        bodyEl.innerHTML = "";

        // Remove any stale ruleId badge from previous render
        var oldBadge = titleEl.parentElement.querySelector(".re-rule-id");
        if (oldBadge) { oldBadge.parentElement.removeChild(oldBadge); }

        if (ruleId) {
            var ruleIdEl = document.createElement("span");
            ruleIdEl.className = "re-rule-id";
            ruleIdEl.textContent = "Rule: " + ruleId;
            titleEl.parentElement.appendChild(ruleIdEl);
        }

        var explanationEl = document.createElement("div");
        explanationEl.className = "re-explanation";
        explanationEl.textContent = explanation || "This request meets the threshold for multi-level approval routing.";
        bodyEl.appendChild(explanationEl);

        if (triggeredByAmount || threshold) {
            var thresholds = document.createElement("div");
            thresholds.className = "re-thresholds";
            if (triggeredByAmount) {
                var amtItem = document.createElement("div");
                amtItem.className = "re-threshold-item";
                var amtLabel = document.createElement("div");
                amtLabel.className = "re-threshold-label";
                amtLabel.textContent = "Request Amount";
                var amtVal = document.createElement("div");
                amtVal.className = "re-threshold-value triggered";
                amtVal.textContent = triggeredByAmount;
                amtItem.appendChild(amtLabel);
                amtItem.appendChild(amtVal);
                thresholds.appendChild(amtItem);
            }
            if (threshold) {
                var thrItem = document.createElement("div");
                thrItem.className = "re-threshold-item";
                var thrLabel = document.createElement("div");
                thrLabel.className = "re-threshold-label";
                thrLabel.textContent = "Approval Threshold";
                var thrVal = document.createElement("div");
                thrVal.className = "re-threshold-value";
                thrVal.textContent = threshold;
                thrItem.appendChild(thrLabel);
                thrItem.appendChild(thrVal);
                thresholds.appendChild(thrItem);
            }
            bodyEl.appendChild(thresholds);
        }

        if (nextAction) {
            var nextRow = document.createElement("div");
            nextRow.className = "re-next-action-row";
            var nextLabel = document.createElement("span");
            nextLabel.className = "re-next-label";
            nextLabel.textContent = "Recommended Action:";
            nextRow.appendChild(nextLabel);
            var nextLink = document.createElement("button");
            nextLink.className = "re-next-link";
            nextLink.textContent = nextAction;
            nextLink.addEventListener("click", function() {
                me.context.trigger("nextActionClicked", nextAction);
            });
            nextRow.appendChild(nextLink);
            bodyEl.appendChild(nextRow);
        }
    } catch(e) {
        bodyEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>RoutingExplanation error: " + e.message + "</p>";
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
