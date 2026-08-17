# Where to Put the Event Handler Code

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

## Step 7 — Add Boundary Events to the Coach Node

**Boundary Events** are small circles that appear ON THE EDGE of the Coach node.
They fire when an event is triggered, causing the flow to leave the Coach.

```
HOW TO ADD A BOUNDARY EVENT:
  1. Click the Coach node
  2. Look for a small [+] icon on the edge of the node
  3. Click it → select "Boundary Event"
  4. Name it (e.g. "On actionClicked")
  5. In its Properties → Event: select "actionClicked"
  6. Draw an arrow from this boundary event to your Script node

REPEAT for: ctaClicked, urgeClicked
(commentChanged and stepClicked use Coach View Events — see Step 8)
```

Visually on the canvas:

```
                ┌──────────────────────┐
                │   Coach: 簽核審查    │
                │                      │
                │  [ApprovalReview     │
                │   Dashboard widget]  │
                │                      ●─── boundary: actionClicked
                │                      ●─── boundary: ctaClicked
                │                      ●─── boundary: urgeClicked
                └──────────────────────┘
                         │
                    (normal exit)
                         │
                         ▼
                       [End]
```

Each boundary `●` has an arrow going to a Script node:

```
  ●── actionClicked ──▶ [Script: Handle Action] ──▶ [Gateway]
                                                        ├─ approve  → [End / next step]
                                                        ├─ return   → [End / notify submitter]
                                                        └─ delegate → [End / reassign]

  ●── ctaClicked    ──▶ [Script: Handle CTA]    ──▶ [End / next coach]

  ●── urgeClicked   ──▶ [Script: Handle Urge]   ──▶ [Coach] (loop back)
```

---

## Step 8 — commentChanged and stepClicked (Stay-on-Coach Events)

These two events should NOT leave the coach. Use **Coach View Events** instead:

```
HOW TO ADD A COACH VIEW EVENT:
  1. Open the Coach node (double-click)
  2. In the Coach editor → click [Events] tab at the top
  3. Click [Add] → Event Name: commentChanged → Output: tw.local.comment
  4. Click [Add] → Event Name: stepClicked    → Output: tw.local.stepIndex
  5. For each → set "On Event" action to run a Script
     OR: add a Script node outside the coach, connected via an intermediate
         boundary event that loops back to the coach
```

Simplest pattern — loop back:

```
  ●── commentChanged ──▶ [Script: Save Comment] ──▶ [Coach] (back to same coach)
  ●── stepClicked    ──▶ [Script: Handle Step]  ──▶ [Coach] (back to same coach)
```

---

## Step 9 — Paste Code into Each Script Node

Open each Script node (double-click → Script tab) and paste the relevant section
from `EVENT_HANDLERS_CSHS.js`:

```
  Script node name          Paste this section from EVENT_HANDLERS_CSHS.js
  ─────────────────────     ─────────────────────────────────────────────────
  "Handle Action"       →   // ═══ EVENT 1 — actionClicked  (lines 55–83)
  "Handle CTA"          →   // ═══ EVENT 2 — ctaClicked     (lines 101–121)
  "Handle Urge"         →   // ═══ EVENT 3 — urgeClicked    (lines 140–163)
  "Save Comment"        →   // ═══ EVENT 4 — commentChanged (lines 178–186)
  "Handle Step"         →   // ═══ EVENT 5 — stepClicked    (lines 200–215)
```

---

## Complete CSHS Diagram (Final)

```
[▶ Start]
    │
    ▼
[📄 Load Dashboard Data]   ← paste SAMPLE_DATA_CSHS.js here
    │
    ▼
[👤 Coach: 簽核審查] ────────────────────────────────────────────────┐
    │                                                                │
    │   widget bound to: tw.local.dashboardData                     │
    │   events mapped:                                              │
    │     actionClicked  → tw.local.actionKey                       │
    │     ctaClicked     → tw.local.ctaAction                       │
    │     urgeClicked    → tw.local.approverIndex                   │
    │     commentChanged → tw.local.comment                         │
    │     stepClicked    → tw.local.stepIndex                       │
    │                                                                │
    │ ●── actionClicked  ──▶ [📄 Handle Action] ──▶ [◇ Gateway]    │
    │                                                  ├─ approve   │
    │                                                  ├─ return    │
    │                                                  └─ delegate  │
    │                                                               │
    │ ●── ctaClicked     ──▶ [📄 Handle CTA]    ──▶ [◇ Gateway]    │
    │                                                  ├─ proceed   │
    │                                                  └─ ai_report │
    │                                                               │
    │ ●── urgeClicked    ──▶ [📄 Handle Urge]   ──────────────────▶│
    │                                                (loop back)    │
    │ ●── commentChanged ──▶ [📄 Save Comment]  ──────────────────▶│
    │                                                (loop back)    │
    │ ●── stepClicked    ──▶ [📄 Handle Step]   ──────────────────▶│
    │                                                (loop back)    │
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
    │
    ▼
[⬛ End]
```

---

## Quick Reference — Which File Goes Where

| File | Node type | When |
|---|---|---|
| `SAMPLE_DATA_CSHS.js` | Script node | Before Coach — runs once to populate data |
| `EVENT_HANDLERS_CSHS.js` → Event 1 | Script node (after boundary) | User clicks 退回/轉派/核准 |
| `EVENT_HANDLERS_CSHS.js` → Event 2 | Script node (after boundary) | User clicks CTA button |
| `EVENT_HANDLERS_CSHS.js` → Event 3 | Script node (after boundary) | User clicks 催辦 |
| `EVENT_HANDLERS_CSHS.js` → Event 4 | Script node (loop back) | User types in comment box |
| `EVENT_HANDLERS_CSHS.js` → Event 5 | Script node (loop back) | User clicks route step box |
