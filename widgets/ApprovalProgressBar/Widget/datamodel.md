## Business Data

The widget is bound to a single `ApprovalProgress` object.

```javascript
{
  "currentStageIndex": 1,
  "ctaLabel": "Submit for Approval",
  "ctaAction": "submit",
  "stages": [
    { "index": 0, "label": "Submitted",   "status": "completed" },
    { "index": 1, "label": "Review",      "status": "current" },
    { "index": 2, "label": "Approval",    "status": "pending" },
    { "index": 3, "label": "Completed",   "status": "pending" }
  ]
}
```

### Stage Status Values

- `completed` — green filled circle with checkmark; connector turns green
- `current` — blue filled circle; label highlighted
- `pending` — gray outlined circle

### Events

- `ctaClicked(ctaAction)` — fired when the CTA button is clicked

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| showCta | Boolean | true | Show/hide the CTA button |
