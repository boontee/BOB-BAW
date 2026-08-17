## Business Data

The widget is bound to a single `RoutingRule` object.

```javascript
{
  "title": "Routing Rule Triggered",
  "explanation": "This contract request exceeds the standard approval threshold and has been escalated to the VP of Finance for additional review per policy FIN-2024-03.",
  "ruleId": "FIN-2024-03",
  "triggeredByAmount": "USD 125,000",
  "threshold": "USD 100,000",
  "nextAction": "Escalate to VP Finance"
}
```

### Events

- `nextActionClicked(nextAction)` — fired when the next action link is clicked; carries the `nextAction` string value
