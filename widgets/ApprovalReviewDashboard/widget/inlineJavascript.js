// ApprovalReviewDashboard Widget — BAW inline JavaScript
//
// Strategy:
//   Layout.html ships with complete static markup (visible before JS runs).
//   This script:
//   1. Wires ALL interactive elements to BAW events immediately (Phase 1).
//   2. When BAW binding data arrives, re-renders every section (Phase 2).
//
// BAW binding shape:  ApprovalReviewDashboard BO (isList: false)
//   All list properties arrive as  { items: [ ... ] }  from BAW.
//   Single-item lists arrive as the item object directly (no wrapper).
//   This script normalises both shapes via normList() before use.
//
// BAW Events fired:
//   ctaClicked(ctaAction)       — top CTA button + AI suggestion link
//   actionClicked(actionKey)    — 退回 / 轉派 / 核准 buttons
//   urgeClicked(approverIndex)  — 催辦 buttons on approver rows
//   commentChanged(comment)     — textarea oninput
//   stepClicked(stepIndex)      — route flow step boxes

var me = this;

// ── Design-time guard ─────────────────────────────────────────────────────
// BAW Process Designer calls this script with no real DOM during design mode.
if (!this.context || !this.context.element || !this.context.element.querySelector) {
    return;
}

var root = this.context.element.querySelector(".ard-root");
if (!root) { return; }

// ── Static element refs ───────────────────────────────────────────────────
var stagesEl      = root.querySelector("#ard-stages");
var ctaBtn        = root.querySelector("#ard-cta-btn");
var contractEl    = root.querySelector("#ard-contract-title");
var chainTitleEl  = root.querySelector("#ard-chain-title");
var chainListEl   = root.querySelector("#ard-chain-list");
var routeTypeEl   = root.querySelector("#ard-route-type");
var submittedAtEl = root.querySelector("#ard-submitted-at");
var estComplEl    = root.querySelector("#ard-est-completion");
var aiScoreEl     = root.querySelector("#ard-ai-score");
var aiLinkEl      = root.querySelector("#ard-ai-link");
var auditListEl   = root.querySelector("#ard-audit-list");
var actionTitleEl = root.querySelector("#ard-action-title");
var contextMsgEl  = root.querySelector("#ard-context-msg");
var actionBtnsEl  = root.querySelector("#ard-action-buttons");
var commentArea   = root.querySelector("#ard-comment-area");
var routeTextEl   = root.querySelector("#ard-route-text");
var routeFlowEl   = root.querySelector("#ard-route-flow");

// ══════════════════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════════════════

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

function toBool(v) {
    if (typeof v === "boolean") { return v; }
    if (v === "true" || v === 1 || v === "1") { return true; }
    return false;
}

/**
 * Normalise a BAW list property into a plain JS array.
 *
 * BAW delivers list properties in three possible shapes:
 *   1. { items: [...] }   — standard multi-item list wrapper
 *   2. { key: value, … }  — BAW wraps a single-item list as the item itself
 *   3. [...]              — plain array (future-proof / direct JS assignment)
 *
 * @param {*}        raw         Raw value from BAW binding
 * @param {string[]} detectKeys  Field names present on a single item of this
 *                               list type; used to detect shape (2).
 * @returns {Array}
 */
function normList(raw, detectKeys) {
    if (!raw) { return []; }
    if (Array.isArray(raw)) { return raw; }
    // Shape 1: { items: [...] }
    if (raw.items && Array.isArray(raw.items)) { return raw.items; }
    // Shape 2: single item delivered as the object itself
    for (var ki = 0; ki < detectKeys.length; ki++) {
        if (raw[detectKeys[ki]] !== undefined) { return [raw]; }
    }
    return [];
}

