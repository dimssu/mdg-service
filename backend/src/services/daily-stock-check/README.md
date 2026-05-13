# daily-stock-check

Simulated daily inventory pull for a single warehouse. Flags any SKU whose
deterministic random quantity falls below the configured threshold.

## Cadence

`DAILY`

## Config

| Field         | Type    | Required | Default | Notes                                |
| ------------- | ------- | -------- | ------- | ------------------------------------ |
| `warehouseId` | string  | yes      | -       | 1-64 chars; embedded in mock SKU IDs |
| `threshold`   | number  | no       | `100`   | SKUs with `qty < threshold` flagged  |

## Sample output

```json
{
  "items": 327,
  "lowStockSkus": ["SKU-WH-NORTH-0003", "SKU-WH-NORTH-0017"],
  "pulledAt": "2026-05-13T08:00:00.000Z",
  "warehouseId": "WH-NORTH"
}
```

## Determinism

The PRNG is seeded with `dealerId + dealerServiceId + startedAt.getTime()`, so
re-running with the same triple reproduces both the item count and the
low-stock list.
