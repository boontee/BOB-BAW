# ApprovalReviewDashboard — Integration Guide

## Summary

**`ApprovalReviewDashboard`** renders the complete eContract 簽核 screen — progress bar, approval chain, process status, audit log, action panel, and route flow — as one BAW coach widget driven by a single `ApprovalReviewDashboard` business object binding.

---

## 1 — Add Widget to a Coach

In BAW Process Designer:
1. Open your **Client-Side Human Service (CSHS)** or **Heritage Human Task**
2. Add a **Coach** step
3. From the palette under **Custom Widgets (CW)**, drag **`ApprovalReviewDashboard`** onto the canvas

---

## 2 — Declare a Process Variable

In the CSHS or process, create a variable of type **`ApprovalReviewDashboard`** (the BO ships inside the toolkit):

```
Name:  dashboardData
Type:  ApprovalReviewDashboard   ← custom BO from CW toolkit
```

---

## 3 — Bind the Variable to the Widget

In the coach canvas, select the widget → **Properties → General**:

```
Binding:  tw.local.dashboardData
```

BAW will populate the widget's 7 top-level sections automatically from the BO fields.

---

## 4 — Populate the Variable from a Service (Before Coach)

In the CSHS **Pre-Execution service** or a **Service Flow** before the coach, set the variable.
Example in a server-side JS script:

```javascript
// Populate approval chain from process context
tw.local.dashboardData                    = new tw.object.ApprovalReviewDashboard();
tw.local.dashboardData.contractTitle      = tw.local.contract.title;

// Progress bar
tw.local.dashboardData.progress           = new tw.object.DashboardProgress();
tw.local.dashboardData.progress.currentStageIndex = 1;
tw.local.dashboardData.progress.ctaLabel  = "已完成 → 外部簽署 →";
tw.local.dashboardData.progress.ctaAction = "proceed_to_external_signing";

// Approvers list
tw.local.dashboardData.approvalChain      = new tw.object.DashboardApprovalChain();
tw.local.dashboardData.approvalChain.title = "串簽流程（3 層）";
tw.local.dashboardData.approvalChain.approvers = new tw.object.listOf.DashboardApprover();
// ... add approver objects from your process data
```

---

## 5 — Handle Events in the Coach

In the coach, select the widget → **Properties → Events** — wire each event to a **Boundary Event** or **Coach View Event**:

| Widget Event | BAW Wiring | What to do |
|---|---|---|
| `actionClicked` → `actionKey` | Boundary event on coach | Read `tw.local.actionKey`, route process to Approve/Reject/Delegate gateway |
| `ctaClicked` → `ctaAction` | Boundary event | Navigate to External Signing step |
| `commentChanged` → `comment` | Coach event | Write `tw.local.dashboardData.approverAction.comment = tw.local.comment` |
| `urgeClicked` → `approverIndex` | Boundary event | Trigger a notification service for that approver layer |
| `stepClicked` → `stepIndex` | Coach event | Show detail panel for selected route step |

### Example Boundary Event Wiring (CSHS)

```
Coach "簽核審查"
  ├── Widget: ApprovalReviewDashboard  (binding: tw.local.dashboardData)
  │     event: actionClicked  → output: tw.local.actionKey
  │
  ├── Boundary Event: On actionClicked
  │     → exclusive gateway: tw.local.actionKey == "approve"   → Approve lane
  │     → exclusive gateway: tw.local.actionKey == "return"    → Reject lane
  │     → exclusive gateway: tw.local.actionKey == "delegate"  → Delegate lane
```

---

## 6 — Write Decision Back to Process

After the coach boundary event fires, use a **Script task** to persist the decision:

```javascript
// Save approver decision to process
tw.local.contract.approvalDecision = tw.local.actionKey;
tw.local.contract.approverComment  = tw.local.dashboardData.approverAction.comment;
tw.local.contract.approvedAt       = new tw.object.Date();
```

---

## Key Integration Points

