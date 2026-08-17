## Business Data

The widget is bound to a single `ApproverAction` object (not a list).

```javascript
{
  "approverName": "Jane Smith",
  "currentLayer": 2,
  "totalLayers": 3,
  "contextMessage": "This request exceeds the $50,000 threshold and requires VP approval.",
  "comment": "",
  "decision": "",
  "actions": [
    { "label": "Approve", "actionKey": "approve", "style": "primary", "enabled": true },
    { "label": "Reject",  "actionKey": "reject",  "style": "danger",  "enabled": true },
    { "label": "Return",  "actionKey": "return",  "style": "secondary", "enabled": true }
  ]
}
```

### Writable Fields

- `comment` — updated live as the user types in the textarea
- `decision` — set to the `actionKey` of the clicked button

### Events

- `actionClicked(actionKey)` — fired when any action button is clicked

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| readOnly | Boolean | false | Disables buttons and textarea |
| showContext | Boolean | true | Shows the contextMessage banner |