// ══════════════════════════════════════════════════════════════════════════
//  Fallback / mock data
//
//  Structure mirrors the ApprovalReviewDashboard BO schema exactly.
//  List properties use the BAW { items: [...] } wrapper so that fallback
//  data passes through normList() identically to live binding data.
// ══════════════════════════════════════════════════════════════════════════
var FALLBACK = {
    // String — ApprovalReviewDashboard.contractTitle
    contractTitle: "2026 年度軟體維護服務合約",

    // DashboardProgress
    progress: {
        currentStageIndex: 1,                          // Integer
        ctaLabel:          "已完成 → 外部簽署 →",       // String
        ctaAction:         "proceed_to_external_signing", // String
        // DashboardStage isList:true  →  { items: [...] }
        stages: { items: [
            { label: "起草送件", status: "completed", index: 0 },
            { label: "簽核路由", status: "current",   index: 1 },
            { label: "外部查署", status: "pending",   index: 2 },
            { label: "完成詳情", status: "pending",   index: 3 }
        ]}
    },

    // DashboardApprovalChain
    approvalChain: {
        title:       "串簽流程（3 層）",  // String
        routeType:   "串簽",              // String
        totalLayers: 3,                   // Integer
        // DashboardApprover isList:true  →  { items: [...] }
        approvers: { items: [
            { name: "王志明", avatarInitial: "王", role: "直屬主管",   department: "採購部門", status: "approved", layer: 1, canUrge: false },
            { name: "李雅婷", avatarInitial: "李", role: "上一層主管", department: "採購總監", status: "current",  layer: 2, canUrge: true  },
            { name: "張文豪", avatarInitial: "張", role: "最終核准",   department: "副總經理", status: "pending",  layer: 3, canUrge: false }
        ]}
    },

    // DashboardProcessStatus
    processStatus: {
        routeType:           "串簽 Sequential",  // String
        submittedAt:         "2026-07-14 09:32", // String
        estimatedCompletion: "2026-07-16",        // String
        aiScore:             82,                  // Integer
        aiMaxScore:          100,                 // Integer
        aiSuggestionLabel:   "建議修改",           // String
        aiSuggestionAction:  "view_ai_report"     // String
    },

    // DashboardAuditLog
    auditLog: {
        // DashboardAuditEvent isList:true  →  { items: [...] }
        events: { items: [
            { timestamp: "07-14 09:32", actor: "陳大明", action: "送審", detail: "陳大明送審，附 AI 報告",             isHighlighted: false },
            { timestamp: "07-14 11:05", actor: "王志明", action: "核准", detail: "王志明核准 — 「條款無誤，同意送上級」", isHighlighted: true  },
            { timestamp: "07-14 11:05", actor: "系統",   action: "通知", detail: "系統通知李雅婷待審",                 isHighlighted: false }
        ]}
    },

    // DashboardApproverAction
    approverAction: {
        title:          "待我審核",                               // String
        contextMessage: "您目前為本案第 2 層審核人，請確認合約條款並做出決策。", // String
        comment:        "",                                       // String (writable)
        decision:       "",                                       // String (writable)
        // DashboardActionButton isList:true  →  { items: [...] }
        actions: { items: [
            { label: "退回", actionKey: "return",   style: "danger",    enabled: true },
            { label: "轉派", actionKey: "delegate", style: "secondary", enabled: true },
            { label: "核准", actionKey: "approve",  style: "primary",   enabled: true }
        ]}
    },

    // DashboardRouteExplanation
    routeExplanation: {
        explanationText: "本案金額 NT$1,250,000 超過 100 萬，依規則觸發 3 層串簽。所有層級核准後，系統自動移交外部簽署（DocuSign）。", // String
        // DashboardRouteStep isList:true  →  { items: [...] }
        steps: { items: [
            { label: "申請人\n送審",   sublabel: "", status: "completed" },
            { label: "直屬主管\n核准", sublabel: "", status: "completed" },
            { label: "上一階\n核准",   sublabel: "", status: "current"   },
            { label: "最終核准\n執行", sublabel: "", status: "pending"   },
            { label: "外部\n簽署",    sublabel: "", status: "pending"   }
        ]}
    }
};

// ══════════════════════════════════════════════════════════════════════════
//  PHASE 1 — Wire static markup elements to BAW events immediately.
//  Runs synchronously on load, before any binding data arrives.
//  Uses data-* attributes for action keys so re-renders update them cleanly.
// ══════════════════════════════════════════════════════════════════════════

// CTA button — fires ctaClicked(ctaAction)
if (ctaBtn) {
    ctaBtn.addEventListener("click", function () {
        var val = ctaBtn.getAttribute("data-cta-action") || FALLBACK.progress.ctaAction;
        me.context.trigger("ctaClicked", { ctaAction: val });
    });
}

