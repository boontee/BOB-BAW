## Business Data

The widget is bound to a single `ApprovalRoute` object containing an ordered list of `RouteStep` items.

```javascript
{
  "steps": [
    { "label": "Submitted",  "sublabel": "Requester",    "status": "completed", "colorToken": "green" },
    { "label": "L1 Review",  "sublabel": "Manager",      "status": "completed", "colorToken": "green" },
    { "label": "L2 Approval","sublabel": "Director",     "status": "current",   "colorToken": "blue"  },
    { "label": "L3 Approval","sublabel": "VP Finance",   "status": "pending",   "colorToken": "gray"  },
    { "label": "Completed",  "sublabel": "",             "status": "pending",   "colorToken": "gray"  }
  ]
}
```

### Step Status Values

- `completed` — green circle with checkmark; preceding arrow is green
- `current` — blue circle with glow; node number shown
- `pending` — gray outlined circle
- `rejected` — red circle with X icon

### Events

- `stepClicked(stepIndex)` — fired when a step node is clicked; carries 0-based index
