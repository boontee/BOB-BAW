# Where to Put the Event Handler Code
> **BAW version: 25.0.1** — uses the modern CSHS editor.
> Boundary Events cannot be dragged onto Coach nodes in this version.
> Use the **Coaches tab → Navigate / Stay on Page** method instead (Step 7 below).

## The Big Picture

In BAW Process Designer, a **Client-Side Human Service (CSHS)** is a flow diagram
made of nodes connected by arrows. You need to:

1. Create a CSHS (or open an existing one)
2. Declare variables
3. Add a **Script node** before the Coach (to load data)
4. Add **Script nodes** after the Coach (to handle each event)
5. Connect them with arrows and Boundary Events

---

## Step 1 — Create the CSHS

```
Process Designer
  → Open your Process Application
  → Left panel: User Interface
  → Click [ + ] → Client-Side Human Service
  → Name it: "簽核審查"
```

---

## Step 2 — Declare Variables

```
Inside the CSHS editor:
  → Click the [Variables] tab (top of the CSHS canvas)
  → Under "Private" section, add each row below:

  ┌─────────────────────┬──────────────────────────────┬─────────┐
  │ Name                │ Type                         │ Private │
  ├─────────────────────┼──────────────────────────────┼─────────┤
  │ dashboardData       │ ApprovalReviewDashboard (BO) │   ✓     │
  │ actionKey           │ String                       │   ✓     │
  │ ctaAction           │ String                       │   ✓     │
  │ approverIndex       │ Integer                      │   ✓     │
  │ comment             │ String                       │   ✓     │
  │ stepIndex           │ Integer                      │   ✓     │
  └─────────────────────┴──────────────────────────────┴─────────┘

  NOTE: "ApprovalReviewDashboard" appears in the type picker because
        it is defined in the Custom Widgets (CW) toolkit.
```

---

## Step 3 — Build the Flow Diagram

Click the **[Diagram]** tab. Drag nodes from the palette on the left to build this flow:

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     CSHS CANVAS                                 │
  │                                                                 │
  │  [▶ Start]                                                      │
  │      │                                                          │
  │      ▼                                                          │
  │  [📄 Script]  ← "Load Dashboard Data"                           │
  │      │                                                          │
  │      ▼                                                          │
  │  [👤 Coach]   ← "簽核審查"  ────────────── boundary events ──┐  │
  │      │                                                       │  │
  │      ▼                                          ┌────────────┘  │
  │  [⬛ End]                                       │               │
  │                                                 ▼               │
  │                                   [📄 Script: Handle Action]    │
  │                                   [📄 Script: Handle CTA]       │
  │                                   [📄 Script: Handle Urge]      │
  │                                   [📄 Script: Save Comment]     │
  │                                   [📄 Script: Handle Step]      │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Step 4 — Paste Code into the "Load Dashboard Data" Script Node

```
1. Drag a [Script] node onto the canvas BEFORE the Coach node
2. Name it: "Load Dashboard Data"
3. Draw an arrow:  [Start] → [Load Dashboard Data] → [Coach]
4. Double-click the Script node to open it
5. Click the [Script] tab inside the node editor
6. PASTE the entire contents of:
      SAMPLE_DATA_CSHS.js
```

```
  ┌──────────────────────────────────────────────┐
  │  Script Node Editor                          │
  │  ┌──────────────────────────────────────┐    │
  │  │ tw.local.dashboardData = {           │    │
  │  │   contractTitle: "2026 年度...",     │    │  ← paste here
  │  │   progress: { ... },                 │    │
  │  │   approvalChain: { ... },            │    │
  │  │   ...                                │    │
  │  │ };                                   │    │
  │  └──────────────────────────────────────┘    │
  └──────────────────────────────────────────────┘
```

---

## Step 5 — Set Up the Coach Node

```
1. Drag a [Coach] node onto the canvas
2. Name it: "簽核審查"
3. Open it → drag the [ApprovalReviewDashboard] widget from the palette
4. Click the widget → Properties panel on the right:
      General tab → Binding → select: tw.local.dashboardData
```

---

## Step 6 — Wire Events on the Coach Node

This is where you connect the widget's events to handler scripts.

```
1. Click the Coach node (single click, don't open it)
2. In the Properties panel → click the [Events] tab
3. You will see a list of events from the widget:

  ┌──────────────────┬──────────────────┬─────────────────────┐
  │ Event Name       │ Output Parameter │ Map to Variable     │
  ├──────────────────┼──────────────────┼─────────────────────┤
  │ actionClicked    │ actionKey        │ tw.local.actionKey  │
  │ ctaClicked       │ ctaAction        │ tw.local.ctaAction  │
  │ urgeClicked      │ approverIndex    │ tw.local.approverIndex│
  │ commentChanged   │ comment          │ tw.local.comment    │
  │ stepClicked      │ stepIndex        │ tw.local.stepIndex  │
  └──────────────────┴──────────────────┴─────────────────────┘

4. For each event → click the dropdown under "Map to" → select the variable
```

