import * as React from 'react';

import { CloudCheck, Trash } from '../components/icons';
import { AppButton, Avatar } from '../components/ui';
import { type DraftLine } from '../lib/demoData';
import { fmtPoints } from '../lib/format';
import { colors } from '../theme';

export interface PendingState {
  lines: DraftLine[];
  submitPressed?: boolean;
  /** Draw the "saved" chip — the draft autosaves as the dealer builds it. */
  saved?: boolean;
}

/**
 * The "pending submission" panel that now sits on top of the Warriors & points
 * screen. This is the heart of the new flow: work no longer awards on the spot —
 * it lands here, the dealer keeps adding to it through the shift, and only the
 * final submit (with a hardcopy photo) moves the leaderboard.
 */
export function PendingSubmission({ lines, submitPressed, saved = true }: PendingState) {
  const total = lines.reduce((s, l) => s + l.points, 0);

  // Group by warrior, preserving the order they were added.
  const groups: { name: string; lines: DraftLine[]; total: number }[] = [];
  for (const line of lines) {
    let g = groups.find((x) => x.name === line.warriorName);
    if (!g) {
      g = { name: line.warriorName, lines: [], total: 0 };
      groups.push(g);
    }
    g.lines.push(line);
    g.total += line.points;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderRadius: 18,
        border: `1.5px solid ${colors.brand}55`,
        background: colors.surface,
        padding: 12,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>
            जमा करने के लिए तैयार
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            फ़ाइनल जमा करने पर ही पॉइंट मिलेंगे
          </div>
        </div>
        {saved ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              borderRadius: 999,
              background: colors.successSoft,
              color: colors.success,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <CloudCheck size={12} color={colors.success} />
            सेव हो गया
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map((g) => (
          <div
            key={g.name}
            style={{
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.surface2,
              padding: 9,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Avatar name={g.name} size={26} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: colors.text }}>
                {g.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
                {fmtPoints(g.total)}
              </span>
            </div>

            {g.lines.map((l, i) => (
              <div
                key={`${l.labelHi}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 9,
                  background: colors.surface,
                  padding: '7px 8px',
                  marginTop: i === 0 ? 0 : 5,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, color: colors.text }}>{l.labelHi}</div>
                  {/* For a catch-all work the description IS the work. */}
                  {l.note ? (
                    <div style={{ fontSize: 11.5, color: colors.textMuted, fontStyle: 'italic' }}>
                      {l.note}
                    </div>
                  ) : null}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, flexShrink: 0 }}>
                  {fmtPoints(l.points)}
                </span>
                <span style={{ color: colors.textSubtle, flexShrink: 0, display: 'flex' }}>
                  <Trash size={14} color={colors.textSubtle} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: colors.text }}>
        {`कुल ${fmtPoints(total)} पॉइंट`}
      </div>

      <AppButton fullWidth pressed={submitPressed}>
        फ़ाइनल जमा करें
      </AppButton>
    </div>
  );
}
