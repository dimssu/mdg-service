import * as React from 'react';

import { Plus, Undo, UserPlus } from '../components/icons';
import { AppButton, Avatar, SegmentToggle, TextField } from '../components/ui';
import { DAILY_TARGET, type DraftLine, type Warrior } from '../lib/demoData';
import { colors } from '../theme';

import { PendingSubmission } from './PendingSubmission';

export interface StaffState {
  variant: 'empty' | 'list';
  windowIndex?: number;
  warriors?: Warrior[];
  addFormOpen?: boolean;
  addForm?: {
    name?: string;
    phone?: string;
    designation?: string;
    nameFocused?: boolean;
    nameCaret?: boolean;
  };
  givePressed?: boolean;
  addPressed?: boolean;
  savePressed?: boolean;
  emptyCtaPressed?: boolean;
  toast?: { text: string; undo?: boolean };
  /** The pending submission panel — shown once work has been added to the draft. */
  draft?: DraftLine[];
  finalSubmitPressed?: boolean;
}

function LeaderboardRow({ w }: { w: Warrior }) {
  const reached = w.points >= DAILY_TARGET;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 18,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        padding: '11px 12px',
      }}
    >
      <Avatar name={w.name} size={44} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{w.name}</div>
        {w.designation ? (
          <div style={{ fontSize: 12.5, color: colors.textMuted }}>{w.designation}</div>
        ) : null}
        {reached ? (
          <span
            style={{
              display: 'inline-block',
              marginTop: 4,
              background: colors.successSoft,
              color: colors.success,
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            100 पूरे
          </span>
        ) : null}
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}
      >
        <span style={{ fontSize: 26, fontWeight: 700, color: colors.text }}>{w.points}</span>
        <span style={{ fontSize: 11, color: colors.textSubtle, marginTop: 3 }}>पॉइंट</span>
      </div>
    </div>
  );
}

function AddForm({
  addForm,
  savePressed,
}: {
  addForm: NonNullable<StaffState['addForm']>;
  savePressed?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderRadius: 18,
        border: `1px solid ${colors.border}`,
        background: colors.surface2,
        padding: 12,
      }}
    >
      <TextField
        value={addForm.name}
        placeholder="योद्धा का नाम"
        focused={addForm.nameFocused}
        caret={addForm.nameCaret}
      />
      <TextField value={addForm.phone} placeholder="फ़ोन (ज़रूरी नहीं)" />
      <TextField value={addForm.designation} placeholder="काम / पद (ज़रूरी नहीं)" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <AppButton size="md" fullWidth pressed={savePressed}>
          योद्धा सेव करें
        </AppButton>
        <AppButton size="md" variant="ghost">
          रद्द करें
        </AppButton>
      </div>
    </div>
  );
}

function EmptyState({ pressed }: { pressed?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 12,
        padding: '0 24px',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          background: colors.surface2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textMuted,
        }}
      >
        <UserPlus size={30} strokeWidth={1.5} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
        अपना पहला योद्धा जोड़ें
      </div>
      <div style={{ fontSize: 14, color: colors.textMuted, maxWidth: 280 }}>
        अपने योद्धाओं की सूची रखें और उनके काम के लिए पॉइंट दें।
      </div>
      <div style={{ marginTop: 6 }}>
        <AppButton leftIcon={<UserPlus size={18} color={colors.textInverse} />} pressed={pressed}>
          योद्धा जोड़ें
        </AppButton>
      </div>
    </div>
  );
}

function Toast({ text, undo }: { text: string; undo?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 20,
        background: colors.brand,
        color: colors.textInverse,
        borderRadius: 14,
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 10px 30px rgba(15,23,42,0.25)',
        zIndex: 40,
      }}
    >
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}>{text}</span>
      {undo ? (
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700 }}
        >
          <Undo size={15} color={colors.textInverse} />
          वापस लें
        </span>
      ) : null}
    </div>
  );
}

export function StaffScreen(state: StaffState) {
  const warriors = state.warriors ?? [];
  const showEmpty = state.variant === 'empty' && !state.addFormOpen;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 16,
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>योद्धा और पॉइंट</span>
        <SegmentToggle options={['आज', 'इस महीने']} activeIndex={state.windowIndex ?? 0} />
      </div>

      {showEmpty ? (
        <EmptyState pressed={state.emptyCtaPressed} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <AppButton
              fullWidth
              leftIcon={<Plus size={18} color={colors.textInverse} strokeWidth={2} />}
              pressed={state.givePressed}
              style={{ flex: 1 }}
            >
              पॉइंट दें
            </AppButton>
            <AppButton
              variant="secondary"
              leftIcon={<UserPlus size={18} color={colors.text} />}
              pressed={state.addPressed}
            >
              योद्धा जोड़ें
            </AppButton>
          </div>

          {state.addFormOpen && state.addForm ? (
            <AddForm addForm={state.addForm} savePressed={state.savePressed} />
          ) : null}

          {state.draft && state.draft.length > 0 ? (
            <PendingSubmission lines={state.draft} submitPressed={state.finalSubmitPressed} />
          ) : null}

          <div style={{ fontSize: 12.5, color: colors.textSubtle, padding: '0 2px' }}>
            हर योद्धा को 100 पॉइंट चाहिए
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {warriors.map((w) => (
              <LeaderboardRow key={w.id} w={w} />
            ))}
          </div>
        </>
      )}

      {state.toast ? <Toast text={state.toast.text} undo={state.toast.undo} /> : null}
    </div>
  );
}
