import * as React from 'react';

import { ChevronLeft, Plus, Search, X } from '../components/icons';
import { AppButton, Avatar, CheckCircle, PointsPill, TextField } from '../components/ui';
import { type WorkItem, type Warrior } from '../lib/demoData';
import { fmtPoints, splitPer } from '../lib/format';
import { colors } from '../theme';

export type SheetStep = 'worker' | 'work' | 'configure';

export interface SheetState {
  step: SheetStep;
  warriors: Warrior[];
  selectedWorkerIds: string[];
  catalog: WorkItem[];
  selectedCodes: string[];
  continuePressed?: boolean;
  confirmPressed?: boolean;
  /** Text typed into an "Other" work's description box (empty = not yet filled). */
  noteText?: string;
  /** Draw the description box's error state — the dealer tried to add it empty. */
  noteError?: boolean;
  noteCaret?: boolean;
}

function perEach(item: WorkItem, count: number): number {
  if (item.distribution === 'SPLIT') return splitPer(item.points, count);
  return item.points; // EACH / FLAT / PER_UNIT(qty 1)
}

/**
 * The description box on a catch-all work. Mirrors the real app: a required
 * textarea that turns red and explains itself when the dealer tries to add the
 * work without saying what was done.
 */
function NoteBox({ value, error, caret }: { value: string; error: boolean; caret: boolean }) {
  const empty = value.length === 0;
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: colors.textMuted,
          padding: '0 2px',
          marginBottom: 5,
        }}
      >
        उन्होंने क्या काम किया?
      </div>
      <div
        style={{
          minHeight: 62,
          borderRadius: 14,
          border: `1.5px solid ${error ? colors.danger : colors.borderStrong}`,
          background: colors.surface2,
          padding: '10px 12px',
          fontSize: 14.5,
          color: empty ? colors.textSubtle : colors.text,
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <span>{empty ? 'जैसे — छत की सफाई की' : value}</span>
        {caret ? (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 19,
              marginLeft: 2,
              background: colors.text,
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          marginTop: 5,
          padding: '0 2px',
          fontSize: 12,
          color: error ? colors.danger : colors.textMuted,
        }}
      >
        {error
          ? 'इसे जोड़ने के लिए लिखिए कि क्या काम किया'
          : 'इस काम से पता नहीं चलता कि क्या किया — कृपया लिखिए।'}
      </div>
    </div>
  );
}

const STEP_TITLE: Record<SheetStep, string> = {
  worker: 'काम किसने किया?',
  work: 'उन्होंने क्या किया?',
  configure: 'पक्का करें',
};

function Header({ step }: { step: SheetStep }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: `1px solid ${colors.border}`,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textMuted,
        }}
      >
        {step !== 'worker' ? <ChevronLeft size={20} /> : null}
      </div>
      <div
        style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: colors.text }}
      >
        {STEP_TITLE[step]}
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textMuted,
        }}
      >
        <X size={20} />
      </div>
    </div>
  );
}

function WorkerRow({ w }: { w: Warrior }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        borderRadius: 18,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        padding: '0 12px',
      }}
    >
      <Avatar name={w.name} size={40} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: colors.text }}>{w.name}</div>
        {w.designation ? (
          <div style={{ fontSize: 12, color: colors.textMuted }}>{w.designation}</div>
        ) : null}
      </div>
    </div>
  );
}

function groupByDomain(items: WorkItem[]) {
  const order: string[] = [];
  const map = new Map<string, WorkItem[]>();
  for (const it of items) {
    if (!map.has(it.domainHi)) {
      map.set(it.domainHi, []);
      order.push(it.domainHi);
    }
    map.get(it.domainHi)!.push(it);
  }
  return order.map((domain) => ({ domain, items: map.get(domain)! }));
}

