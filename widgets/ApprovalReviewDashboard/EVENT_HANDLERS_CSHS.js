/**
 * ApprovalReviewDashboard — CSHS Event Handler Scripts
 *
 * WHERE TO PASTE:
 *   Open the Coach node (double-click to open the Coach editor)
 *   → click the widget (ApprovalReviewDashboard) on the canvas
 *   → Right Properties panel → [Events] tab
 *   → You see one script box per event — paste each section below
 *     into the matching box.
 *
 * RULES (shown in the BAW panel header):
 *   ✅ JavaScript ES6
 *   ✅ Runs in the client browser
 *   ❌ No template literals (no backtick ` strings)
 *   ❌ No tw.object.* constructors
 *   ❌ No new tw.object.listOf.*
 *
 * PREREQUISITE — CSHS Variables tab must have:
 *   dashboardData   ApprovalReviewDashboard   Private ✓
 *   actionKey       String                    Private ✓
 *   ctaAction       String                    Private ✓
 *   approverIndex   Integer                   Private ✓
 *   comment         String                    Private ✓
 *   stepIndex       Integer                   Private ✓
 *
 * HOW TO FIND THE EVENTS PANEL:
 *   1. Double-click Coach node to open it
 *   2. Click the ApprovalReviewDashboard widget on the canvas
 *   3. Right Properties panel → [Events] tab
 *   4. You see: CTA Clicked / Action Button Clicked / Urge Button Clicked
 *               Comment Changed / Route Step Clicked
 *   5. Paste the matching script into each box
 */


// ─────────────────────────────────────────────────────────────────────────────
//  CTA Clicked  (box label: "CTA Clicked:")
//  Fired when:  top-right "已完成 → 外部簽署 →" button or AI suggestion link
//  Parameter:   tw.local.ctaAction  e.g. "proceed_to_external_signing"
// ─────────────────────────────────────────────────────────────────────────────
if (tw.local.ctaAction === "proceed_to_external_signing") {
    tw.local.dashboardData.progress.currentStageIndex = 2;
    tw.local.dashboardData.progress.stages[1].status = "completed";
    tw.local.dashboardData.progress.stages[2].status = "current";
    tw.local.dashboardData.progress.ctaLabel = "查看 DocuSign 狀態";
    tw.local.dashboardData.progress.ctaAction = "view_docusign";
}


// ─────────────────────────────────────────────────────────────────────────────
//  Action Button Clicked  (box label: "Action Button Clicked:")
//  Fired when:  退回 / 轉派 / 核准 buttons clicked
//  Parameter:   tw.local.actionKey  "return" | "delegate" | "approve"
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.approverAction.decision = tw.local.actionKey;

tw.local.dashboardData.auditLog.events.listAdd();
var idx = tw.local.dashboardData.auditLog.events.listLength - 1;
tw.local.dashboardData.auditLog.events[idx].isHighlighted = true;
tw.local.dashboardData.auditLog.events[idx].actor = tw.system.user.fullName;

if (tw.local.actionKey === "approve") {
    tw.local.dashboardData.auditLog.events[idx].action = "核准";
    tw.local.dashboardData.auditLog.events[idx].detail =
        tw.system.user.fullName + " 核准 — 「" +
        (tw.local.dashboardData.approverAction.comment || "同意") + "」";

} else if (tw.local.actionKey === "return") {
    tw.local.dashboardData.auditLog.events[idx].action = "退回";
    tw.local.dashboardData.auditLog.events[idx].detail =
        tw.system.user.fullName + " 退回 — 「" +
        (tw.local.dashboardData.approverAction.comment || "請修正後重新送審") + "」";

} else if (tw.local.actionKey === "delegate") {
    tw.local.dashboardData.auditLog.events[idx].action = "轉派";
    tw.local.dashboardData.auditLog.events[idx].detail =
        tw.system.user.fullName + " 轉派此案給其他審核人";
}


// ─────────────────────────────────────────────────────────────────────────────
//  Urge Button Clicked  (box label: "Urge Button Clicked:")
//  Fired when:  催辦 button on an approver row clicked
//  Parameter:   tw.local.approverIndex  Integer 0-based
//                 0 = 王志明 (Layer 1)
//                 1 = 李雅婷 (Layer 2)
//                 2 = 張文豪 (Layer 3)
// ─────────────────────────────────────────────────────────────────────────────
var urgedApprover = tw.local.dashboardData.approvalChain.approvers[tw.local.approverIndex];

tw.local.dashboardData.auditLog.events.listAdd();
var urgeIdx = tw.local.dashboardData.auditLog.events.listLength - 1;
tw.local.dashboardData.auditLog.events[urgeIdx].actor = "系統";
tw.local.dashboardData.auditLog.events[urgeIdx].action = "催辦";
tw.local.dashboardData.auditLog.events[urgeIdx].detail =
    "已催辦 " + urgedApprover.name + "（第 " + urgedApprover.layer + " 層）";
tw.local.dashboardData.auditLog.events[urgeIdx].isHighlighted = false;


// ─────────────────────────────────────────────────────────────────────────────
//  Comment Changed  (box label: "Comment Changed:")
//  Fired when:  approver types in the 審核意見 textarea
//  Parameter:   tw.local.comment  String — current textarea value
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.approverAction.comment = tw.local.comment;


// ─────────────────────────────────────────────────────────────────────────────
//  Route Step Clicked  (box label: "Route Step Clicked:")
//  Fired when:  a step box in the route flow diagram is clicked
//  Parameter:   tw.local.stepIndex  Integer 0-based
//                 0 = 申請人送審
//                 1 = 直屬主管核准
//                 2 = 上一階核准
//                 3 = 最終核准執行
//                 4 = 外部簽署
// ─────────────────────────────────────────────────────────────────────────────
var labels = ["申請人送審", "直屬主管核准", "上一階核准", "最終核准執行", "外部簽署"];
log.info("Step clicked: " + labels[tw.local.stepIndex] + " (" + tw.local.stepIndex + ")");
