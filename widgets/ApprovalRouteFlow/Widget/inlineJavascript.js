// ApprovalRouteFlow Widget — BAW inline JavaScript
// Confirmed BAW binding shapes (same pattern as ApprovalChain):
//   root.steps (multi):  { items: [{label, sublabel, status, colorToken}, ...], ... }
//   root.steps (single): { label, sublabel, status, colorToken }  — object directly

var flowEl = this.context.element.querySelector(".arf-flow");
var me = this;

function toStr(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "string") { return v; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    return "";
}

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
        var steps = data ? normaliseList(data.steps, ["label", "sublabel", "status", "colorToken"]) : [];

        if (steps.length === 0) {
            steps = [
                { label: "已提交",   sublabel: "已完成",   status: "completed" },
                { label: "審核中",   sublabel: "進行中",   status: "current"   },
                { label: "最終審批", sublabel: "",         status: "pending"   }
            ];
        }

        flowEl.innerHTML = "";

        for (var i = 0; i < steps.length; i++) {
            (function(step, idx) {
                if (idx > 0) {
                    var arrow = document.createElement("div");
                    var prevStatus = toStr(steps[idx - 1].status || "pending").toLowerCase();
                    arrow.className = "arf-arrow" + (prevStatus === "completed" ? " completed" : "");
                    flowEl.appendChild(arrow);
                }
                var stepEl = document.createElement("div");
                stepEl.className = "arf-step";
                var nodeEl = document.createElement("div");
                nodeEl.className = "arf-node";
                nodeEl.addEventListener("click", function() { me.context.trigger("stepClicked", idx); });
                var circle = document.createElement("div");
                var statusClass = toStr(step.status || "pending").toLowerCase();
                circle.className = "arf-circle " + statusClass;
                if (statusClass === "completed") {
                    circle.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M7 12.5L3 8.5l1.4-1.4L7 9.7l6.6-6.6L15 4.5z"/></svg>';
                } else if (statusClass === "rejected") {
                    circle.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                } else {
                    circle.textContent = String(idx + 1);
                }
                nodeEl.appendChild(circle);
                var labelEl = document.createElement("div");
                labelEl.className = "arf-node-label";
                labelEl.textContent = toStr(step.label) || ("第 " + (idx + 1) + " 步");
                nodeEl.appendChild(labelEl);
                var sublabel = toStr(step.sublabel);
                if (sublabel) {
                    var sublabelEl = document.createElement("div");
                    sublabelEl.className = "arf-node-sublabel";
                    sublabelEl.textContent = sublabel;
                    nodeEl.appendChild(sublabelEl);
                }
                stepEl.appendChild(nodeEl);
                flowEl.appendChild(stepEl);
            })(steps[i], i);
        }
    } catch(e) {
        flowEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>ApprovalRouteFlow error: " + e.message + "</p>";
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
