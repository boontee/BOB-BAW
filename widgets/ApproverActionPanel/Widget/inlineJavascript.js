// ApproverActionPanel Widget — BAW inline JavaScript
//
// BAW BO binding shapes for list properties:
//   multi-item list  → { items: [ {label, actionKey, style, enabled}, ... ] }
//   single item      → { label, actionKey, style, enabled }  — delivered directly
//   plain primitives → root.approverName, currentLayer, totalLayers,
//                      contextMessage, comment, decision
//
// All fixes applied:
//   FIX 4:  Layer badge → Traditional Chinese "第 N 層 / 共 M 層"
//   FIX 5:  Render order → contextMessage → actionsDiv → commentLabel → textarea
//           (matches image: context msg, then 退回/轉派/核准 buttons, then comment textarea)
//   FIX 6:  Comment label → "審核意見（選填）"
//   FIX 7:  Textarea placeholder → "填寫審核意見..."
//   Chinese fallback demo actions matching image (退回/轉派/核準)

var titleEl = this.context.element.querySelector(".aap-header-title");
var badgeEl = this.context.element.querySelector(".aap-layer-badge");
var bodyEl  = this.context.element.querySelector(".aap-body");
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

// Normalise actions list — handles all three BAW delivery shapes:
//   1. { items: [...] }  — BAW multi-item list wrapper
//   2. { label:... }     — BAW single-item delivered directly as object
//   3. Array             — future-proof plain array
function normaliseList(raw, detectKeys) {
    if (!raw) { return []; }
    if (Array.isArray(raw)) { return raw; }
    if (raw.items && Array.isArray(raw.items)) { return raw.items; }
    for (var ki = 0; ki < detectKeys.length; ki++) {
        if (raw[detectKeys[ki]] !== undefined) { return [raw]; }
    }
    return [];
}

function render(data) {
    try {
        if (!data) {
            bodyEl.innerHTML = "<p style='padding:16px;color:#525252;font-family:\"IBM Plex Sans\",sans-serif;'>暫無審核資料。</p>";
            return;
        }

        var approverName   = toStr(data.approverName)   || "待我審核";
        var currentLayer   = toNum(data.currentLayer);
        var totalLayers    = toNum(data.totalLayers);
        var contextMessage = toStr(data.contextMessage);
        var comment        = toStr(data.comment);

        titleEl.textContent = approverName;
        // FIX 4: Traditional Chinese layer badge
        badgeEl.textContent = (currentLayer && totalLayers)
            ? "第 " + currentLayer + " 層 / 共 " + totalLayers + " 層"
            : "";

        bodyEl.innerHTML = "";

        // 1. Context message (blue left-border box)
        if (contextMessage) {
            var ctx = document.createElement("div");
            ctx.className = "aap-context";
            ctx.textContent = contextMessage;
            bodyEl.appendChild(ctx);
        }

        // FIX 5: Actions BEFORE comment textarea (matches image layout)
        var actions = normaliseList(data.actions, ["label", "actionKey", "style", "enabled"]);
        // Chinese fallback demo actions matching image (退回 / 轉派 / 核准)
        if (actions.length === 0) {
            actions = [
                { label: "退回", actionKey: "return",   style: "danger",    enabled: true },
                { label: "轉派", actionKey: "delegate", style: "secondary", enabled: true },
                { label: "核准", actionKey: "approve",  style: "primary",   enabled: true }
            ];
        }

        var actionsDiv = document.createElement("div");
        actionsDiv.className = "aap-actions";
        for (var i = 0; i < actions.length; i++) {
            (function(action) {
                var btn = document.createElement("button");
                btn.className = "aap-btn aap-btn-" + (toStr(action.style) || "secondary");
                btn.textContent = toStr(action.label) || toStr(action.actionKey);
                btn.disabled = action.enabled === false;
                btn.addEventListener("click", function() {
                    me.context.trigger("actionClicked", toStr(action.actionKey));
                });
                actionsDiv.appendChild(btn);
            })(actions[i]);
        }
        bodyEl.appendChild(actionsDiv);

        // FIX 6 + 7: Comment label and textarea AFTER buttons, Chinese text
        var commentLabel = document.createElement("label");
        commentLabel.className = "aap-comment-label";
        commentLabel.textContent = "審核意見（選填）";  // FIX 6
        bodyEl.appendChild(commentLabel);

        var textarea = document.createElement("textarea");
        textarea.className = "aap-comment-textarea";
        textarea.placeholder = "填寫審核意見...";        // FIX 7
        textarea.value = comment;
        bodyEl.appendChild(textarea);

    } catch(e) {
        bodyEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>ApproverActionPanel error: " + e.message + "</p>";
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