// AI suggestion link — fires ctaClicked({ ctaAction: aiSuggestionAction })
if (aiLinkEl) {
    aiLinkEl.addEventListener("click", function (e) {
        e.preventDefault();
        var val = aiLinkEl.getAttribute("data-ai-action") || FALLBACK.processStatus.aiSuggestionAction;
        me.context.trigger("ctaClicked", { ctaAction: val });
    });
}

// Comment textarea — fires commentChanged({ comment: text }) on every keystroke
if (commentArea) {
    commentArea.addEventListener("input", function () {
        me.context.trigger("commentChanged", { comment: commentArea.value });
    });
}

// Action buttons — event delegation on container; reads data-action-key
if (actionBtnsEl) {
    actionBtnsEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".ard-action-btn");
        if (!btn || btn.disabled) { return; }
        var val = btn.getAttribute("data-action-key") || "";
        me.context.trigger("actionClicked", { actionKey: val });
    });
}

// 催辦 buttons — event delegation on chain list; reads data-approver-index
if (chainListEl) {
    chainListEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".ard-urge-btn");
        if (!btn) { return; }
        var val = toNum(btn.getAttribute("data-approver-index"));
        me.context.trigger("urgeClicked", { approverIndex: val });
    });
}

// Route step boxes — event delegation on flow container; reads data-step-index
if (routeFlowEl) {
    routeFlowEl.addEventListener("click", function (e) {
        var box = e.target.closest(".ard-route-step-box");
        if (!box) { return; }
        var val = toNum(box.getAttribute("data-step-index"));
        me.context.trigger("stepClicked", { stepIndex: val });
    });
}

// ══════════════════════════════════════════════════════════════════════════
//  PHASE 2 — Section renderers
//
//  Each renderer accepts a section sub-object from the binding (or the
//  corresponding FALLBACK section when binding is absent/empty).
//  List fields are always extracted via normList() so BAW's { items:[...] }
//  wrapper, single-item object, or plain array all work identically.
// ══════════════════════════════════════════════════════════════════════════

// ── Progress bar ──────────────────────────────────────────────────────────
// d: DashboardProgress  { currentStageIndex, ctaLabel, ctaAction, stages{items} }
function renderProgress(d) {
    // stages: DashboardStage isList — detect keys: label, status
    var stages     = normList(d.stages, ["label", "status"]);
    var currentIdx = toNum(d.currentStageIndex);
    var ctaLabel   = toStr(d.ctaLabel);
    var ctaAction  = toStr(d.ctaAction);

    // Apply per-field fallbacks so partial binding still renders correctly
    if (stages.length === 0) {
        stages     = normList(FALLBACK.progress.stages, ["label", "status"]);
        currentIdx = FALLBACK.progress.currentStageIndex;
    }
    if (!ctaLabel)  { ctaLabel  = FALLBACK.progress.ctaLabel;  }
    if (!ctaAction) { ctaAction = FALLBACK.progress.ctaAction; }

    // Rebuild stage circles + connectors
    stagesEl.innerHTML = "";
    for (var i = 0; i < stages.length; i++) {
        // Connector between stages
        if (i > 0) {
            var conn = document.createElement("div");
            var prevSt = toStr(stages[i - 1].status) || (i - 1 < currentIdx ? "completed" : "pending");
            conn.className = "ard-connector" + (prevSt === "completed" ? " completed" : "");
            stagesEl.appendChild(conn);
        }

        // Stage node
        var st = toStr(stages[i].status) ||
                 (i < currentIdx ? "completed" : (i === currentIdx ? "current" : "pending"));
        var stDiv = document.createElement("div");
        stDiv.className = "ard-stage";

        var circle = document.createElement("div");
        circle.className = "ard-circle " + st;
        if (st === "completed") {
            circle.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 11L2 7l1.4-1.4L6 8.2l6.6-6.6L14 3z"/></svg>';
        } else {
            circle.textContent = String(i + 1);
            if (st === "current") { circle.setAttribute("aria-current", "step"); }
        }
        stDiv.appendChild(circle);

        var lbl = document.createElement("div");
        lbl.className = "ard-stage-label" + (st === "current" ? " current" : "");
        lbl.textContent = toStr(stages[i].label) || ("步驟 " + (i + 1));
        stDiv.appendChild(lbl);
        stagesEl.appendChild(stDiv);
    }

    // CTA button — always shown (label from binding or fallback)
    if (ctaBtn) {
        ctaBtn.textContent = ctaLabel;
        ctaBtn.setAttribute("data-cta-action", ctaAction);
        ctaBtn.style.display = "";
    }
}

