## Business Data

The widget is bound to a single `ApprovalChain` object.

```javascript
{
  "title": "Approval Chain",
  "routeType": "Sequential",
  "totalLayers": 3,
  "approvers": [
    { "name": "Alice Chen",  "avatarInitial": "A", "role": "Manager",    "department": "Finance", "status": "approved", "statusColor": "#198038", "layer": 1 },
    { "name": "Bob Nguyen",  "avatarInitial": "B", "role": "Director",   "department": "Finance", "status": "current",  "statusColor": "#0043ce", "layer": 2 },
    { "name": "Carol Davis", "avatarInitial": "C", "role": "VP Finance",  "department": "Finance", "status": "pending",  "statusColor": "#8d8d8d", "layer": 3 }
  ]
}
```

### Status Values

- `approved` — green avatar and badge
- `rejected` — red avatar and badge
- `current` — blue avatar and badge; card highlighted
- `pending` — gray avatar and badge

### Events

- `approverClicked(approverName)` — fired when an approver card is clicked
