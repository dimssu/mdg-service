import * as React from 'react';

import { Camera, Check, X } from '../components/icons';
import { AppButton } from '../components/ui';
import { fmtPoints } from '../lib/format';
import { colors } from '../theme';

export interface FinalizeState {
  totalPoints: number;
  /** No photo yet → the submit button is inert and the slot asks for one. */
  photoTaken?: boolean;
  photoPressed?: boolean;
  submitPressed?: boolean;
  submitting?: boolean;
}

/**
 * The last step of the new flow: the hardcopy photo. Points only reach the ledger
 * once the dealer photographs the paper sheet the work was recorded on, so the
 * digital record always has a physical counterpart to reconcile against — which
 * is why the submit button stays inert until the photo exists.
 */
export function FinalizeSheet({
  totalPoints,
  photoTaken = false,
  photoPressed,
  submitPressed,
  submitting,
}: FinalizeState) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 560,
          background: colors.surface,
          borderRadius: '22px 22px 0 0',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(15,23,42,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: `1px solid ${colors.border}`,
            padding: '10px 12px',
          }}
        >
          <div style={{ width: 40 }} />
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 600,
              color: colors.text,
            }}
          >
            पॉइंट जमा करें
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

        <div style={{ flex: 1, padding: '16px 16px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, padding: '0 2px' }}>
            हार्डकॉपी फोटो
          </div>
          <div style={{ fontSize: 12.5, color: colors.textMuted, padding: '4px 2px 10px' }}>
            जिस कागज़ पर काम लिखा है, उसकी फोटो खींचिए।
          </div>

          {/* The photo slot: an empty dashed frame, or the captured sheet. */}
          <div
            style={{
              height: 236,
              borderRadius: 16,
              border: photoTaken
                ? `1px solid ${colors.border}`
                : `2px dashed ${colors.borderStrong}`,
              background: photoTaken ? '#e7e5e4' : colors.surface2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {photoTaken ? (
              <>
                {/* A stand-in for the photographed paper sheet. */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 14,
                    background: '#fdfcfb',
                    borderRadius: 8,
                    boxShadow: '0 2px 10px rgba(15,23,42,0.18)',
                    transform: 'rotate(-1.2deg)',
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted }}>
                    स्टाफ रजिस्टर — 6 जुलाई
                  </div>
                  {[62, 88, 74, 91, 55].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        height: 7,
                        width: `${w}%`,
                        background: '#d6d3d1',
                        borderRadius: 3,
                        marginTop: 9,
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 999,
                    background: colors.success,
                    color: '#fff',
                    padding: '4px 9px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <Check size={12} color="#fff" />
                  फोटो लग गई
                </span>
              </>
            ) : (
              <>
                <Camera size={34} color={colors.textSubtle} />
                <span style={{ fontSize: 13, color: colors.textSubtle }}>अभी कोई फोटो नहीं</span>
              </>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <AppButton fullWidth variant="secondary" pressed={photoPressed}>
              {photoTaken ? 'फोटो बदलें' : 'फोटो खींचें'}
            </AppButton>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${colors.border}`, padding: 12 }}>
          {/* Inert until the photo exists — the paper record is the whole point. */}
          <AppButton fullWidth pressed={submitPressed} disabled={!photoTaken}>
            {submitting ? 'जमा हो रहा है…' : `${fmtPoints(totalPoints)} पॉइंट जमा करें`}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
