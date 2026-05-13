# monthly-invoice-generation

Issues a deterministic dummy invoice every month. Subtotal is randomised in a
fixed range, tax is computed from the configured percentage, and the due date
is exactly 15 days after the run starts.

## Cadence

`MONTHLY`

## Config

| Field        | Type   | Required | Default | Notes                            |
| ------------ | ------ | -------- | ------- | -------------------------------- |
| `currency`   | string | no       | `INR`   | 3-letter ISO 4217 code           |
| `taxPercent` | number | no       | `18`    | 0-100, applied to the subtotal   |

## Sample output

```json
{
  "invoiceNumber": "INV-202605-481923",
  "subtotal": 12450.75,
  "tax": 2241.14,
  "total": 14691.89,
  "currency": "INR",
  "dueDate": "2026-05-28T08:00:00.000Z"
}
```

Deterministic from `dealerId + dealerServiceId + startedAt.getTime()`.