// ── Approval chain ────────────────────────────────────────────────────────
// d: DashboardApprovalChain  { title, routeType, totalLayers, approvers{items} }
function renderChain(d) {
    if (chainTitleEl) {
        chainTitleEl.textContent = toStr(d.title) || FALLBACK.approvalChain.title;
    }

    // approvers: DashboardApprover isList — detect keys: name, status
    var approvers = normList(d.approvers, ["name", "status"]);
    if (approvers.length === 0) {
        approvers = normList(FALLBACK.approvalChain.approvers, ["name", "status"]);
    }

    var statusLabels = { approved: "已核准", current: "審核中", pending: "待簽", rejected: "已退回" };

    chainListEl.innerHTML = "";
    for (var i = 0; i < approvers.length; i++) {
        (function (ap, idx) {
            var st = toStr(ap.status || "pending").toLowerCase();

            var row = document.createElement("div");
            row.className = "ard-approver-row";
            row.setAttribute("data-approver-index", idx);
            row.setAttribute("data-status", st);

            // Avatar circle
            var avatar = document.createElement("div");
            avatar.className = "ard-avatar " + st;
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = toStr(ap.avatarInitial) || toStr(ap.name).charAt(0) || "?";
            row.appendChild(avatar);

            // Name + role/dept
            var info = document.createElement("div");
            info.className = "ard-approver-info";
            var nameEl = document.createElement("div");
            nameEl.className = "ard-approver-name";
            nameEl.textContent = toStr(ap.name);
            var metaEl = document.createElement("div");
            metaEl.className = "ard-approver-meta";
            metaEl.textContent = [toStr(ap.role), toStr(ap.department)].filter(Boolean).join("・");
            info.appendChild(nameEl);
            info.appendChild(metaEl);
            row.appendChild(info);

            // Actions: optional 催辦 button + status badge
            var actDiv = document.createElement("div");
            actDiv.className = "ard-approver-actions";

            if (toBool(ap.canUrge)) {
                var urge = document.createElement("button");
                urge.className = "ard-urge-btn";
                urge.type = "button";
                urge.setAttribute("data-approver-index", idx);
                urge.setAttribute("aria-label", "催辦 " + toStr(ap.name));
                urge.textContent = "催辦";
                // Direct listener supplements container delegation for dynamic rows
                urge.addEventListener("click", (function (i2) {
                    return function () { me.context.trigger("urgeClicked", i2); };
                })(idx));
                actDiv.appendChild(urge);
            }

            var badge = document.createElement("span");
            badge.className = "ard-status-badge " + st;
            badge.textContent = statusLabels[st] || st;
            actDiv.appendChild(badge);
            row.appendChild(actDiv);

            chainListEl.appendChild(row);
        })(approvers[i], i);
    }
}

// ── Process status ────────────────────────────────────────────────────────
// d: DashboardProcessStatus  { routeType, submittedAt, estimatedCompletion,
//                              aiScore, aiMaxScore, aiSuggestionLabel, aiSuggestionAction }
function renderStatus(d) {
    // Update individual static cells — avoids full innerHTML wipe
    if (routeTypeEl) {
        routeTypeEl.textContent = toStr(d.routeType) || FALLBACK.processStatus.routeType;
    }
    if (submittedAtEl) {
        submittedAtEl.textContent = toStr(d.submittedAt) || FALLBACK.processStatus.submittedAt;
    }
    if (estComplEl) {
        estComplEl.textContent = toStr(d.estimatedCompletion) || FALLBACK.processStatus.estimatedCompletion;
    }

    // AI score row
    var score    = toNum(d.aiScore)    || FALLBACK.processStatus.aiScore;
    var maxScore = toNum(d.aiMaxScore) || FALLBACK.processStatus.aiMaxScore;
    var aiLabel  = toStr(d.aiSuggestionLabel)  || FALLBACK.processStatus.aiSuggestionLabel;
    var aiAction = toStr(d.aiSuggestionAction) || FALLBACK.processStatus.aiSuggestionAction;

    if (aiScoreEl) { aiScoreEl.textContent = score + " / " + maxScore; }
    if (aiLinkEl) {
        aiLinkEl.textContent = aiLabel;
        aiLinkEl.setAttribute("data-ai-action", aiAction);
        aiLinkEl.style.display = aiLabel ? "" : "none";
    }
}

