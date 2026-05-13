# weekly-compliance-report

Generates a fake regional compliance summary: a 0-100 score, a small list of
findings, and an optional document audit count.

## Cadence

`WEEKLY`

## Config

| Field         | Type    | Required | Default | Notes                              |
| ------------- | ------- | -------- | ------- | ---------------------------------- |
| `region`      | string  | yes      | -       | Jurisdiction code, e.g. `KA`, `EU` |
| `includeDocs` | boolean | no       | `false` | Adds `docCount` to the output      |

## Sample output

```json
{
  "region": "KA",
  "score": 73,
  "findings": [
    { "code": "C-204", "severity": "MEDIUM", "note": "Operator training certificate missing" }
  ],
  "docCount": 12,
  "generatedAt": "2026-05-13T08:00:00.000Z"
}
```

Deterministic from `dealerId + dealerServiceId + startedAt.getTime()`.
