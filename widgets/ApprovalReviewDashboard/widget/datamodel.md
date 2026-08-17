# ApprovalReviewDashboard — Data Model

## Overview

Unified BAW custom widget that renders the complete eContract 簽核 (approval review) screen in a single coach view. All sections are driven by one **`ApprovalReviewDashboard`** business object bound to the widget's `dashboardData` property.

When the binding is `null` or absent, all sections fall back to hard-coded Traditional Chinese mock data matching the design screenshot exactly.

---

## Binding: `ApprovalReviewDashboard`

| Property | Type | Required | Description |
|---|---|---|---|
| `contractTitle` | `String` | No | Contract title below progress bar |
| `progress` | `DashboardProgress` | No | Progress bar stages + CTA |
| `approvalChain` | `DashboardApprovalChain` | No | Serial approval chain panel |
| `processStatus` | `DashboardProcessStatus` | No | Route metadata + AI score |
| `auditLog` | `DashboardAuditLog` | No | Chronological audit events |
| `approverAction` | `DashboardApproverAction` | No | Action buttons + comment |
| `routeExplanation` | `DashboardRouteExplanation` | No | Route description + flow diagram |

---

## DashboardProgress

| Property | Type | Description |
|---|---|---|
| `currentStageIndex` | `Integer` | 0-based index of the active stage |
| `ctaLabel` | `String` | Top-right CTA button label, e.g. `已完成 → 外部簽署 →` |
| `ctaAction` | `String` | Action key passed to `ctaClicked` event |
| `stages` | `DashboardStage[]` | Ordered pipeline stages |

### DashboardStage

| Property | Type | Values |
|---|---|---|
| `label` | `String` | Display label, e.g. `起草送件` |
| `status` | `String` | `completed` \| `current` \| `pending` |
| `index` | `Integer` | 0-based position |

---

## DashboardApprovalChain

| Property | Type | Description |
|---|---|---|
| `title` | `String` | Panel header, e.g. `串簽流程（3 層）` |
| `routeType` | `String` | Route type label |
| `totalLayers` | `Integer` | Total approval layers |
| `approvers` | `DashboardApprover[]` | List of approvers |

### DashboardApprover

| Property | Type | Description |
|---|---|---|
| `name` | `String` | Display name |
| `avatarInitial` | `String` | Character shown in avatar circle |
| `role` | `String` | Job role |
| `department` | `String` | Department |
| `status` | `String` | `approved` \| `current` \| `pending` \| `rejected` |
| `layer` | `Integer` | 1-based layer |
| `canUrge` | `Boolean` | Show 催辦 urge button |

---

## DashboardProcessStatus

| Property | Type | Description |
|---|---|---|
| `routeType` | `String` | Route type string, e.g. `串簽 Sequential` |
| `submittedAt` | `String` | Submission datetime |
| `estimatedCompletion` | `String` | Estimated completion date |
| `aiScore` | `Integer` | AI review score |
| `aiMaxScore` | `Integer` | Score denominator (default 100) |
| `aiSuggestionLabel` | `String` | AI action button label |
| `aiSuggestionAction` | `String` | AI action key |

---

## DashboardAuditLog

| Property | Type | Description |
|---|---|---|
| `events` | `DashboardAuditEvent[]` | Chronological events |

### DashboardAuditEvent

| Property | Type | Description |
|---|---|---|
| `timestamp` | `String` | e.g. `07-14 09:32` |
| `actor` | `String` | Person or system |
| `action` | `String` | e.g. `送審`, `核准`, `通知` |
| `detail` | `String` | Full event description |
| `isHighlighted` | `Boolean` | Highlight row in gold |

---

## DashboardApproverAction

| Property | Type | Description |
|---|---|---|
| `title` | `String` | Panel header, e.g. `待我審核` |
| `contextMessage` | `String` | Instruction text |
| `comment` | `String` | Approver comment (writable, synced via `commentChanged` event) |
| `decision` | `String` | Selected decision (writable) |
| `actions` | `DashboardActionButton[]` | Action buttons |

### DashboardActionButton

| Property | Type | Values |
|---|---|---|
| `label` | `String` | Button label |
| `actionKey` | `String` | Key passed to `actionClicked` event |
| `style` | `String` | `primary` \| `danger` \| `secondary` |
| `enabled` | `Boolean` | Whether clickable |

---

## DashboardRouteExplanation

| Property | Type | Description |
|---|---|---|
| `explanationText` | `String` | Narrative paragraph |
| `steps` | `DashboardRouteStep[]` | Flow diagram boxes |

### DashboardRouteStep

| Property | Type | Values |
|---|---|---|
| `label` | `String` | Box label (use `\n` for two lines) |
| `sublabel` | `String` | Optional second line |
| `status` | `String` | `completed` \| `current` \| `pending` |

---

## Events

| Event | Parameter | Fired when |
|---|---|---|
| `ctaClicked` | `ctaAction` (String) | Top CTA button or AI suggestion link clicked |
| `actionClicked` | `actionKey` (String) | Approver action button (核准/退回/轉派) clicked |
| `urgeClicked` | `approverIndex` (Integer) | 催辦 button clicked on an approver row |
| `commentChanged` | `comment` (String) | Approver comment textarea input changes |

---

## Fallback Behaviour

Every sub-section independently falls back to mock data:
- If `data` is `null` → all sections use mock
- If `data.approvalChain` is absent → that panel uses mock chain data
- Individual list properties (stages, approvers, events, steps) fall back to mock if empty

This ensures the widget is always visually complete in the BAW palette preview and during design-time.
