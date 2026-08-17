## Data Binding

The widget binds directly to a **BAW Integer variable** (0–100). No business object is required.

```javascript
// Declare in your coach
tw.local.myProgress = 0;   // Integer, range 0–100

// Update from a script task or service
tw.local.myProgress = 65;
```

## Color-Coded States

The bar fill, percentage text, and status message all change colour automatically:

| Range   | Colour        | Hex       | State class       |
|---------|---------------|-----------|-------------------|
| 0–49%   | 🔴 Red        | `#da1e28` | `state-low`       |
| 50–74%  | 🟡 Yellow     | `#f1c21b` | `state-moderate`  |
| 75–100% | 🟢 Green      | `#24a148` | `state-high`      |

## Default Status Messages

| Progress | Message         | CSS class           |
|----------|-----------------|---------------------|
| 0%       | Not started     | `state-not-started` |
| 1–99%    | In progress...  | `state-in-progress` |
| 100%     | Complete        | `state-complete`    |

## Configuration Options

| Option            | Type    | Default | Description                                   |
|-------------------|---------|---------|-----------------------------------------------|
| `showPercentage`  | Boolean | `true`  | Show the large percentage number above the bar |
| `showStatus`      | Boolean | `true`  | Show the status message below the bar          |
| `animated`        | Boolean | `true`  | Smooth CSS transitions on value changes        |

## Programmatic Update

```javascript
// Get a reference to the widget and update it imperatively
var bar = this.ui.get("myProgressBar");
bar.updateProgress(80);   // also fires the progressChanged boundary event
```

## Notes

- Values outside 0–100 are clamped automatically.
- Animations respect `prefers-reduced-motion`.
- High-contrast mode adds a visible border around the track and fill.
