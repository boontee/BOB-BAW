// AuditTimeline Widget — BAW inline JavaScript
//
// BAW BO binding shapes for list properties:
//   multi-item list  → { items: [ {actor, action, timestamp, detail, isHighlighted, attachmentRef}, ... ] }
//   single item      → { actor, action, timestamp, detail, isHighlighted, attachmentRef } — delivered directly
//
// All fixes applied:
//   FIX 12: Header title → "審核歷程" (no English "Audit Trail (N)" count suffix)
//   FIX 13: Fallback demo data → Traditional Chinese matching image

var titleEl = this.context.element.querySelector(".at-header-title");
var listEl  = this.context.element.querySelector(".at-list");
var me = this;

function toStr(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "string") { return v; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    return "";
}

// Normalise events list — handles all three BAW delivery shapes:
//   1. { items: [...] }  — BAW multi-item list wrapper
//   2. { actor:... }     — BAW single-item delivered directly as object
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
        var events = data ? normaliseList(data.events, ["actor", "action", "timestamp", "detail"]) : [];

        // FIX 13: Chinese fallback demo data matching image exactly
        if (events.length === 0) {
            events = [
                { timestamp: "07-14 09:32", actor: "陳大明", action: "送審",
                  detail: "陳大明送審，附 AI 報告", isHighlighted: false },
                { timestamp: "07-14 11:05", actor: "王志明", action: "核准",
                  detail: "王志明核准 — 「條款無誤，同意送上級」", isHighlighted: true },
                { timestamp: "07-14 11:05", actor: "系統",   action: "通知",
                  detail: "系統通知李雅婷待審", isHighlighted: false }
            ];
        }

        // FIX 12: Chinese header, no English count suffix
        titleEl.textContent = "審核歷程";
        listEl.innerHTML = "";

        for (var i = 0; i < events.length; i++) {
            (function(evt, idx) {
                var actionLower = toStr(evt.action).toLowerCase();
                var highlighted = evt.isHighlighted === true || evt.isHighlighted === "true";

                var eventDiv = document.createElement("div");
                eventDiv.className = "at-event" + (highlighted ? " highlighted" : "");
                eventDiv.addEventListener("click", function() { me.context.trigger("eventClicked", idx); });

                // timeline dot
                var dot = document.createElement("div");
                dot.className = "at-dot"
                    + (highlighted               ? " highlighted" : "")
                    + (actionLower === "核准" || actionLower === "approved" ? " approved" : "")
                    + (actionLower === "退回" || actionLower === "rejected" ? " rejected" : "");
                eventDiv.appendChild(dot);

                // event header: actor | action badge | timestamp
                var eventHeader = document.createElement("div");
                eventHeader.className = "at-event-header";

                var actor = document.createElement("span");
                actor.className = "at-actor";
                actor.textContent = toStr(evt.actor) || "系統";
                eventHeader.appendChild(actor);

                var actionStr = toStr(evt.action);
                if (actionStr) {
                    var actionBadge = document.createElement("span");
                    // keep actionLower for CSS class; the badge text is already Chinese from data
                    actionBadge.className = "at-action-badge " + actionLower;
                    actionBadge.textContent = actionStr;
                    eventHeader.appendChild(actionBadge);
                }

                var tsStr = toStr(evt.timestamp);
                if (tsStr) {
                    var ts = document.createElement("span");
                    ts.className = "at-timestamp";
                    ts.textContent = tsStr;
                    eventHeader.appendChild(ts);
                }
                eventDiv.appendChild(eventHeader);

                // detail line
                var detailStr = toStr(evt.detail);
                if (detailStr) {
                    var detail = document.createElement("div");
                    detail.className = "at-detail";
                    detail.textContent = detailStr;
                    eventDiv.appendChild(detail);
                }

                listEl.appendChild(eventDiv);
            })(events[i], i);
        }
    } catch(e) {
        listEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>AuditTimeline error: " + e.message + "</p>";
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