// ── Audit timeline ────────────────────────────────────────────────────────
// d: DashboardAuditLog  { events{items} }
function renderAudit(d) {
    // events: DashboardAuditEvent isList — detect keys: timestamp, detail
    var events = normList(d.events, ["timestamp", "detail"]);
    if (events.length === 0) {
        events = normList(FALLBACK.auditLog.events, ["timestamp", "detail"]);
    }

    auditListEl.innerHTML = "";
    for (var i = 0; i < events.length; i++) {
        (function (evt) {
            var highlighted = toBool(evt.isHighlighted);
            var actionLC    = toStr(evt.action).toLowerCase();

            var evtDiv = document.createElement("div");
            evtDiv.className = "ard-audit-event";

            // Colour dot
            var dot = document.createElement("div");
            var dotCls = "ard-audit-dot";
            if (highlighted)                                           { dotCls += " highlighted"; }
            else if (actionLC === "核准" || actionLC === "approved")  { dotCls += " approved"; }
            else if (actionLC === "退回" || actionLC === "rejected")  { dotCls += " rejected"; }
            dot.className = dotCls;
            evtDiv.appendChild(dot);

            // Timestamp + detail text
            var body = document.createElement("div");
            body.className = "ard-audit-body";

            var ts = document.createElement("div");
            ts.className = "ard-audit-ts" + (highlighted ? " highlighted" : "");
            ts.textContent = toStr(evt.timestamp);

            var detail = document.createElement("div");
            detail.className = "ard-audit-detail" + (highlighted ? " highlighted" : "");
            detail.textContent = toStr(evt.detail);

            body.appendChild(ts);
            body.appendChild(detail);
            evtDiv.appendChild(body);
            auditListEl.appendChild(evtDiv);
        })(events[i]);
    }
}

// ── Approver action panel ─────────────────────────────────────────────────
// d: DashboardApproverAction  { title, contextMessage, comment, decision, actions{items} }
function renderActionPanel(d) {
    if (actionTitleEl) {
        actionTitleEl.textContent = toStr(d.title) || FALLBACK.approverAction.title;
    }
    if (contextMsgEl) {
        contextMsgEl.textContent = toStr(d.contextMessage) || FALLBACK.approverAction.contextMessage;
    }
    if (commentArea) {
        commentArea.value = toStr(d.comment);  // writable field — don't apply fallback
    }

    // actions: DashboardActionButton isList — detect keys: label, actionKey
    var actions = normList(d.actions, ["label", "actionKey"]);
    if (actions.length === 0) {
        actions = normList(FALLBACK.approverAction.actions, ["label", "actionKey"]);
    }

    actionBtnsEl.innerHTML = "";
    for (var i = 0; i < actions.length; i++) {
        (function (act) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "ard-action-btn " + toStr(act.style || "secondary").toLowerCase();
            btn.textContent = toStr(act.label);
            btn.disabled = (act.enabled === false || act.enabled === "false");
            btn.setAttribute("data-action-key", toStr(act.actionKey));
            btn.setAttribute("aria-label", toStr(act.label));
            // Direct listener supplements container delegation for dynamic buttons
            btn.addEventListener("click", (function (key) {
                return function () { me.context.trigger("actionClicked", key); };
            })(toStr(act.actionKey)));
            actionBtnsEl.appendChild(btn);
        })(actions[i]);
    }
}

