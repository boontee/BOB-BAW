/**
 * ApprovalReviewDashboard — CSHS Event Handler Scripts
 *
 * WHERE TO USE:
 *   Each section below is a separate Script node in your CSHS flow.
 *   Wire them to Boundary Events on the Coach node, one per event.
 *
 * CSHS FLOW LAYOUT:
 *
 *   [Start]
 *      │
 *      ▼
 *   [Script: Load Dashboard Data]   ← SAMPLE_DATA_CSHS.js
 *      │
 *      ▼
 *   [Coach: 簽核審查] ──────────────────────────────────────────────────────┐
 *      │  boundary: On actionClicked  → [Script: Handle Action]  → gateway │
 *      │  boundary: On ctaClicked     → [Script: Handle CTA]     → ...     │
 *      │  boundary: On urgeClicked    → [Script: Handle Urge]    → ...     │
 *      │  event:    On commentChanged → [Script: Save Comment]   → (loop)  │
 *      │  event:    On stepClicked    → [Script: Handle Step]    → (loop)  │
 *      └────────────────────────────────────────────────────────────────────┘
 *
 * PREREQUISITE CSHS VARIABLES (Variables tab):
 *   dashboardData   ApprovalReviewDashboard   Private ✓
 *   actionKey       String                    Private ✓  (output of actionClicked)
 *   ctaAction       String                    Private ✓  (output of ctaClicked)
 *   approverIndex   Integer                   Private ✓  (output of urgeClicked)
 *   comment         String                    Private ✓  (output of commentChanged)
 *   stepIndex       Integer                   Private ✓  (output of stepClicked)
 */


// ═════════════════════════════════════════════════════════════════════════════
//  EVENT 1 — actionClicked
//  Triggered by: 退回 / 轉派 / 核准 buttons in the right action panel
//  Parameter:    tw.local.actionKey  (String)
//                  "return"    → user clicked 退回
//                  "delegate"  → user clicked 轉派
//                  "approve"   → user clicked 核准
//
//  Wiring in Coach Properties → Events:
//    Event Name : actionClicked
//    Output Var : tw.local.actionKey   (map parameterName → CSHS variable)
//
//  Add a Boundary Event to the Coach → fires when actionClicked is triggered.
//  Route the boundary event into an Exclusive Gateway on actionKey value.
// ═════════════════════════════════════════════════════════════════════════════

// ── Script: Handle Action ────────────────────────────────────────────────────
// Paste into the Script node wired to the actionClicked boundary event.

// Persist the decision onto the dashboard BO so the widget reflects it
tw.local.dashboardData.approverAction.decision = tw.local.actionKey;

// Append a new audit entry for the decision
tw.local.dashboardData.auditLog.events.listAdd();
var lastIdx = tw.local.dashboardData.auditLog.events.listLength - 1;

tw.local.dashboardData.auditLog.events[lastIdx].timestamp     = new Date().toISOString().slice(5, 16).replace("T", " ");
tw.local.dashboardData.auditLog.events[lastIdx].actor         = tw.system.user.fullName || tw.system.user.loginName;
tw.local.dashboardData.auditLog.events[lastIdx].isHighlighted = true;

if (tw.local.actionKey === "approve") {
    tw.local.dashboardData.auditLog.events[lastIdx].action = "核准";
    tw.local.dashboardData.auditLog.events[lastIdx].detail =
        tw.system.user.fullName + " 核准 — 「" +
        (tw.local.dashboardData.approverAction.comment || "同意") + "」";

} else if (tw.local.actionKey === "return") {
    tw.local.dashboardData.auditLog.events[lastIdx].action = "退回";
    tw.local.dashboardData.auditLog.events[lastIdx].detail =
        tw.system.user.fullName + " 退回 — 「" +
        (tw.local.dashboardData.approverAction.comment || "請修正後重新送審") + "」";

} else if (tw.local.actionKey === "delegate") {
    tw.local.dashboardData.auditLog.events[lastIdx].action = "轉派";
    tw.local.dashboardData.auditLog.events[lastIdx].detail =
        tw.system.user.fullName + " 轉派此案給其他審核人";
}

// ── Exclusive Gateway conditions (add after the Script node) ─────────────────
//   tw.local.actionKey == "approve"   → Approved path  (advance process)
//   tw.local.actionKey == "return"    → Rejected path  (notify submitter)
//   tw.local.actionKey == "delegate"  → Delegate path  (reassign task)


// ═════════════════════════════════════════════════════════════════════════════
//  EVENT 2 — ctaClicked
//  Triggered by: top-right CTA button ("已完成 → 外部簽署 →") or AI suggestion link
//  Parameter:    tw.local.ctaAction  (String)
//                  "proceed_to_external_signing" → advance to DocuSign step
//                  "view_ai_report"              → open AI report panel
//
//  Wiring in Coach Properties → Events:
//    Event Name : ctaClicked
//    Output Var : tw.local.ctaAction
//
//  Add a Boundary Event → route into Exclusive Gateway on ctaAction value.
// ═════════════════════════════════════════════════════════════════════════════

// ── Script: Handle CTA ───────────────────────────────────────────────────────
// Paste into the Script node wired to the ctaClicked boundary event.

