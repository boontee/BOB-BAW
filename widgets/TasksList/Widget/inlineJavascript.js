// TasksList Widget — BAW inline JavaScript
// TasksList binds directly to a LIST of TaskItem (isList:true on the bindingType).
// Confirmed BAW binding shapes (same pattern as ApprovalChain):
//   data (multi):  { items: [{label, status}, ...], ... }
//   data (single): { label, status }  — single TaskItem object directly
//   data: plain Array  — future-proof

var bodyEl = this.context.element.querySelector(".task-body");
var me = this;

function toStr(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "string") { return v; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    return "";
}

// For a direct list binding the root value IS the list — normalise it
function normaliseTaskList(raw) {
    if (!raw) { return []; }
    if (Array.isArray(raw)) { return raw; }
    if (raw.items && Array.isArray(raw.items)) { return raw.items; }
    // Single TaskItem delivered directly
    if (raw.label !== undefined || raw.status !== undefined) { return [raw]; }
    return [];
}

function getStatusIcon(status) {
    var s = (status || "").toLowerCase();
    if (s === "complete")   return '<svg width="20" height="20" viewBox="0 0 20 20" fill="#198038"><path d="M8 13l-4-4 1.4-1.4L8 10.2l6.6-6.6L16 5z"/></svg>';
    if (s === "processing") return '<svg width="20" height="20" viewBox="0 0 20 20" fill="#0043ce"><path d="M10 2v3a5 5 0 110 10v3a8 8 0 000-16z"/></svg>';
    if (s === "failed")     return '<svg width="20" height="20" viewBox="0 0 20 20" fill="#da1e28"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 9H9V5h2v6zM9 13h2v2H9v-2z"/></svg>';
    return '<svg width="20" height="20" viewBox="0 0 20 20" fill="#525252"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
}

function render(data) {
    try {
        var tasks = normaliseTaskList(data);

        if (tasks.length === 0) {
            tasks = [
                { label: "Review application documents", status: "Complete"   },
                { label: "Verify identity information",  status: "Processing" },
                { label: "Risk assessment",              status: "Pending"    },
                { label: "Final approval decision",      status: "Pending"    }
            ];
        }

        var table = document.createElement("table");
        table.className = "task-table";

        var thead = document.createElement("thead");
        var headerRow = document.createElement("tr");
        var thIcon   = document.createElement("th"); thIcon.className = "task-icon-cell";
        var thLabel  = document.createElement("th"); thLabel.className = "task-label-cell";   thLabel.textContent = "Task";
        var thStatus = document.createElement("th"); thStatus.className = "task-status-cell"; thStatus.textContent = "Status";
        headerRow.appendChild(thIcon);
        headerRow.appendChild(thLabel);
        headerRow.appendChild(thStatus);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        var tbody = document.createElement("tbody");
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            var statusStr = toStr(task.status);
            var row = document.createElement("tr");

            var iconCell = document.createElement("td");
            iconCell.className = "task-icon-cell";
            var iconSpan = document.createElement("span");
            iconSpan.className = "task-icon";
            iconSpan.innerHTML = getStatusIcon(statusStr);
            iconCell.appendChild(iconSpan);

            var labelCell = document.createElement("td");
            labelCell.className = "task-label-cell";
            labelCell.textContent = toStr(task.label);

            var statusCell = document.createElement("td");
            statusCell.className = "task-status-cell";
            var statusBadge = document.createElement("span");
            statusBadge.className = "task-status-badge " + statusStr.toLowerCase();
            statusBadge.textContent = statusStr;
            statusCell.appendChild(statusBadge);

            row.appendChild(iconCell);
            row.appendChild(labelCell);
            row.appendChild(statusCell);
            tbody.appendChild(row);
        }
        table.appendChild(tbody);

        bodyEl.innerHTML = "";
        bodyEl.appendChild(table);
    } catch(e) {
        bodyEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>TasksList error: " + e.message + "</p>";
    }
}

// ── data binding ───────────────────────────────────────────────────────────
// For a direct list binding the root value IS the list itself
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