// ── Route explanation ─────────────────────────────────────────────────────
// d: DashboardRouteExplanation  { explanationText, steps{items} }
function renderRouteExplanation(d) {
    if (routeTextEl) {
        routeTextEl.textContent =
            toStr(d.explanationText) || FALLBACK.routeExplanation.explanationText;
    }

    // steps: DashboardRouteStep isList — detect keys: label, status
    var steps = normList(d.steps, ["label", "status"]);
    if (steps.length === 0) {
        steps = normList(FALLBACK.routeExplanation.steps, ["label", "status"]);
    }

    var statusText = { completed: "已完成", current: "進行中", pending: "待辦" };

    routeFlowEl.innerHTML = "";
    for (var i = 0; i < steps.length; i++) {
        (function (step, idx) {
            // Arrow between steps
            if (idx > 0) {
                var arrowWrap = document.createElement("div");
                arrowWrap.className = "ard-route-step";
                arrowWrap.setAttribute("role", "presentation");
                var arrow = document.createElement("div");
                var prevSt = toStr(steps[idx - 1].status || "pending").toLowerCase();
                arrow.className = "ard-route-arrow" + (prevSt === "completed" ? " completed" : "");
                arrow.setAttribute("aria-hidden", "true");
                arrow.textContent = "→";
                arrowWrap.appendChild(arrow);
                routeFlowEl.appendChild(arrowWrap);
            }

            var st  = toStr(step.status || "pending").toLowerCase();
            var lbl = toStr(step.label) || ("步驟 " + (idx + 1));

            var stepWrap = document.createElement("div");
            stepWrap.className = "ard-route-step";
            stepWrap.setAttribute("role", "listitem");

            // <button> so it is keyboard-focusable and fires stepClicked
            var box = document.createElement("button");
            box.type = "button";
            box.className = "ard-route-step-box " + st;
            box.textContent = lbl;
            box.setAttribute("data-step-index", idx);
            box.setAttribute("aria-label",
                "步驟 " + (idx + 1) + "：" + lbl.replace(/\n/g, "") +
                "（" + (statusText[st] || st) + "）");
            if (st === "current") { box.setAttribute("aria-current", "step"); }

            // Direct listener supplements container delegation for dynamic boxes
            box.addEventListener("click", (function (i2) {
                return function () { me.context.trigger("stepClicked", i2); };
            })(idx));

            stepWrap.appendChild(box);
            routeFlowEl.appendChild(stepWrap);
        })(steps[i], i);
    }
}

// ══════════════════════════════════════════════════════════════════════════
//  Main render
//  Each section receives the bound sub-object when present, or the
//  corresponding FALLBACK section when the key is absent or null.
// ══════════════════════════════════════════════════════════════════════════
function render(data) {
    try {
        var d = data || {};

        if (contractEl) {
            contractEl.textContent =
                toStr(d.contractTitle) || FALLBACK.contractTitle;
        }

        renderProgress(d.progress         || FALLBACK.progress);
        renderChain(d.approvalChain        || FALLBACK.approvalChain);
        renderStatus(d.processStatus       || FALLBACK.processStatus);
        renderAudit(d.auditLog             || FALLBACK.auditLog);
        renderActionPanel(d.approverAction || FALLBACK.approverAction);
        renderRouteExplanation(d.routeExplanation || FALLBACK.routeExplanation);

    } catch (e) {
        root.innerHTML =
            "<p style='padding:16px;color:#da1e28;font-family:monospace;font-size:12px;'>" +
            "ApprovalReviewDashboard error: " + e.message + "</p>";
    }
}

// ══════════════════════════════════════════════════════════════════════════
//  BAW binding wiring
//  Three attempts in priority order:
//    1. context.binding.connect  — reactive; re-renders on every update
//    2. this.getData()           — snapshot at load time
//    3. context.binding.get()    — deferred snapshot (300 ms timeout)
//  If none provide data, Phase 1 events remain wired and the static
//  fallback markup (already in Layout.html) is left intact.
// ══════════════════════════════════════════════════════════════════════════
var bound = false;

if (this.context && this.context.binding &&
        typeof this.context.binding.connect === "function") {
    this.context.binding.connect(function (val) {
        bound = true;
        render(val);
    });
}

if (!bound) {
    var d0 = this.getData ? this.getData() : null;
    if (d0) { render(d0); bound = true; }
}

if (!bound) {
    setTimeout(function () {
        try {
            var bv = me.context.binding.get("value");
            if (bv) { render(bv); bound = true; }
        } catch (e) { /* no binding available */ }
        // If still unbound: static Layout.html markup is already visible and
        // all Phase 1 event listeners are active — nothing more to do.
    }, 300);
}
