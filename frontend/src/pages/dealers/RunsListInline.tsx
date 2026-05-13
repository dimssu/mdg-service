import type { ServiceRun } from '@dk/shared';
import * as React from 'react';

import {
  EmptyState,
  Skeleton,
  StatusChip,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TRow,
  Dialog,
  Button,
} from '@/components/ui';
import { useRunsQuery } from '@/hooks/api/useRuns';
import { formatDateTime, formatDuration } from '@/lib/format';

interface Props {
  dealerId?: string;
  serviceId?: string;
}

export function RunsListInline({ dealerId, serviceId }: Props) {
  const { data, isLoading } = useRunsQuery({
    dealerId,
    serviceId,
    page: 1,
    pageSize: 25,
  });
  const [open, setOpen] = React.useState<ServiceRun | null>(null);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No runs yet"
        description="Once the service runs, results will appear here."
      />
    );
  }
  return (
    <>
      <Table>
        <THead>
          <TRow>
            <TH>Service</TH>
            <TH>Status</TH>
            <TH>Started</TH>
            <TH>Duration</TH>
          </TRow>
        </THead>
        <TBody>
          {data.items.map((r) => (
            <TRow key={r.id} clickable onClick={() => setOpen(r)}>
              <TD className="font-medium">{r.serviceId}</TD>
              <TD>
                <StatusChip kind="run" value={r.status} />
              </TD>
              <TD className="text-text-muted">
                {formatDateTime(r.startedAt)}
              </TD>
              <TD className="text-text-muted">
                {formatDuration(r.durationMs)}
              </TD>
            </TRow>
          ))}
        </TBody>
      </Table>

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `Run ${open.id.slice(-8)}` : ''}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setOpen(null)}>
            Close
          </Button>
        }
      >
        {open ? <RunDetail run={open} /> : null}
      </Dialog>
    </>
  );
}

function RunDetail({ run }: { run: ServiceRun }) {
  return (
    <div className="grid gap-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Service" value={run.serviceId} />
        <Field
          label="Status"
          value={<StatusChip kind="run" value={run.status} />}
        />
        <Field label="Started" value={formatDateTime(run.startedAt)} />
        <Field label="Finished" value={formatDateTime(run.finishedAt)} />
        <Field label="Duration" value={formatDuration(run.durationMs)} />
        <Field label="Dealer" value={run.dealerId} />
      </div>
      {run.error ? (
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Error
          </p>
          <pre className="overflow-auto rounded-md bg-surface-2 p-3 text-xs">
            {run.error.message}
            {run.error.stack ? `\n${run.error.stack}` : ''}
          </pre>
        </section>
      ) : null}
      <section>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Output
        </p>
        <pre className="max-h-72 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
          {JSON.stringify(run.output ?? null, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-subtle">
        {label}
      </p>
      <p className="text-text">{value}</p>
    </div>
  );
}