```
Process Variable                Widget Section
────────────────────────────────────────────────────────────────
dashboardData.progress        → Progress bar + CTA button
dashboardData.approvalChain   → Approver rows + 催辦 buttons
dashboardData.processStatus   → Route type, dates, AI score
dashboardData.auditLog        → Audit timeline entries
dashboardData.approverAction  → 退回/轉派/核准 buttons + textarea
dashboardData.routeExplanation→ Route flow diagram
```

---

## Events Reference

| Event | Parameter | Type | Fired when |
|---|---|---|---|
| `ctaClicked` | `ctaAction` | String | Top CTA button or AI suggestion link clicked |
| `actionClicked` | `actionKey` | String | Approver action button (核准/退回/轉派) clicked |
| `urgeClicked` | `approverIndex` | Integer | 催辦 button clicked on an approver row |
| `commentChanged` | `comment` | String | Approver comment textarea input changes |
| `stepClicked` | `stepIndex` | Integer | Route flow step box clicked (0-based) |

---

## Business Object Structure

```
ApprovalReviewDashboard
├── contractTitle          String
├── progress               DashboardProgress
│   ├── currentStageIndex  Integer
│   ├── ctaLabel           String
│   ├── ctaAction          String
│   └── stages[]           DashboardStage
│       ├── label          String
│       ├── status         completed | current | pending
│       └── index          Integer
├── approvalChain          DashboardApprovalChain
│   ├── title              String
│   ├── routeType          String
│   ├── totalLayers        Integer
│   └── approvers[]        DashboardApprover
│       ├── name           String
│       ├── avatarInitial  String
│       ├── role           String
│       ├── department     String
│       ├── status         approved | current | pending | rejected
│       ├── layer          Integer
│       └── canUrge        Boolean
├── processStatus          DashboardProcessStatus
│   ├── routeType          String
│   ├── submittedAt        String
│   ├── estimatedCompletion String
│   ├── aiScore            Integer
│   ├── aiMaxScore         Integer
│   ├── aiSuggestionLabel  String
│   └── aiSuggestionAction String
├── auditLog               DashboardAuditLog
│   └── events[]           DashboardAuditEvent
│       ├── timestamp      String
│       ├── actor          String
│       ├── action         String
│       ├── detail         String
│       └── isHighlighted  Boolean
├── approverAction         DashboardApproverAction
│   ├── title              String
│   ├── contextMessage     String
│   ├── comment            String  ← writable via commentChanged event
│   ├── decision           String
│   └── actions[]          DashboardActionButton
│       ├── label          String
│       ├── actionKey      String
│       ├── style          primary | danger | secondary
│       └── enabled        Boolean
└── routeExplanation       DashboardRouteExplanation
    ├── explanationText    String
    └── steps[]            DashboardRouteStep
        ├── label          String  (use \n for two lines)
        ├── sublabel       String
        └── status         completed | current | pending
```

---

## Fallback Behaviour

Every sub-section independently falls back to mock data:
- If `dashboardData` is `null` → all sections render mock eContract 簽核 data
- If a specific sub-object is absent → only that panel uses mock data
- Individual list properties (stages, approvers, events, steps) fall back if empty

This ensures the widget is always visually complete in the BAW palette preview and during design-time, making incremental integration safe.

---

## Testing

Use **[`UMC/CoachTester.html`](../../UMC/CoachTester.html)** to simulate all 6 scenarios and verify event payloads before connecting to a real BAW process:

| Scenario | Tests |
|---|---|
| 🔵 Layer 2 | Current user is active approver — all 3 action buttons enabled |
| 🟡 Layer 1 | Waiting on upstream approver — buttons disabled |
| ✅ All Approved | Full approval complete — at DocuSign stage |
| ❌ Rejected | Contract rejected — edit/contact buttons shown |
| 📨 External | Parallel signing, DocuSign in progress |
| 🔒 Disabled | Read-only observer mode |
