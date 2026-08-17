# MyProgressBar Widget

An IBM Business Automation Workflow (BAW) custom coach view widget that displays an
animated horizontal progress bar bound directly to a BAW **Integer variable** (0–100),
with automatic color-coded states, real-time percentage display, and status messages
styled with the Carbon Design System.

## Features

- **Animated horizontal progress bar** with smooth CSS transitions
- **Real-time percentage display** (large, centered, color-matched)
- **Automatic color-coded states** driven by the Integer value:
  - 🔴 Red `#da1e28` (0–49%) — Low progress
  - 🟡 Yellow `#f1c21b` (50–74%) — Moderate progress
  - 🟢 Green `#24a148` (75–100%) — High progress
- **Dynamic status messages**: "Not started" / "In progress..." / "Complete"
- **Shimmer animation** on the fill bar and pulse animation on the in-progress status
- **`progressChanged` boundary event** with value, state, and status payload
- **Programmatic API** — `updateProgress(n)` callable from other widgets
- **Accessibility** — ARIA progressbar role, aria-valuenow, aria-live regions,
  `prefers-reduced-motion`, and high-contrast mode support
- **Responsive** — adapts at ≤672 px breakpoint

## Key difference from ProgressBar

`MyProgressBar` binds to a **plain Integer** — no business object required.
Just create a coach variable of type `Integer` and bind it directly.

## File Structure

```
MyProgressBar/
├── README.md
├── MyProgressBar.svg                  # Palette icon
├── widget/
│   ├── Layout.html                    # Widget HTML (scoped CSS prefix: myprogressbar_)
│   ├── InlineCSS.css                  # Scoped Carbon styles
│   ├── inlineJavascript.js            # BAW inline JS — binding + event handling
│   ├── config.json                    # Widget metadata, bindingType: Integer
│   ├── datamodel.md                   # Data model documentation
│   └── eventHandler.md               # Event handler documentation
└── AdvancePreview/
    ├── MyProgressBar.html             # Standalone browser preview with live slider
    └── MyProgressBarSnippet.js        # BAW designer preview implementation
```

## Quick Start

### 1 — Add to a Coach

Drag **MyProgressBar** from the palette onto your coach canvas.

### 2 — Bind to an Integer variable

In the widget **Data** tab, bind to any Integer coach variable:

```javascript
tw.local.myProgress = 0;   // Integer, 0–100
```

### 3 — Run the coach

The bar renders immediately. Update `tw.local.myProgress` from a script task
or service flow — the widget re-renders automatically.

## Configuration Options

| Option           | Type    | Default | Description                              |
|------------------|---------|---------|------------------------------------------|
| `showPercentage` | Boolean | `true`  | Show large percentage number above bar   |
| `showStatus`     | Boolean | `true`  | Show status message below bar            |
| `animated`       | Boolean | `true`  | Smooth width + colour CSS transitions    |

## Events

### `progressChanged`

Fires on every value change (data binding or `updateProgress()`).

```javascript
// Event parameter: value (object)
var pct    = value.value;   // Integer 0–100
var state  = value.state;   // "state-low" | "state-moderate" | "state-high"
var status = value.status;  // "Not started" | "In progress..." | "Complete"

// Example: enable Submit only when green
this.ui.get("submitButton").setEnabled(state === "state-high");
```

## Local Preview

Open directly in a browser — no server needed:

```bash
open widgets/MyProgressBar/AdvancePreview/MyProgressBar.html
```

Drag the slider to see the color state, percentage, and status message update live.

## Programmatic API

```javascript
var bar = this.ui.get("myProgressBar");
bar.updateProgress(80);   // updates UI, bound variable, and fires progressChanged
```

## Color Palette (Carbon)

| Element        | Token         | Hex       |
|----------------|---------------|-----------|
| Low fill       | Red 60        | `#da1e28` |
| Moderate fill  | Yellow 30     | `#f1c21b` |
| High fill      | Green 50      | `#24a148` |
| Track          | Gray 20       | `#e0e0e0` |
| Percentage     | Matches state |           |
| Status bg (done) | Green 10   | `#defbe6` |

## License

```
Licensed Materials - Property of IBM
5725-C95
(C) Copyright IBM Corporation 2026
```

---

**Version**: 1.0
**Carbon Design System**: v11.x compatible
**BAW Compatibility**: IBM BAW v18.0+

<!-- Made with Bob -->
