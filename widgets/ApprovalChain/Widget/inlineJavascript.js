// ApprovalChain Widget — BAW inline JavaScript
//
// BAW BO binding shapes for list properties:
//   multi-item list  → { items: [ {name,avatarInitial,role,department,status,statusColor,layer}, ... ] }
//   single item      → { name, avatarInitial, role, department, status, statusColor, layer }
//   plain primitive  → root.title, root.routeType, root.totalLayers
//
// All fixes applied:
//   FIX 1: No English "Layer N" header — image shows flat approver rows separated by borders
//   FIX 2: Status badge text → Traditional Chinese (已核准 / 審核中 / 已退回 / 待簽)
//   FIX 3: 催辦 button (orange outlined) rendered for status:"current" approver
//   FIX 14: Chinese fallback demo data

var titleEl = this.context.element.querySelector(".ac-header-title");
var badgeEl  = this.context.element.querySelector(".ac-route-badge");
var bodyEl   = this.context.element.querySelector(".ac-body");
var me = this;

// ── helpers ────────────────────────────────────────────────────────────────

function toStr(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "string")  { return v; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    return "";
}

function toNum(v) {
    if (typeof v === "number") { return v; }
    var n = parseInt(String(v), 10);
    return isNaN(n) ? 0 : n;
}

// FIX 2: map status key → Traditional Chinese display label
function statusLabel(sc) {
    if (sc === "approved") { return "已核准"; }
    if (sc === "current")  { return "審核中"; }
    if (sc === "rejected") { return "已退回"; }
    return "待簽";
}

// Normalise approvers list — handles all three BAW delivery shapes:
//   1. { items: [...] }  — BAW multi-item list wrapper
//   2. { name:... }      — BAW single-item delivered directly as object
//   3. Array             — future-proof plain array
function normaliseApprovers(raw) {
    if (!raw) { return []; }
    if (Array.isArray(raw)) { return raw; }
    if (raw.items && Array.isArray(raw.items)) { return raw.items; }
    // single item: BAW delivers it directly; detect by known Approver fields
    if (raw.name !== undefined || raw.role !== undefined || raw.status !== undefined) {
        return [raw];
    }
    return [];
}

// ── render ─────────────────────────────────────────────────────────────────

function render(data) {
    try {
        if (!data) {
            bodyEl.innerHTML = "<p style='padding:16px;color:#525252;font-family:\"IBM Plex Sans\",sans-serif;'>暫無串簽資料。</p>";
            return;
        }

        var titleVal       = toStr(data.title)       || "串簽流程";
        var routeTypeVal   = toStr(data.routeType)   || "";
        var totalLayersVal = toNum(data.totalLayers) || 1;

        titleEl.textContent = titleVal;
        badgeEl.textContent = routeTypeVal;
        bodyEl.innerHTML = "";

        var approvers = normaliseApprovers(data.approvers);

        // FIX 14: Chinese fallback demo data (matches image)
        if (approvers.length === 0) {
            approvers = [
                { name: "王志明", avatarInitial: "王", role: "直屬主管",   department: "採購部門", status: "approved", layer: 1 },
                { name: "李雅婷", avatarInitial: "李", role: "上一層主管", department: "採購總監", status: "current",  layer: 2 },
                { name: "張文豪", avatarInitial: "張", role: "最終核准",   department: "副總經理", status: "pending",  layer: 3 }
            ];
            totalLayersVal = 3;
        }

        // Group approvers by layer
        var layerMap = {};
        for (var li = 1; li <= totalLayersVal; li++) { layerMap[li] = []; }
        for (var ai = 0; ai < approvers.length; ai++) {
            var lv = toNum(approvers[ai].layer) || 1;
            if (!layerMap[lv]) { layerMap[lv] = []; }
            layerMap[lv].push(approvers[ai]);
        }

        for (var l = 1; l <= totalLayersVal; l++) {
            var layerDiv = document.createElement("div");
            layerDiv.className = "ac-layer";
            // FIX 1: NO "Layer N" label — image shows no layer header text

            var row = document.createElement("div");
            row.className = "ac-approvers-row";
            var people = layerMap[l] || [];

            if (people.length === 0) {
                row.innerHTML = "<span style='font-size:12px;color:#8d8d8d;'>無審核人</span>";
            } else {
                for (var j = 0; j < people.length; j++) {
                    (function(p) {
                        var pName   = toStr(p.name)          || "";
                        var pInit   = toStr(p.avatarInitial) || (pName ? pName.charAt(0) : "?");
                        var pRole   = toStr(p.role)          || "";
                        var pDept   = toStr(p.department)    || "";
                        var pStatus = toStr(p.status)        || "pending";
                        var sc      = pStatus.toLowerCase();

                        var card = document.createElement("div");
                        card.className = "ac-approver-card" + (sc === "current" ? " current" : "");
                        card.addEventListener("click", function() {
                            me.context.trigger("approverClicked", pName);
                        });

                        // avatar circle
                        var avatar = document.createElement("div");
                        avatar.className = "ac-avatar status-" + sc;
                        avatar.textContent = pInit;
                        card.appendChild(avatar);

                        // name + role/dept info block
                        var info = document.createElement("div");
                        info.className = "ac-approver-info";

                        var nameEl = document.createElement("div");
                        nameEl.className = "ac-approver-name";
                        nameEl.textContent = pName;
                        info.appendChild(nameEl);

                        var subEl = document.createElement("div");
                        subEl.className = "ac-approver-sub";
                        subEl.textContent = [pRole, pDept].filter(Boolean).join("．");
                        info.appendChild(subEl);

                        card.appendChild(info);

                        // FIX 3: 催辦 button — orange outlined, only for current-layer approver
                        if (sc === "current") {
                            var urgeBtn = document.createElement("button");
                            urgeBtn.className = "ac-urge-btn";
                            urgeBtn.textContent = "催辦";
                            urgeBtn.addEventListener("click", function(e) {
                                e.stopPropagation();
                                me.context.trigger("approverClicked", pName + ":催辦");
                            });
                            card.appendChild(urgeBtn);
                        }

                        // FIX 2: Chinese status badge label
                        var badge = document.createElement("span");
                        badge.className = "ac-status-badge " + sc;
                        badge.textContent = statusLabel(sc);
                        card.appendChild(badge);

                        row.appendChild(card);
                    })(people[j]);
                }
            }

            layerDiv.appendChild(row);
            bodyEl.appendChild(layerDiv);
        }

    } catch(e) {
        bodyEl.innerHTML = "<p style='padding:8px;color:#da1e28;font-family:monospace;font-size:12px;'>ApprovalChain error: " + e.message + "</p>";
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