if (tw.local.ctaAction === "proceed_to_external_signing") {
    // Advance progress bar to stage 2 (外部查署)
    tw.local.dashboardData.progress.currentStageIndex = 2;
    tw.local.dashboardData.progress.stages[1].status  = "completed";
    tw.local.dashboardData.progress.stages[2].status  = "current";

    // Update CTA label
    tw.local.dashboardData.progress.ctaLabel  = "查看 DocuSign 狀態";
    tw.local.dashboardData.progress.ctaAction = "view_docusign";

} else if (tw.local.ctaAction === "view_ai_report") {
    // Open AI report — set a flag variable read by next coach or service
    // tw.local.showAIReport = true;   (declare showAIReport Boolean in Variables tab)
    log.info("AI report requested by: " + tw.system.user.loginName);
}

// ── Exclusive Gateway conditions ──────────────────────────────────────────────
//   tw.local.ctaAction == "proceed_to_external_signing" → External Signing path
//   tw.local.ctaAction == "view_ai_report"              → AI Report path (stay)
//   default                                             → stay / log only


// ═════════════════════════════════════════════════════════════════════════════
//  EVENT 3 — urgeClicked
//  Triggered by: 催辦 button on an approver row (only shown when canUrge=true)
//  Parameter:    tw.local.approverIndex  (Integer, 0-based)
//                  0 → urge Layer-1 approver (王志明)
//                  1 → urge Layer-2 approver (李雅婷)
//                  2 → urge Layer-3 approver (張文豪)
//
//  Wiring in Coach Properties → Events:
//    Event Name : urgeClicked
//    Output Var : tw.local.approverIndex
//
//  Add a Boundary Event → call a notification service (e.g. send email/Teams).
// ═════════════════════════════════════════════════════════════════════════════

// ── Script: Handle Urge ──────────────────────────────────────────────────────
// Paste into the Script node wired to the urgeClicked boundary event.

var urgedApprover = tw.local.dashboardData.approvalChain.approvers[tw.local.approverIndex];

// Log the urge action to the audit trail
tw.local.dashboardData.auditLog.events.listAdd();
var urgeIdx = tw.local.dashboardData.auditLog.events.listLength - 1;
tw.local.dashboardData.auditLog.events[urgeIdx].timestamp     = new Date().toISOString().slice(5, 16).replace("T", " ");
tw.local.dashboardData.auditLog.events[urgeIdx].actor         = "系統";
tw.local.dashboardData.auditLog.events[urgeIdx].action        = "催辦";
tw.local.dashboardData.auditLog.events[urgeIdx].detail        = "已催辦 " + urgedApprover.name + "（第 " + urgedApprover.layer + " 層）";
tw.local.dashboardData.auditLog.events[urgeIdx].isHighlighted = false;

// Store the urge target name for downstream notification service
// tw.local.urgeTargetName  = urgedApprover.name;       (declare String in Variables tab)
// tw.local.urgeTargetEmail = urgedApprover.email || ""; (declare String in Variables tab)

log.info("催辦 sent to: " + urgedApprover.name + " (layer " + urgedApprover.layer + ")");

// ── After this Script node → call a Notification Service ─────────────────────
//   Input:  tw.local.urgeTargetName, tw.local.urgeTargetEmail
//   Action: send email / IBM Workflow Notification / Teams webhook
//   Then:   loop back to Coach (Stay on same task, do not advance)


// ═════════════════════════════════════════════════════════════════════════════
//  EVENT 4 — commentChanged
//  Triggered by: textarea input in the approver action panel (on every keystroke)
//  Parameter:    tw.local.comment  (String)  — current textarea value
//
//  Wiring in Coach Properties → Events:
//    Event Name : commentChanged
//    Output Var : tw.local.comment
//
//  Use as a Coach View Event (NOT a boundary event) — stays on same coach.
//  The handler simply syncs the comment back to the BO so it persists.
// ═════════════════════════════════════════════════════════════════════════════

// ── Script: Save Comment ─────────────────────────────────────────────────────
// Paste into a Script node wired to commentChanged Coach View Event.
// This keeps tw.local.dashboardData.approverAction.comment in sync
// so when actionClicked fires later, the comment is already saved.

tw.local.dashboardData.approverAction.comment = tw.local.comment;

// No navigation — stays on same coach after saving.


// ═════════════════════════════════════════════════════════════════════════════
//  EVENT 5 — stepClicked
//  Triggered by: clicking a step box in the route flow diagram (bottom-right)
//  Parameter:    tw.local.stepIndex  (Integer, 0-based)
//                  0 → 申請人送審
//                  1 → 直屬主管核准
//                  2 → 上一階核准
//                  3 → 最終核准執行
//                  4 → 外部簽署
//
//  Wiring in Coach Properties → Events:
//    Event Name : stepClicked
//    Output Var : tw.local.stepIndex
//
//  Use as a Coach View Event — stays on same coach, shows step detail.
// ═════════════════════════════════════════════════════════════════════════════

// ── Script: Handle Step ──────────────────────────────────────────────────────
// Paste into a Script node wired to stepClicked Coach View Event.

var stepLabels = ["申請人送審", "直屬主管核准", "上一階核准", "最終核准執行", "外部簽署"];
var clickedStep = tw.local.dashboardData.routeExplanation.steps[tw.local.stepIndex];

log.info("Route step clicked: [" + tw.local.stepIndex + "] " +
         (stepLabels[tw.local.stepIndex] || "unknown") +
         " — status: " + clickedStep.status);

// Optional: set a variable to show a detail panel in the coach
// tw.local.selectedStepIndex = tw.local.stepIndex;    (declare Integer in Variables tab)
// tw.local.selectedStepLabel = stepLabels[tw.local.stepIndex]; (declare String)
// tw.local.selectedStepStatus = clickedStep.status;

// No navigation — stays on same coach.