function WorkPicker({ catalog, selectedCodes }: { catalog: WorkItem[]; selectedCodes: string[] }) {
  const selected = new Set(selectedCodes);
  const groups = groupByDomain(catalog);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textSubtle,
            }}
          >
            <Search size={16} />
          </div>
          <div style={{ paddingLeft: 22 }}>
            <TextField placeholder="काम खोजें…" />
          </div>
        </div>
        <div style={{ fontSize: 12, color: colors.textSubtle, padding: '8px 2px 0' }}>
          उन्होंने जो-जो किया सब चुनें — जितने चाहें उतने
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.domain} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: colors.textSubtle,
              textTransform: 'uppercase',
              padding: '0 2px',
            }}
          >
            {g.domain}
          </div>
          {g.items.map((item) => {
            const on = selected.has(item.code);
            return (
              <div
                key={item.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  borderRadius: 18,
                  border: `1px solid ${on ? colors.brand : colors.border}`,
                  background: on ? colors.brandSoft : colors.surface,
                  padding: '8px 12px',
                }}
              >
                <CheckCircle on={on} />
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: colors.text }}>
                  {item.labelHi}
                </span>
                <PointsPill>{fmtPoints(item.points)}</PointsPill>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Configure({ state }: { state: SheetState }) {
  const count = state.selectedWorkerIds.length;
  const selectedSet = new Set(state.selectedWorkerIds);
  const works = state.catalog.filter((w) => state.selectedCodes.includes(w.code));
  const canPick = state.warriors.length > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* who did it together */}
      {canPick ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, padding: '0 2px' }}>
            यह किसने-किसने किया?
          </div>
          {state.warriors.map((w) => {
            const on = selectedSet.has(w.id);
            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  borderRadius: 18,
                  border: `1px solid ${on ? colors.brand : colors.border}`,
                  background: on ? colors.brandSoft : colors.surface,
                  padding: '0 12px',
                }}
              >
                <Avatar name={w.name} size={36} />
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: colors.text }}>
                  {w.name}
                </span>
                <CheckCircle on={on} />
              </div>
            );
          })}
        </div>
      ) : null}

      {/* the works */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2px',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted }}>
            किया गया काम
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>+ और जोड़ें</span>
        </div>
        {works.map((item) => {
          const per = perEach(item, count);
          const hint = item.distribution === 'SPLIT' ? 'सबके बीच बँटेगा' : null;
          return (
            <div
              key={item.code}
              style={{
                borderRadius: 18,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: colors.text }}>
                  {item.labelHi}
                </span>
                <PointsPill>{`हर एक को ${fmtPoints(per)}`}</PointsPill>
              </div>
              {hint ? (
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 5 }}>{hint}</div>
              ) : null}

              {/* The catch-all work is the only one that asks what was done. */}
              {item.needsNote ? (
                <NoteBox
                  value={state.noteText ?? ''}
                  error={state.noteError ?? false}
                  caret={state.noteCaret ?? false}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* day */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, padding: '0 2px' }}>
          दिन
        </span>
        <TextField value="आज · 6 जुलाई 2026" />
      </div>
    </div>
  );
}

/** The bottom-sheet overlay, drawn on top of the StaffScreen. */
export function GivePointsSheet(state: SheetState) {
  const count = state.selectedWorkerIds.length;
  const works = state.catalog.filter((w) => state.selectedCodes.includes(w.code));
  const grandTotal = works.reduce((s, w) => s + perEach(w, count) * count, 0);
  const previewTotal = works.reduce((s, w) => s + perEach(w, 1), 0);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
      {/* backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      {/* sheet */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 690,
          background: colors.surface,
          borderRadius: '22px 22px 0 0',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(15,23,42,0.18)',
        }}
      >
        <Header step={state.step} />

        <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px' }}>
          {state.step === 'worker' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.warriors.map((w) => (
                <WorkerRow key={w.id} w={w} />
              ))}
            </div>
          ) : state.step === 'work' ? (
            <WorkPicker catalog={state.catalog} selectedCodes={state.selectedCodes} />
          ) : (
            <Configure state={state} />
          )}
        </div>

        {/* footer */}
        {state.step === 'work' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderTop: `1px solid ${colors.border}`,
              padding: 12,
            }}
          >
            {state.selectedCodes.length > 0 ? (
              <div style={{ textAlign: 'center', fontSize: 12.5, color: colors.textMuted }}>
                {`${state.selectedCodes.length} चुने · ${fmtPoints(previewTotal)} पॉइंट`}
              </div>
            ) : null}
            <AppButton fullWidth pressed={state.continuePressed}>
              आगे बढ़ें
            </AppButton>
          </div>
        ) : state.step === 'configure' ? (
          <div style={{ borderTop: `1px solid ${colors.border}`, padding: 12 }}>
            {/*
              The new flow does NOT award here. The work joins the dealer's pending
              submission; the leaderboard only moves on final submit.
            */}
            <AppButton
              fullWidth
              pressed={state.confirmPressed}
              leftIcon={<Plus size={16} color={colors.textInverse} strokeWidth={2} />}
            >
              {`सूची में जोड़ें · ${fmtPoints(grandTotal)}`}
            </AppButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