---

## Step 7 — Wire Coach Events (BAW 25.0.1 — Coaches Tab)

> ⚠️ In BAW 25.0.1 you **cannot drag boundary events** onto a Coach node.
> Use the **Coaches tab** in the right Properties panel instead.

```
1. Click the Coach node (single click — do NOT open it)

2. Right Properties panel → click the [Coaches] tab

3. You see a table:   Widget / Event  |  Action  |  Navigate To

4. Set each row:

   ┌─────────────────────┬────────────────┬─────────────────────────┐
   │ Event               │ Action         │ Navigate To             │
   ├─────────────────────┼────────────────┼─────────────────────────┤
   │ actionClicked       │ Navigate       │ Script: Handle Action   │
   │ ctaClicked          │ Navigate       │ Script: Handle CTA      │
   │ urgeClicked         │ Navigate       │ Script: Handle Urge     │
   │ commentChanged      │ Stay on Page   │ (none)                  │
   │ stepClicked         │ Stay on Page   │ (none)                  │
   └─────────────────────┴────────────────┴─────────────────────────┘

   "Navigate"     → exits the Coach and runs the linked Script node
   "Stay on Page" → stays on the Coach (handle in Step 8 Coach Script)
```

---

## Step 8 — commentChanged and stepClicked (Stay on Page)

These two stay on the coach. Paste their logic into the **Coach Script tab**:

```
1. Double-click the Coach node to open it
2. At the top of the Coach editor → click the [Script] tab
3. Paste this code:
```

```javascript
// Coach Script — runs client-side, stays on same coach page

// commentChanged — sync textarea value back to the BO
if (tw.event && tw.event.name === "commentChanged") {
    tw.local.dashboardData.approverAction.comment = tw.local.comment;
}

// stepClicked — record which route step was clicked
if (tw.event && tw.event.name === "stepClicked") {
    var labels = ["申請人送審","直屬主管核准","上一階核准","最終核准執行","外部簽署"];
    log.info("Step clicked: " + labels[tw.local.stepIndex] + " (index " + tw.local.stepIndex + ")");
    // Optional: tw.local.selectedStepIndex = tw.local.stepIndex;
}
```

---

## Step 9 — Paste Code into Each Navigate Script Node

For the 3 **Navigate** events, create a Script node for each and paste the
matching section from `EVENT_HANDLERS_CSHS.js`:

```
  Script node name     Paste section from EVENT_HANDLERS_CSHS.js
  ──────────────────   ────────────────────────────────────────────
  "Handle Action"  →   // ═══ EVENT 1 — actionClicked
  "Handle CTA"     →   // ═══ EVENT 2 — ctaClicked
  "Handle Urge"    →   // ═══ EVENT 3 — urgeClicked
```

---

## Complete CSHS Diagram (Final — BAW 25.0.1)

```
[▶ Start]
    │
    ▼
[📄 Script: Load Data]         ← paste SAMPLE_DATA_CSHS.js
    │
    ▼
[👤 Coach: 簽核審查]
    │
    │   Coaches tab wiring:
    │     actionClicked  → Navigate       → [Script: Handle Action]
    │     ctaClicked     → Navigate       → [Script: Handle CTA]
    │     urgeClicked    → Navigate       → [Script: Handle Urge]
    │     commentChanged → Stay on Page   (handled in Coach Script tab)
    │     stepClicked    → Stay on Page   (handled in Coach Script tab)
    │
    │   (normal path — user finishes without triggering any event)
    ▼
[⬛ End]


[📄 Script: Handle Action]     ← paste EVENT 1 code
    │
    ▼
[◇ Gateway: check actionKey]
    ├─ actionKey == "approve"   →  [⬛ End: Approved]
    ├─ actionKey == "return"    →  [⬛ End: Rejected]
    └─ actionKey == "delegate"  →  [⬛ End: Delegated]


[📄 Script: Handle CTA]        ← paste EVENT 2 code
    │
    ▼
[⬛ End: External Signing]


[📄 Script: Handle Urge]       ← paste EVENT 3 code
    │
    ▼
[👤 Coach: 簽核審查]            ← loop back to same coach
```

---

## Quick Reference — Which File Goes Where

| File | Node type | When |
|---|---|---|
| `SAMPLE_DATA_CSHS.js` | Script node | Before Coach — runs once to load data |
| `EVENT_HANDLERS_CSHS.js` → Event 1 | Script node (Navigate) | User clicks 退回/轉派/核准 |
| `EVENT_HANDLERS_CSHS.js` → Event 2 | Script node (Navigate) | User clicks CTA button |
| `EVENT_HANDLERS_CSHS.js` → Event 3 | Script node (Navigate, loops back) | User clicks 催辦 |
| Events 4 & 5 | Coach Script tab (Stay on Page) | User types comment / clicks route step |
