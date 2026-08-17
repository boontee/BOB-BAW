/**
 * ApprovalReviewDashboard — CSHS Coach View Event Handler Scripts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE TO PASTE:
 *   Inside the Coach editor:
 *   1. Double-click the Coach node to open it
 *   2. Click the ApprovalReviewDashboard widget on the canvas
 *   3. Right Properties panel → [Events] tab
 *   4. Paste each section into its matching script box
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE — how BAW Coach View events work:
 *
 *   WIDGET (browser)                   CSHS FLOW (server)
 *   ─────────────────                  ──────────────────
 *   inlineJavascript.js                Script nodes / Service flows
 *   calls context.trigger("event",     ← boundary event fires here
 *     { parameterName: value })            tw.local.actionKey is set
 *                                          server-side logic runs
 *   ↑ Event handler script box
 *     runs HERE in the browser
 *     Use: this.context API
 *     Do NOT use: tw.local (server only)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * KEY RULES (shown in the BAW panel header):
 *   ✅ JavaScript ES6 — runs in the CLIENT BROWSER
 *   ✅ Use this.context.trigger() to fire the boundary event
 *   ✅ Use this.context.binding.get("value") to read bound data
 *   ✅ Use console.log() for browser logging
 *   ❌ tw.local — server-side only, NOT available here
 *   ❌ log.info() — server-side only, use console.log() instead
 *   ❌ Hardcode data changes here — data updates via binding, not scripts
 *   ❌ Template literals (no backtick ` strings)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DATA BINDING SETUP (do this in Properties → General, NOT in scripts):
 *   Widget selected → Properties → General → Binding:
 *     tw.local.dashboardData     (type: ApprovalReviewDashboard)
 *
 *   The widget's inlineJavascript.js already calls context.trigger() with
 *   the correct parameter values. The event handler script boxes below
 *   are optional — only needed if you want extra client-side logic
 *   BEFORE the boundary event fires on the server.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT EACH EVENT HANDLER BOX SHOULD DO:
 *   - Fire this.context.trigger() to activate the CSHS boundary event
 *   - Read bound data with this.context.binding.get("value") if needed
 *   - console.log() for debugging
 *   - NO tw.local, NO data writes — those happen server-side after trigger
 */


// =============================================================================
//  CTA Clicked  —  paste into "CTA Clicked:" box
// =============================================================================
//
//  The widget already called context.trigger("ctaClicked", { ctaAction: "..." })
//  This script box runs AFTER that trigger, in the browser.
//
//  The ctaAction value is carried as the event parameter — it is automatically
//  mapped to tw.local.ctaAction on the server side (via the binding config).
//
//  Here we can read the bound data to do client-side UI work before navigating.

var dashData = this.context.binding.get("value");
var ctaAction = dashData && dashData.progress ? dashData.progress.ctaAction : "";

console.log("[ApprovalReviewDashboard] CTA clicked — ctaAction: " + ctaAction);

// The boundary event fires automatically. No additional code needed here
// unless you want to show a client-side confirmation dialog before proceeding.
// Example: add a confirm dialog before external signing:
//
// if (ctaAction === "proceed_to_external_signing") {
//     if (!confirm("確認移交外部簽署（DocuSign）？")) {
//         return; // cancel — do not fire boundary event
//     }
// }
//
// this.context.trigger();  // ← call only if you intercepted and want to proceed


// =============================================================================
//  Action Button Clicked  —  paste into "Action Button Clicked:" box
// =============================================================================
//
//  The widget calls context.trigger("actionClicked", { actionKey: "approve" })
//  actionKey is automatically mapped to tw.local.actionKey on the server.
//  The server-side gateway then routes: approve → Approved, return → Rejected.
//
//  This script box runs in the browser. Use it for client-side confirmation
//  before the boundary event fires.

var actionData = this.context.binding.get("value");
var actionKey = actionData && actionData.approverAction ? actionData.approverAction.decision : "";

console.log("[ApprovalReviewDashboard] Action clicked — actionKey: " + actionKey);

// Optional: require a comment before approving
// var comment = actionData && actionData.approverAction ? actionData.approverAction.comment : "";
// if (actionKey === "return" && !comment) {
//     alert("請填寫退回原因（審核意見）");
//     return; // prevent the boundary event from firing
// }


// =============================================================================
//  Urge Button Clicked  —  paste into "Urge Button Clicked:" box
// =============================================================================
//
//  The widget calls context.trigger("urgeClicked", { approverIndex: 1 })
//  approverIndex is automatically mapped to tw.local.approverIndex on server.
//
//  Read the approver name from the binding for a client-side confirmation.

var urgeData = this.context.binding.get("value");
var approverIndex = 0; // default — actual value comes from widget trigger parameter

// Get the approver list from the binding to show their name in confirmation
var approvers = urgeData && urgeData.approvalChain && urgeData.approvalChain.approvers
    ? urgeData.approvalChain.approvers
    : [];

// approverIndex is available as the event parameter value passed by the widget
// Access it via the event parameter mapping in Properties → Events tab
console.log("[ApprovalReviewDashboard] 催辦 clicked — approvers list length: " + approvers.listLength);

// Optional: confirm before sending urge notification
// var approver = approvers[approverIndex];
// if (approver && !confirm("確認催辦 " + approver.name + "？")) {
//     return;
// }


// =============================================================================
//  Comment Changed  —  paste into "Comment Changed:" box
// =============================================================================
//
//  Leave this box EMPTY or use only console.log for debugging.
//
//  The correct way to capture the comment is through DATA BINDING:
//    Widget → Properties → General → Binding → tw.local.dashboardData
//    The widget's changeFunction (config.json: "changeFunction": true) ensures
//    the entire bound BO including the comment is synced back automatically
//    when the user types — no script needed here.
//
//  If you need to capture just the comment string separately, declare a
//  tw.local.comment variable and map it in Properties → Events:
//    Event: commentChanged → Output parameter: comment → tw.local.comment
//  Then tw.local.comment is available server-side after the boundary event.

console.log("[ApprovalReviewDashboard] Comment changed");


// =============================================================================
//  Route Step Clicked  —  paste into "Route Step Clicked:" box
// =============================================================================
//
//  The widget calls context.trigger("stepClicked", { stepIndex: 2 })
//  stepIndex is automatically mapped to tw.local.stepIndex on the server.
//
//  This is informational — use console.log for client-side debugging.
//  Server-side: read tw.local.stepIndex in a Script node after the boundary event.

var stepData = this.context.binding.get("value");
var stepLabels = ["申請人送審", "直屬主管核准", "上一階核准", "最終核准執行", "外部簽署"];

// stepIndex value comes from the widget trigger parameter mapping
// Log the route explanation text for debugging
var routeText = stepData && stepData.routeExplanation ? stepData.routeExplanation.explanationText : "";
console.log("[ApprovalReviewDashboard] Route step clicked — route: " + routeText);
