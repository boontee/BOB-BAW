# MyProgressBar Event Handlers

## progressChanged

Fires whenever the bound Integer value changes (via data binding or `updateProgress()`).

**Registration (handled automatically by the widget):**
```javascript
this.registerEventHandlingFunction(this, "progressChanged", "value");
```

**Event payload** — the `value` parameter is an object:

| Property       | Type    | Example           | Description                        |
|----------------|---------|-------------------|------------------------------------|
| `value.value`  | Integer | `65`              | Current progress value (0–100)     |
| `value.state`  | String  | `"state-moderate"`| Color state of the bar             |
| `value.status` | String  | `"In progress..."` | Current status message text       |

### Example handler

```javascript
// progressChanged boundary event handler
var pct   = value.value;   // e.g. 65
var state = value.state;   // "state-low" | "state-moderate" | "state-high"

if (pct === 100) {
  this.ui.get("submitButton").setEnabled(true);
} else if (pct >= 50) {
  this.ui.get("hintText").setText("More than halfway there!");
}
```

### Common patterns

**Enable a Next button only when bar is green:**
```javascript
this.ui.get("nextButton").setEnabled(value.state === "state-high");
```

**Store state in a process variable:**
```javascript
tw.local.progressState = value.state;
```

**Log for audit:**
```javascript
console.log("[MyProgressBar] " + value.value + "% — " + value.status);
```

## change (BAW built-in)

Fired by BAW whenever the bound variable changes through the normal data-binding
mechanism. The widget re-renders automatically; add extra coach logic here if needed.

```javascript
// change event handler
var updated = this.getData();   // returns the new Integer value
console.log("Binding changed to:", updated);
```
