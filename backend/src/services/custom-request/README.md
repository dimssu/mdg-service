# custom-request

Generic on-demand plugin. Echoes the configured payload back in the run output
after a simulated 100-250ms processing delay. Useful as a placeholder action
or for ad-hoc operator-triggered work.

## Cadence

`ON_DEMAND`

## Config

| Field         | Type   | Required | Default | Notes                                  |
| ------------- | ------ | -------- | ------- | -------------------------------------- |
| `requestType` | string | yes      | -       | Free-form label for the request       |
| `payload`     | object | no       | `{}`    | Arbitrary JSON object echoed verbatim |

## Sample output

```json
{
  "requestType": "manual-audit",
  "echo": { "ticketId": "T-2031", "notes": "follow up next week" },
  "processedAt": "2026-05-13T08:00:00.187Z"
}
```
