# annual-license-renewal-reminder

Computes the date on which a renewal reminder should fire — `daysBefore` days
before the next annual expiry, treated as `startedAt + 365 days`.

## Cadence

`YEARLY`

## Config

| Field           | Type    | Required | Default | Notes                                      |
| --------------- | ------- | -------- | ------- | ------------------------------------------ |
| `licenseNumber` | string  | yes      | -       | The license to track                        |
| `daysBefore`    | integer | no       | `30`    | 1-365; how far ahead of expiry to remind   |

## Sample output

```json
{
  "licenseNumber": "KA-FUEL-2025-0042",
  "reminderAt": "2027-04-13T08:00:00.000Z",
  "message": "License KA-FUEL-2025-0042 renewal due in 30 days; reminder scheduled for 2027-04-13T08:00:00.000Z."
}
```
