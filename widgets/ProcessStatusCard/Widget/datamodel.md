## Business Data

The widget is bound to a single `ProcessStatus` object.

```javascript
{
  "routeType": "Sequential Approval (3 Layers)",
  "submittedAt": "2026-08-15 09:32",
  "estimatedCompletion": "2026-08-18 17:00",
  "aiScore": 72,
  "aiMaxScore": 100,
  "aiSuggestionLabel": "View Risk Factors",
  "aiSuggestionAction": "viewRiskFactors"
}
```

### AI Score Color Coding

- `0–39%` → Blue gauge fill
- `40–69%` → Yellow gauge fill  
- `70–100%` → Red gauge fill

### Events

- `aiSuggestionClicked(aiSuggestionAction)` — fired when the suggestion link is clicked

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| showAiScore | Boolean | true | Show/hide the AI risk score section |
