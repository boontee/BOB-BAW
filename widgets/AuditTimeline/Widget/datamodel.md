## Business Data

The widget is bound to a single `AuditLog` object containing a list of `AuditEvent` entries.

```javascript
{
  "events": [
    {
      "timestamp": "2026-08-15 09:32",
      "actor": "John Requester",
      "action": "Submitted",
      "detail": "Contract request submitted for USD 125,000.",
      "isHighlighted": false,
      "attachmentRef": ""
    },
    {
      "timestamp": "2026-08-15 14:05",
      "actor": "Alice Chen",
      "action": "Approved",
      "detail": "Approved at Layer 1. Looks good.",
      "isHighlighted": true,
      "attachmentRef": ""
    },
    {
      "timestamp": "2026-08-16 11:22",
      "actor": "Bob Nguyen",
      "action": "Returned",
      "detail": "Returned for clarification on budget code.",
      "isHighlighted": false,
      "attachmentRef": "REF-2026-0816-001"
    }
  ]
}
```

### Action Badge Colors

- `approved` — green badge
- `rejected` — red badge
- `submitted` — blue badge
- `returned` — yellow/amber badge
- anything else — gray badge

### Events

- `eventClicked(eventIndex)` — fired on row click; carries 0-based event index

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| compact | Boolean | false | Reduce vertical padding |
| showAttachments | Boolean | true | Show attachment reference links |
